/**
 * Analytics Cache Service
 * Background service to update analytics cache tables
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// =====================================================
// Daily Cache Update
// =====================================================

export async function updateDailyCache(vendorId: string, date: Date) {
  try {
    const dateStr = date.toISOString().split("T")[0];

    // Call the database function
    const { error } = await supabase.rpc("update_analytics_daily_cache", {
      p_vendor_id: vendorId,
      p_date: dateStr,
    });

    if (error) throw error;

    logger.info(`Updated daily cache for vendor ${vendorId} on ${dateStr}`);
    return { success: true };
  } catch (error: any) {
    logger.error(`Failed to update daily cache: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function updateDailyCacheForAllVendors(date?: Date) {
  const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

  try {
    // Get all active vendors
    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("id")
      .eq("status", "active");

    if (error) throw error;

    if (!vendors || vendors.length === 0) {
      logger.info("No active vendors found");
      return { success: true, updated: 0 };
    }

    // Update cache for each vendor
    const results = await Promise.allSettled(
      vendors.map((vendor) => updateDailyCache(vendor.id, targetDate)),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    logger.info(
      `Daily cache update complete: ${successful} successful, ${failed} failed for ${targetDate.toISOString().split("T")[0]}`,
    );

    return { success: true, updated: successful, failed };
  } catch (error: any) {
    logger.error(`Failed to update daily cache for all vendors: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// =====================================================
// Product Cache Update
// =====================================================

export async function updateProductCache(vendorId: string, startDate: Date, endDate: Date) {
  try {
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // Delete existing cache for this period
    await supabase
      .from("analytics_product_cache")
      .delete()
      .eq("vendor_id", vendorId)
      .eq("period_start", startStr)
      .eq("period_end", endStr);

    // Get product sales data
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, cost_price, regular_price, primary_category_id")
      .eq("vendor_id", vendorId)
      .eq("status", "published");

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      logger.info(`No products found for vendor ${vendorId}`);
      return { success: true };
    }

    // Get sales data for each product
    const cacheData = await Promise.all(
      products.map(async (product) => {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select(
            `
            quantity,
            line_total,
            orders!inner(order_date, status)
          `,
          )
          .eq("product_id", product.id)
          .gte("orders.order_date", startStr)
          .lte("orders.order_date", endStr)
          .in("orders.status", ["completed", "processing"]);

        if (!orderItems || orderItems.length === 0) {
          return null;
        }

        const units_sold = orderItems.length;
        const quantity_sold = orderItems.reduce(
          (sum, item: any) => sum + parseFloat(item.quantity || 0),
          0,
        );
        const revenue = orderItems.reduce(
          (sum, item: any) => sum + parseFloat(item.line_total || 0),
          0,
        );
        const cost = quantity_sold * parseFloat(product.cost_price || "0");
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          vendor_id: vendorId,
          product_id: product.id,
          location_id: null,
          period_start: startStr,
          period_end: endStr,
          units_sold,
          quantity_sold,
          revenue,
          cost,
          profit,
          margin,
          total_orders: units_sold,
          avg_price: units_sold > 0 ? revenue / units_sold : 0,
        };
      }),
    );

    // Filter out null values and insert
    const validCacheData = cacheData.filter((d) => d !== null);

    if (validCacheData.length > 0) {
      const { error: insertError } = await supabase
        .from("analytics_product_cache")
        .insert(validCacheData);

      if (insertError) throw insertError;
    }

    logger.info(
      `Updated product cache for vendor ${vendorId}: ${validCacheData.length} products`,
    );
    return { success: true, products: validCacheData.length };
  } catch (error: any) {
    logger.error(`Failed to update product cache: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function updateProductCacheForAllVendors() {
  try {
    // Update for last 30 days
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("id")
      .eq("status", "active");

    if (error) throw error;

    if (!vendors || vendors.length === 0) {
      return { success: true, updated: 0 };
    }

    const results = await Promise.allSettled(
      vendors.map((vendor) => updateProductCache(vendor.id, startDate, endDate)),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    logger.info(`Product cache update complete: ${successful} successful, ${failed} failed`);

    return { success: true, updated: successful, failed };
  } catch (error: any) {
    logger.error(`Failed to update product cache for all vendors: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// =====================================================
// Employee Cache Update
// =====================================================

export async function updateEmployeeCache(vendorId: string, startDate: Date, endDate: Date) {
  try {
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // Delete existing cache
    await supabase
      .from("analytics_employee_cache")
      .delete()
      .eq("vendor_id", vendorId)
      .eq("period_start", startStr)
      .eq("period_end", endStr);

    // Get employee sales from POS transactions
    const { data: transactions, error } = await supabase
      .from("pos_transactions")
      .select("user_id, total_amount, subtotal, discount_amount, tip_amount, cost_of_goods")
      .eq("vendor_id", vendorId)
      .gte("transaction_date", startStr)
      .lte("transaction_date", endStr)
      .eq("payment_status", "completed")
      .not("user_id", "is", null);

    if (error) throw error;

    if (!transactions || transactions.length === 0) {
      return { success: true };
    }

    // Group by employee
    const employeeData = transactions.reduce((acc: any, tx: any) => {
      const empId = tx.user_id;
      if (!acc[empId]) {
        acc[empId] = {
          vendor_id: vendorId,
          employee_id: empId,
          location_id: null,
          period_start: startStr,
          period_end: endStr,
          total_sales: 0,
          total_transactions: 0,
          total_discounts: 0,
          tips_collected: 0,
          cost_of_goods: 0,
          gross_profit: 0,
        };
      }

      acc[empId].total_sales += parseFloat(tx.total_amount || 0);
      acc[empId].total_transactions += 1;
      acc[empId].total_discounts += parseFloat(tx.discount_amount || 0);
      acc[empId].tips_collected += parseFloat(tx.tip_amount || 0);
      acc[empId].cost_of_goods += parseFloat(tx.cost_of_goods || 0);

      return acc;
    }, {});

    // Calculate derived metrics
    const cacheData = Object.values(employeeData).map((emp: any) => ({
      ...emp,
      gross_profit: emp.total_sales - emp.cost_of_goods,
      gross_margin: emp.total_sales > 0 ? ((emp.total_sales - emp.cost_of_goods) / emp.total_sales) * 100 : 0,
      avg_transaction_value:
        emp.total_transactions > 0 ? emp.total_sales / emp.total_transactions : 0,
    }));

    if (cacheData.length > 0) {
      const { error: insertError } = await supabase
        .from("analytics_employee_cache")
        .insert(cacheData);

      if (insertError) throw insertError;
    }

    logger.info(`Updated employee cache for vendor ${vendorId}: ${cacheData.length} employees`);
    return { success: true, employees: cacheData.length };
  } catch (error: any) {
    logger.error(`Failed to update employee cache: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// =====================================================
// Cleanup Functions
// =====================================================

export async function cleanupExpiredExports() {
  try {
    const { data, error } = await supabase
      .from("report_exports")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .eq("status", "completed");

    if (error) throw error;

    logger.info(`Cleaned up expired exports`);
    return { success: true };
  } catch (error: any) {
    logger.error(`Failed to cleanup expired exports: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// =====================================================
// Cron Job Exports
// =====================================================

export const analyticsJobs = {
  // Runs daily at 1 AM - update yesterday's cache
  updateDailyCache: {
    schedule: "0 1 * * *",
    task: updateDailyCacheForAllVendors,
  },

  // Runs every 6 hours - update product cache
  updateProductCache: {
    schedule: "0 */6 * * *",
    task: updateProductCacheForAllVendors,
  },

  // Runs daily at 3 AM - cleanup expired exports
  cleanupExports: {
    schedule: "0 3 * * *",
    task: cleanupExpiredExports,
  },
};
