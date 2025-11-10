import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { productCache, vendorCache, inventoryCache } from "@/lib/cache-manager";
import { jobQueue } from "@/lib/job-queue";
import { withErrorHandler } from "@/lib/api-handler";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { productId, submission_id, action } = body; // action: 'approve' or 'reject'

    const id = productId || submission_id;

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    if (action === "approve") {
      // Update product status to published
      const { data: product, error: updateError } = await supabase
        .from("products")
        .update({
          status: "published",
          date_on_sale_from: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Error approving product:", updateError);
        }
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Invalidate caches after approval
      productCache.invalidatePattern("products:.*");
      vendorCache.invalidatePattern(`.*vendorId:${product.vendor_id}.*`);
      inventoryCache.clear();

      // Get vendor info for notification
      const { data: vendor } = await supabase
        .from("vendors")
        .select("email, store_name")
        .eq("id", product.vendor_id)
        .single();

      // Queue email notification to vendor
      if (vendor?.email) {
        await jobQueue.enqueue(
          "send-email",
          {
            to: vendor.email,
            subject: "Product Approved!",
            html: `
              <h2>Your Product Has Been Approved!</h2>
              <p>Good news! Your product <strong>${product.name}</strong> has been approved and is now live.</p>
              <p>Customers can now purchase this product from your store.</p>
              <p>Thank you for using our platform!</p>
            `,
            productId: product.id,
            vendorId: product.vendor_id,
          },
          { priority: 2 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Product approved and published",
        product,
      });
    } else if (action === "reject") {
      // Update product status to archived
      const { data: product, error: updateError } = await supabase
        .from("products")
        .update({
          status: "archived",
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Error rejecting product:", updateError);
        }
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Invalidate caches after rejection
      productCache.invalidatePattern("products:.*");
      vendorCache.invalidatePattern(`.*vendorId:${product.vendor_id}.*`);

      // Get vendor info for notification
      const { data: vendor } = await supabase
        .from("vendors")
        .select("email, store_name")
        .eq("id", product.vendor_id)
        .single();

      // Queue email notification to vendor
      if (vendor?.email) {
        await jobQueue.enqueue(
          "send-email",
          {
            to: vendor.email,
            subject: "Product Submission Update",
            html: `
              <h2>Product Submission Update</h2>
              <p>Your product <strong>${product.name}</strong> has been reviewed.</p>
              <p>Unfortunately, it does not meet our current requirements.</p>
              <p>Please review our product guidelines and feel free to submit again.</p>
            `,
            productId: product.id,
            vendorId: product.vendor_id,
          },
          { priority: 2 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Product rejected",
        product,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Approve product error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
