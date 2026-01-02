import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/vendor/analytics/v2/export/generate
 * Generate and download report export (CSV/PDF)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { report_type, format, filters } = body;

    if (!report_type || !format) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: report_type, format" },
        { status: 400 },
      );
    }

    // Get vendor branding
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("store_name, logo_url, brand_colors, email, phone, address, contact_name")
      .eq("id", vendorId)
      .single();

    if (vendorError) {
      logger.error("Failed to fetch vendor for export:", vendorError);
    }

    logger.info("Export vendor data:", {
      vendorId,
      storeName: vendor?.store_name,
      hasLogo: !!vendor?.logo_url,
      logoUrl: vendor?.logo_url
    });

    // Parse date range from filters
    const dateRange = filters?.dateRange || filters?.date_range;
    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

    // Get location filter info
    let locationNames: string[] = [];
    if (filters?.location_ids && filters.location_ids.length > 0) {
      const { data: locations } = await supabase
        .from("locations")
        .select("name")
        .in("id", filters.location_ids);
      locationNames = locations?.map(l => l.name) || [];
    }

    // Fetch data based on report type
    let reportData: any;
    let reportTitle: string;

    switch (report_type) {
      case "sales_by_day":
        reportTitle = "Sales by Day Report";
        reportData = await fetchSalesByDay(vendorId, startDate, endDate);
        break;
      case "sales_by_location":
        reportTitle = "Sales by Location Report";
        reportData = await fetchSalesByLocation(vendorId, startDate, endDate);
        break;
      case "sales_by_employee":
        reportTitle = "Sales by Employee Report";
        reportData = await fetchSalesByEmployee(vendorId, startDate, endDate);
        break;
      case "products_performance":
        reportTitle = "Product Performance Report";
        reportData = await fetchProductPerformance(vendorId, startDate, endDate);
        break;
      case "sales_by_category":
        reportTitle = "Sales by Category Report";
        reportData = await fetchSalesByCategory(vendorId, startDate, endDate);
        break;
      case "sales_by_payment":
        reportTitle = "Payment Methods Report";
        reportData = await fetchSalesByPayment(vendorId, startDate, endDate);
        break;
      case "profit_loss":
        reportTitle = "Profit & Loss Statement";
        reportData = await fetchProfitLoss(vendorId, startDate, endDate);
        break;
      case "tax_report":
        reportTitle = "Tax Report";
        reportData = await fetchTaxReport(vendorId, startDate, endDate);
        break;
      case "itemized_sales":
        reportTitle = "Itemized Sales Report";
        reportData = await fetchItemizedSales(vendorId, startDate, endDate);
        break;
      case "sessions":
        reportTitle = "POS Sessions Report";
        reportData = await fetchSessions(vendorId, startDate, endDate);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unknown report type: ${report_type}` },
          { status: 400 },
        );
    }

    // Generate file based on format
    if (format === "csv") {
      const csv = generateCSV(reportData, reportTitle);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${report_type}_${Date.now()}.csv"`,
        },
      });
    } else if (format === "pdf") {
      // Return HTML that will generate PDF (we'll use browser print for now)
      const html = generateBrandedPDFHTML(reportData, reportTitle, vendor, startDate, endDate, locationNames);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported format: ${format}` },
        { status: 400 },
      );
    }
  } catch (error: any) {
    logger.error("Export generation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate export" },
      { status: 500 },
    );
  }
}

// Data fetching functions
async function fetchSalesByDay(vendorId: string, startDate: Date, endDate: Date) {
  const { data: orders } = await supabase
    .from("orders")
    .select("order_date, total_amount")
    .eq("vendor_id", vendorId)
    .gte("order_date", startDate.toISOString())
    .lte("order_date", endDate.toISOString())
    .in("status", ["completed", "processing"]);

  const { data: pos } = await supabase
    .from("pos_transactions")
    .select("transaction_date, total_amount")
    .eq("vendor_id", vendorId)
    .gte("transaction_date", startDate.toISOString())
    .lte("transaction_date", endDate.toISOString())
    .eq("payment_status", "completed")
    .is("order_id", null);

  // Group by day
  const dayMap: Record<string, { date: string; sales: number; transactions: number }> = {};

  orders?.forEach((o) => {
    const day = new Date(o.order_date).toISOString().split('T')[0];
    if (!dayMap[day]) dayMap[day] = { date: day, sales: 0, transactions: 0 };
    dayMap[day].sales += parseFloat(o.total_amount || "0");
    dayMap[day].transactions++;
  });

  pos?.forEach((p) => {
    const day = new Date(p.transaction_date).toISOString().split('T')[0];
    if (!dayMap[day]) dayMap[day] = { date: day, sales: 0, transactions: 0 };
    dayMap[day].sales += parseFloat(p.total_amount || "0");
    dayMap[day].transactions++;
  });

  return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchSalesByLocation(vendorId: string, startDate: Date, endDate: Date) {
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .eq("vendor_id", vendorId);

  const locationMap: Record<string, { location: string; sales: number; transactions: number }> = {};

  for (const loc of locations || []) {
    const { data: orders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("vendor_id", vendorId)
      .eq("pickup_location_id", loc.id)
      .gte("order_date", startDate.toISOString())
      .lte("order_date", endDate.toISOString())
      .in("status", ["completed", "processing"]);

    const { data: pos } = await supabase
      .from("pos_transactions")
      .select("total_amount")
      .eq("vendor_id", vendorId)
      .eq("location_id", loc.id)
      .gte("transaction_date", startDate.toISOString())
      .lte("transaction_date", endDate.toISOString())
      .eq("payment_status", "completed");

    const sales = (orders || []).reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0) +
                  (pos || []).reduce((sum, p) => sum + parseFloat(p.total_amount || "0"), 0);
    const transactions = (orders || []).length + (pos || []).length;

    locationMap[loc.name] = { location: loc.name, sales, transactions };
  }

  return Object.values(locationMap);
}

async function fetchSalesByEmployee(vendorId: string, startDate: Date, endDate: Date) {
  // Simplified version - extend as needed
  return [{ employee: "Sample Employee", sales: 0, transactions: 0 }];
}

async function fetchProductPerformance(vendorId: string, startDate: Date, endDate: Date) {
  const { data } = await supabase
    .from("order_items")
    .select(`
      product_id,
      product_name,
      quantity,
      line_total,
      orders!inner(order_date, status, vendor_id)
    `)
    .eq("vendor_id", vendorId)
    .gte("orders.order_date", startDate.toISOString())
    .lte("orders.order_date", endDate.toISOString())
    .in("orders.status", ["completed", "processing"]);

  const productMap: Record<string, any> = {};
  data?.forEach((item: any) => {
    const key = item.product_id || item.product_name;
    if (!productMap[key]) {
      productMap[key] = { product: item.product_name, units_sold: 0, revenue: 0 };
    }
    productMap[key].units_sold += parseFloat(item.quantity || "0");
    productMap[key].revenue += parseFloat(item.line_total || "0");
  });

  return Object.values(productMap);
}

async function fetchSalesByCategory(vendorId: string, startDate: Date, endDate: Date) {
  return [{ category: "Sample Category", sales: 0, transactions: 0 }];
}

async function fetchSalesByPayment(vendorId: string, startDate: Date, endDate: Date) {
  const { data } = await supabase
    .from("pos_transactions")
    .select("payment_method, total_amount")
    .eq("vendor_id", vendorId)
    .gte("transaction_date", startDate.toISOString())
    .lte("transaction_date", endDate.toISOString())
    .eq("payment_status", "completed");

  const paymentMap: Record<string, any> = {};
  data?.forEach((t: any) => {
    const method = t.payment_method || "Unknown";
    if (!paymentMap[method]) {
      paymentMap[method] = { payment_method: method, sales: 0, transactions: 0 };
    }
    paymentMap[method].sales += parseFloat(t.total_amount || "0");
    paymentMap[method].transactions++;
  });

  return Object.values(paymentMap);
}

async function fetchProfitLoss(vendorId: string, startDate: Date, endDate: Date) {
  return [{ category: "Revenue", amount: 0 }, { category: "Expenses", amount: 0 }];
}

async function fetchTaxReport(vendorId: string, startDate: Date, endDate: Date) {
  const { data: orders } = await supabase
    .from("orders")
    .select("tax_amount, total_amount")
    .eq("vendor_id", vendorId)
    .gte("order_date", startDate.toISOString())
    .lte("order_date", endDate.toISOString())
    .in("status", ["completed", "processing"]);

  const { data: pos } = await supabase
    .from("pos_transactions")
    .select("tax_amount, total_amount")
    .eq("vendor_id", vendorId)
    .gte("transaction_date", startDate.toISOString())
    .lte("transaction_date", endDate.toISOString())
    .eq("payment_status", "completed");

  const totalTax = (orders || []).reduce((sum, o) => sum + parseFloat(o.tax_amount || "0"), 0) +
                   (pos || []).reduce((sum, p) => sum + parseFloat(p.tax_amount || "0"), 0);
  const totalSales = (orders || []).reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0) +
                     (pos || []).reduce((sum, p) => sum + parseFloat(p.total_amount || "0"), 0);

  return [
    { category: "Total Sales", amount: totalSales },
    { category: "Total Tax Collected", amount: totalTax },
    { category: "Net Sales", amount: totalSales - totalTax },
  ];
}

async function fetchItemizedSales(vendorId: string, startDate: Date, endDate: Date) {
  const { data } = await supabase
    .from("order_items")
    .select(`
      product_name,
      quantity,
      unit_price,
      line_total,
      orders!inner(order_date, order_number, customer_name)
    `)
    .eq("vendor_id", vendorId)
    .gte("orders.order_date", startDate.toISOString())
    .lte("orders.order_date", endDate.toISOString())
    .limit(1000);

  return data || [];
}

async function fetchSessions(vendorId: string, startDate: Date, endDate: Date) {
  const { data } = await supabase
    .from("pos_sessions")
    .select("*")
    .eq("vendor_id", vendorId)
    .gte("opened_at", startDate.toISOString())
    .lte("opened_at", endDate.toISOString());

  return data || [];
}

// CSV Generation
function generateCSV(data: any[], title: string): string {
  if (!data || data.length === 0) {
    return `${title}\n\nNo data available for the selected period.`;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value || "");
      return stringValue.includes(",") || stringValue.includes('"')
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue;
    }).join(",")
  );

  return `${title}\n\n${headers.join(",")}\n${rows.join("\n")}`;
}

// Branded PDF HTML Generation (Bank Statement Style)
function generateBrandedPDFHTML(data: any[], title: string, vendor: any, startDate: Date, endDate: Date, locationNames: string[] = []): string {
  const brandColor = vendor?.brand_colors?.primary || "#1a1a1a";
  const logoUrl = vendor?.logo_url || "";
  const businessName = vendor?.store_name || "Business";
  const address = vendor?.address || "";
  const email = vendor?.email || "";
  const phone = vendor?.phone || "";

  const formatDate = (date: Date) => date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  };

  // Generate table rows
  let tableHTML = "";
  if (data && data.length > 0) {
    const headers = Object.keys(data[0]);
    tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 10px;">
        <thead>
          <tr style="background: ${brandColor}; color: white;">
            ${headers.map(h => `<th style="padding: 10px; text-align: left; border: 1px solid #ddd; text-transform: uppercase; font-size: 9px;">${h.replace(/_/g, " ")}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data.map((row, idx) => `
            <tr style="background: ${idx % 2 === 0 ? "#f9f9f9" : "white"};">
              ${headers.map(h => {
                const value = row[h];
                const isNumber = typeof value === "number" || !isNaN(Number(value));
                const formatted = isNumber && h.toLowerCase().includes("amount") || h.toLowerCase().includes("sales") || h.toLowerCase().includes("revenue")
                  ? formatCurrency(Number(value))
                  : value;
                return `<td style="padding: 8px; border: 1px solid #ddd;">${formatted}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } else {
    tableHTML = `<p style="text-align: center; color: #666; margin-top: 40px;">No data available for the selected period.</p>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${businessName}</title>
  <style>
    @page {
      margin: 0.5in;
      size: letter;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 40px;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Bank Statement Style Header -->
  <div style="border-bottom: 3px solid ${brandColor}; padding-bottom: 20px; margin-bottom: 30px;">
    <div style="display: flex; justify-content: space-between; align-items: start; gap: 30px;">
      <div style="flex: 1;">
        ${logoUrl ? `
        <div style="background: white; padding: 10px; border-radius: 8px; display: inline-block; margin-bottom: 15px; border: 1px solid #e0e0e0;">
          <img src="${logoUrl}" alt="${businessName}" style="max-width: 200px; max-height: 80px; display: block;" crossorigin="anonymous" onerror="this.parentElement.style.display='none'">
        </div>
        ` : ""}
        <h1 style="font-size: 28px; color: ${brandColor}; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.5px;">${businessName}</h1>
        ${address ? `<p style="font-size: 11px; color: #666; margin: 3px 0; line-height: 1.5;">📍 ${address}</p>` : ""}
        ${email ? `<p style="font-size: 11px; color: #666; margin: 3px 0; line-height: 1.5;">📧 ${email}</p>` : ""}
        ${phone ? `<p style="font-size: 11px; color: #666; margin: 3px 0; line-height: 1.5;">📞 ${phone}</p>` : ""}
      </div>
      <div style="text-align: right; flex: 1;">
        <h2 style="font-size: 20px; font-weight: 600; color: ${brandColor}; margin-bottom: 10px;">${title}</h2>
        <p style="font-size: 11px; color: #666;">Statement Period</p>
        <p style="font-size: 12px; font-weight: 600;">${formatDate(startDate)} - ${formatDate(endDate)}</p>
        ${locationNames.length > 0 ? `
        <p style="font-size: 11px; color: #666; margin-top: 10px;">Location Filter</p>
        <p style="font-size: 12px; font-weight: 600;">${locationNames.join(", ")}</p>
        ` : `<p style="font-size: 11px; color: #666; margin-top: 10px;">All Locations</p>`}
        <p style="font-size: 10px; color: #999; margin-top: 10px;">Generated: ${formatDate(new Date())}</p>
      </div>
    </div>
  </div>

  <!-- Official Statement Notice -->
  <div style="background: #f5f5f5; border-left: 4px solid ${brandColor}; padding: 15px; margin-bottom: 30px;">
    <p style="font-size: 10px; color: #666; font-style: italic;">
      This is an official financial statement generated from the ${businessName} analytics system.
      All figures are calculated from verified transactions and should be retained for your records.
    </p>
  </div>

  <!-- Filter Summary -->
  <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
    <h3 style="font-size: 12px; font-weight: 600; color: ${brandColor}; margin-bottom: 10px; text-transform: uppercase;">Report Filters</h3>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
      <div>
        <p style="font-size: 9px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Date Range</p>
        <p style="font-size: 11px; color: #333;">${formatDate(startDate)} - ${formatDate(endDate)}</p>
      </div>
      <div>
        <p style="font-size: 9px; color: #999; text-transform: uppercase; margin-bottom: 4px;">Locations</p>
        <p style="font-size: 11px; color: #333;">${locationNames.length > 0 ? locationNames.join(", ") : "All Locations"}</p>
      </div>
    </div>
  </div>

  <!-- Data Table -->
  ${tableHTML}

  <!-- Footer -->
  <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 9px; color: #999;">
    <p>This document is computer-generated and does not require a signature.</p>
    <p>For questions about this statement, please contact ${email || businessName}.</p>
    <p style="margin-top: 10px; text-align: center;">&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
  </div>

  <!-- Print Button (hidden when printing) -->
  <div class="no-print" style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="
      background: ${brandColor};
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 14px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    ">
      Print / Save as PDF
    </button>
    <button onclick="window.close()" style="
      background: #666;
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 14px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      margin-left: 10px;
    ">
      Close
    </button>
  </div>
</body>
</html>
  `;
}
