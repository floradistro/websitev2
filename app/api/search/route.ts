import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const vendorId = searchParams.get("vendorId");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const supabase = getServiceSupabase();
    const searchTerm = `%${query.toLowerCase()}%`;

    // Search products (only if vendorId provided)
    let products: any[] = [];
    if (vendorId) {
      const { data } = await supabase
        .from("products")
        .select("id, name, category:categories(name)")
        .eq("vendor_id", vendorId)
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);
      products = data || [];
    }

    // Search orders (only if vendorId provided)
    let orders: any[] = [];
    if (vendorId) {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status")
        .eq("vendor_id", vendorId)
        .or(`order_number.ilike.${searchTerm},customer_name.ilike.${searchTerm}`)
        .limit(5);
      orders = data || [];
    }

    // Search customers (only if vendorId provided)
    let customers: any[] = [];
    if (vendorId) {
      const { data } = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .eq("vendor_id", vendorId)
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
        .limit(5);
      customers = data || [];
    }

    // App shortcuts
    const apps = [
      { key: "pos", name: "Point of Sale", route: "/pos/register" },
      { key: "orders", name: "Order Queue", route: "/pos/orders" },
      { key: "products", name: "Products", route: "/vendor/products" },
      { key: "inventory", name: "Inventory", route: "/vendor/inventory" },
      { key: "customers", name: "Customers", route: "/vendor/customers" },
      { key: "analytics", name: "Analytics", route: "/vendor/dashboard" },
      { key: "marketing", name: "Marketing", route: "/vendor/marketing" },
      { key: "tv_menus", name: "Digital Menus", route: "/vendor/tv-menus" },
      { key: "code", name: "Code", route: "/vendor/code" },
    ].filter((app) => app.name.toLowerCase().includes(query.toLowerCase()));

    // Build results array
    const results = [
      ...(apps || []).map((app) => ({
        id: app.key,
        type: "app" as const,
        title: app.name,
        subtitle: "Application",
        route: app.route,
      })),
      ...(products || []).map((product: any) => ({
        id: product.id,
        type: "product" as const,
        title: product.name,
        subtitle: product.category?.name || "Product",
        route: `/vendor/products?id=${product.id}`,
      })),
      ...(orders || []).map((order: any) => ({
        id: order.id,
        type: "order" as const,
        title: `Order #${order.order_number}`,
        subtitle: `${order.customer_name || "Guest"} • ${order.status}`,
        route: `/pos/orders?id=${order.id}`,
      })),
      ...(customers || []).map((customer: any) => ({
        id: customer.id,
        type: "customer" as const,
        title: customer.name,
        subtitle: customer.email || customer.phone || "Customer",
        route: `/vendor/customers?id=${customer.id}`,
      })),
    ];

    return NextResponse.json({ success: true, results });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Search error:", error);
    }
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
