import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const search = searchParams.get("search") || "";

    if (!vendorId) {
      return NextResponse.json({ error: "Missing vendorId parameter" }, { status: 400 });
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from("vendor_customers")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId);

    let data: any[] = [];

    // Strategy: If search, fetch ALL customers in chunks (Supabase max 1000/query)
    // If no search, return first 1000 ordered by loyalty points
    if (search) {
      // Fetch ALL customers in chunks of 1000
      const CHUNK_SIZE = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: chunk, error: chunkError } = await supabase
          .from("vendor_customers")
          .select(
            `
            id,
            vendor_customer_number,
            loyalty_points,
            loyalty_tier,
            total_orders,
            total_spent,
            last_purchase_date,
            customer_id,
            customers (
              id,
              first_name,
              last_name,
              email,
              phone,
              display_name
            )
          `,
          )
          .eq("vendor_id", vendorId)
          .range(offset, offset + CHUNK_SIZE - 1);

        if (chunkError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error fetching chunk:", chunkError);
          }
          break;
        }

        if (!chunk || chunk.length === 0) {
          break;
        }

        data.push(...chunk);
        offset += CHUNK_SIZE;
        hasMore = chunk.length === CHUNK_SIZE;
      }
    } else {
      // No search - get more than 1000 customers and sort alphabetically
      // This ensures customers with 0 points are visible in the dropdown
      const FETCH_SIZE = 2000;
      const { data: firstBatch, error: batchError } = await supabase
        .from("vendor_customers")
        .select(
          `
          id,
          vendor_customer_number,
          loyalty_points,
          loyalty_tier,
          total_orders,
          total_spent,
          last_purchase_date,
          customer_id,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone,
            display_name
          )
        `,
        )
        .eq("vendor_id", vendorId)
        .limit(FETCH_SIZE);

      if (batchError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error fetching customers:", batchError);
        }
        return NextResponse.json({ error: batchError.message }, { status: 500 });
      }

      // Sort alphabetically in-memory, filtering out customers without names
      data = (firstBatch || [])
        .filter((vc: any) => vc.customers && (vc.customers.first_name || vc.customers.last_name))
        .sort((a: any, b: any) => {
          const nameA = `${a.customers?.first_name || ""} ${a.customers?.last_name || ""}`
            .trim()
            .toLowerCase();
          const nameB = `${b.customers?.first_name || ""} ${b.customers?.last_name || ""}`
            .trim()
            .toLowerCase();
          return nameA.localeCompare(nameB);
        })
        .slice(0, 1000); // Take first 1000 after sorting
    }

    // Transform and filter data
    let customers = (data || [])
      .filter((vc: any) => vc.customers) // Filter out null customers
      .map((vc: any) => ({
        id: vc.customers.id,
        first_name: vc.customers.first_name || "",
        last_name: vc.customers.last_name || "",
        email: vc.customers.email,
        phone: vc.customers.phone,
        display_name: vc.customers.display_name,
        loyalty_points: vc.loyalty_points || 0,
        loyalty_tier: vc.loyalty_tier || "bronze",
        vendor_customer_number: vc.vendor_customer_number,
        total_orders: vc.total_orders || 0,
        total_spent: vc.total_spent || 0,
      }));

    // Apply smart search filter if search query provided
    if (search) {
      const searchLower = search.toLowerCase().trim();

      // Split search into words for smart matching
      const searchWords = searchLower.split(/\s+/).filter((w) => w.length > 0);

      // Score and filter customers
      const scoredCustomers = customers.map((customer: any) => {
        const firstName = (customer.first_name || "").toLowerCase();
        const lastName = (customer.last_name || "").toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const displayName = (customer.display_name || "").toLowerCase();
        const email = (customer.email || "").toLowerCase();
        const phone = (customer.phone || "").replace(/\D/g, "");
        const customerNumber = (customer.vendor_customer_number || "").toLowerCase();

        let score = 0;
        let matchesAll = true;

        for (const word of searchWords) {
          const searchPhone = word.replace(/\D/g, "");
          let wordMatched = false;
          let wordScore = 0;

          // Exact match (highest priority)
          if (firstName === word || lastName === word) {
            wordScore = 1000;
            wordMatched = true;
          }
          // Starts with match (high priority)
          else if (firstName.startsWith(word)) {
            wordScore = 100;
            wordMatched = true;
          } else if (lastName.startsWith(word)) {
            wordScore = 90;
            wordMatched = true;
          }
          // Word boundary match in full name (medium-high priority)
          else if (new RegExp(`\\b${word}`).test(fullName)) {
            wordScore = 50;
            wordMatched = true;
          }
          // Display name starts with
          else if (displayName.startsWith(word)) {
            wordScore = 45;
            wordMatched = true;
          }
          // Email starts with
          else if (email.startsWith(word)) {
            wordScore = 40;
            wordMatched = true;
          }
          // Customer number starts with
          else if (customerNumber.startsWith(word)) {
            wordScore = 35;
            wordMatched = true;
          }
          // Phone match (at least 3 digits)
          else if (searchPhone.length >= 3 && phone.includes(searchPhone)) {
            wordScore = 30;
            wordMatched = true;
          }
          // Contains anywhere (lowest priority)
          else if (
            firstName.includes(word) ||
            lastName.includes(word) ||
            displayName.includes(word) ||
            email.includes(word) ||
            customerNumber.includes(word)
          ) {
            wordScore = 10;
            wordMatched = true;
          }

          if (!wordMatched) {
            matchesAll = false;
            break;
          }

          score += wordScore;
        }

        return { customer, score, matchesAll };
      });

      // Filter to only matching customers and sort by score
      customers = scoredCustomers
        .filter(({ matchesAll }) => matchesAll)
        .sort((a, b) => b.score - a.score)
        .map(({ customer }) => customer);
    }

    return NextResponse.json({ customers, total: totalCount || 0 });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in customers endpoint:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
