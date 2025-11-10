"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAppAuth } from "@/context/AppAuthContext";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { SkeletonKPIGrid, SkeletonTable } from "@/components/ui/Skeleton";
import { InlineFiltersBar, FilterState } from "@/components/analytics/InlineFiltersBar";
import { ActiveFilterChips } from "@/components/analytics/ActiveFilterChips";
import {
  DollarSign,
  ShoppingCart,
  Target,
  TrendingUp,
  TrendingDown,
  MapPin,
  Users,
  Package,
  Download,
  Calendar,
  FileText,
  BarChart3,
  CreditCard,
  PieChart,
  Receipt,
  Clock,
  ChevronRight,
} from "@/lib/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// =====================================================
// Types
// =====================================================

type TimeRange = "7d" | "30d" | "90d" | "1y";
type ReportTab =
  | "sales"
  | "products"
  | "employees"
  | "locations"
  | "categories"
  | "payments"
  | "profitloss"
  | "tax"
  | "itemized"
  | "sessions";

// =====================================================
// Fetcher
// =====================================================

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// =====================================================
// Chart Colors
// =====================================================

const CHART_COLORS = [
  "#10B981", // Green
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
];

// =====================================================
// Components
// =====================================================

function StatCard({
  label,
  value,
  sublabel,
  change,
  icon: Icon,
  trend,
  onClick,
}: {
  label: string;
  value: string;
  sublabel?: string;
  change?: number;
  icon: any;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
}) {
  return (
    <div
      className={`minimal-glass subtle-glow p-6 border-l-2 border-white/10 ${onClick ? 'cursor-pointer hover:border-white/30 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-2">
            {label}
          </div>
          <div className="text-white text-2xl font-light mb-1">{value}</div>
          {sublabel && <div className="text-white/30 text-[10px]">{sublabel}</div>}
        </div>
        <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10">
          <Icon className="w-5 h-5 text-white/40" strokeWidth={1.5} />
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-2">
          {trend === "up" && (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>+{change.toFixed(1)}%</span>
            </div>
          )}
          {trend === "down" && (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <TrendingDown className="w-3 h-3" />
              <span>{change.toFixed(1)}%</span>
            </div>
          )}
          {trend === "neutral" && (
            <div className="text-white/40 text-xs">No change</div>
          )}
          <span className="text-white/30 text-xs">vs previous period</span>
        </div>
      )}
    </div>
  );
}

function RevenueChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: parseFloat(d.gross_sales || "0"),
    profit: parseFloat(d.gross_profit || "0"),
  }));

  return (
    <div className="mt-6">
      <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
        Revenue Trend
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: "10px" }} />
          <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: "10px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.6)" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: "#10B981", r: 4 }}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: "#3B82F6", r: 4 }}
            name="Profit"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CategoryChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  const chartData = data.slice(0, 8).map((cat, idx) => ({
    name: cat.category_name,
    value: parseFloat(cat.gross_sales || "0"),
    margin: parseFloat(cat.margin || "0"),
  }));

  return (
    <div className="grid grid-cols-2 gap-6 mt-6">
      <div>
        <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
          Sales by Category
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <RePieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => entry.name}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10,10,10,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            />
          </RePieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
          Margin by Category
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" style={{ fontSize: "10px" }} />
            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: "10px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10,10,10,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="margin" fill="#10B981" name="Margin %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ExportModal({
  isOpen,
  onClose,
  reportType,
  filters
}: {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  filters: any;
}) {
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("xlsx");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/vendor/analytics/v2/export/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          format,
          filters,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert("Export failed: " + (error.error || "Unknown error"));
        return;
      }

      if (format === "csv") {
        // Download CSV file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportType}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        onClose();
      } else if (format === "pdf") {
        // Open PDF print preview in new window
        const html = await response.text();
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
        }
        onClose();
      } else if (format === "xlsx") {
        // For now, use CSV format for Excel
        alert("Excel format coming soon. Please use CSV for now.");
      }
    } catch (error) {
      alert("Export failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="minimal-glass p-8 max-w-md w-full m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white text-xl font-light mb-6">Export Report</h3>

        <div className="mb-6">
          <label className="text-white/60 text-sm mb-2 block">Format</label>
          <div className="flex gap-2">
            {["csv", "xlsx", "pdf"].map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f as any)}
                className={`flex-1 px-4 py-2 text-xs uppercase tracking-wider transition-all duration-300 border rounded-xl ${
                  format === f
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-black/20 text-white/50 border-white/10 hover:border-white/20"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-white/60 border border-white/10 rounded-xl hover:border-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-4 py-2 text-sm text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Table components for each report type...
// (I'll include the key ones - you already have sales, locations, employees, products)

function CategoriesTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-white/40 py-12">
        <PieChart className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No category data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Category</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Items Sold</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Revenue</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Profit</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Margin</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((cat, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
              <td className="text-white text-sm font-light px-4 py-3">{cat.category_name}</td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{cat.items_sold?.toFixed(0)}</td>
              <td className="text-white text-sm text-right font-light px-4 py-3">
                ${(cat.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-green-400 text-sm text-right px-4 py-3">
                ${(cat.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{(cat.margin || 0).toFixed(1)}%</td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{(cat.percent_of_total || 0).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentMethodsTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-white/40 py-12">
        <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No payment data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Payment Method</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Amount</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Transactions</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Avg Trans</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((pm, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
              <td className="text-white text-sm font-light px-4 py-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-white/40" />
                {pm.method}
              </td>
              <td className="text-white text-sm text-right font-light px-4 py-3">
                ${(pm.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{pm.transactions || 0}</td>
              <td className="text-white/60 text-sm text-right px-4 py-3">
                ${(pm.avg_transaction || 0).toFixed(2)}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{(pm.percent || 0).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfitLossStatement({ data }: { data: any }) {
  if (!data) {
    return (
      <div className="text-center text-white/40 py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No P&L data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="minimal-glass p-6">
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Revenue</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60">Gross Sales</span>
            <span className="text-white font-light">
              ${(data.revenue?.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Refunds</span>
            <span className="text-red-400">
              ${(Math.abs(data.revenue?.refunds) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between border-t border-white/5 pt-3">
            <span className="text-white font-light">Net Sales</span>
            <span className="text-white font-bold">
              ${(data.revenue?.net_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="minimal-glass p-6">
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Cost & Profit</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60">Cost of Goods Sold</span>
            <span className="text-white/60">
              ${(data.cost_of_goods || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between border-t border-white/5 pt-3">
            <span className="text-white font-light">Gross Profit</span>
            <span className="text-green-400 font-bold">
              ${(data.gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Gross Margin</span>
            <span className="text-white/60">{(data.gross_margin || 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="minimal-glass p-6">
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Net Income</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60">Operating Expenses</span>
            <span className="text-white/60">
              ${(data.operating_expenses?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between border-t border-white/5 pt-3">
            <span className="text-white font-light text-lg">Net Income</span>
            <span className="text-green-400 font-bold text-lg">
              ${(data.net_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Net Margin</span>
            <span className="text-white/60">{(data.net_margin || 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxReportTable({ data }: { data: any }) {
  if (!data || !data.summary) {
    return (
      <div className="text-center text-white/40 py-12">
        <Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No tax data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Taxable Sales"
          value={`$${data.summary.total_taxable_sales?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
          icon={DollarSign}
        />
        <StatCard
          label="Total Tax Collected"
          value={`$${data.summary.total_tax_collected?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
          icon={Receipt}
        />
        <StatCard
          label="Tax Exempt Sales"
          value={`$${data.summary.total_tax_exempt?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
          icon={FileText}
        />
        <StatCard
          label="Effective Rate"
          value={`${data.summary.effective_rate?.toFixed(2) || '0.00'}%`}
          icon={Target}
        />
      </div>

      {/* By Location */}
      <div className="minimal-glass p-6">
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Tax by Location</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Location</th>
                <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Taxable Sales</th>
                <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Tax Collected</th>
                <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Tax Exempt</th>
                <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Rate</th>
              </tr>
            </thead>
            <tbody>
              {(data.by_location || []).map((loc: any, idx: number) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                  <td className="text-white text-sm font-light px-4 py-3">{loc.location_name}</td>
                  <td className="text-white/60 text-sm text-right px-4 py-3">
                    ${(loc.taxable_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-green-400 text-sm text-right px-4 py-3">
                    ${(loc.tax_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-white/60 text-sm text-right px-4 py-3">
                    ${(loc.tax_exempt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-white/60 text-sm text-right px-4 py-3">{(loc.rate || 0).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Category */}
      {data.by_category && data.by_category.length > 0 && (
        <div className="minimal-glass p-6">
          <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Tax by Category</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Category</th>
                  <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Taxable Sales</th>
                  <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Tax Collected</th>
                </tr>
              </thead>
              <tbody>
                {data.by_category.map((cat: any, idx: number) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="text-white text-sm font-light px-4 py-3">{cat.category_name}</td>
                    <td className="text-white/60 text-sm text-right px-4 py-3">
                      ${(cat.taxable_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-green-400 text-sm text-right px-4 py-3">
                      ${(cat.tax_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemizedSalesTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-white/40 py-12">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No itemized sales available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((transaction, idx) => (
        <div key={idx} className="minimal-glass p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-white font-light">Transaction #{transaction.transaction_number}</div>
              <div className="text-white/40 text-xs mt-1">
                {new Date(transaction.transaction_date).toLocaleString()}
              </div>
              <div className="text-white/40 text-xs">
                {transaction.location_name} • {transaction.employee_name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white text-xl font-light">
                ${transaction.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-white/40 text-xs">{transaction.payment_method}</div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase py-2">Item</th>
                  <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase py-2">Qty</th>
                  <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase py-2">Price</th>
                  <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(transaction.items || []).map((item: any, itemIdx: number) => (
                  <tr key={itemIdx} className="border-b border-white/5">
                    <td className="text-white/60 text-sm py-2">
                      {item.product_name}
                      <span className="text-white/30 text-xs ml-2">({item.category})</span>
                    </td>
                    <td className="text-white/60 text-sm text-right py-2">{item.quantity}</td>
                    <td className="text-white/60 text-sm text-right py-2">
                      ${item.unit_price?.toFixed(2)}
                    </td>
                    <td className="text-white text-sm text-right py-2">
                      ${item.line_total?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white/60">${transaction.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Tax</span>
                <span className="text-white/60">${transaction.tax?.toFixed(2)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Discount</span>
                  <span className="text-red-400">-${transaction.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base border-t border-white/5 pt-2">
                <span className="text-white font-light">Total</span>
                <span className="text-white font-bold">${transaction.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionsTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-white/40 py-12">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No session data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Session</th>
            <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Location</th>
            <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Employee</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Opened</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Closed</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Sales</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Trans</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Variance</th>
            <th className="text-center text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((session, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
              <td className="text-white text-sm font-light px-4 py-3">#{session.session_number}</td>
              <td className="text-white/60 text-sm px-4 py-3">{session.location_name}</td>
              <td className="text-white/60 text-sm px-4 py-3">{session.employee_name}</td>
              <td className="text-white/60 text-sm text-right px-4 py-3">
                {new Date(session.opened_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">
                {session.closed_at ? new Date(session.closed_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '-'}
              </td>
              <td className="text-white text-sm text-right px-4 py-3">
                ${session.total_sales?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{session.total_transactions}</td>
              <td className={`text-sm text-right px-4 py-3 ${
                Math.abs(session.variance) > 0.01 ? 'text-red-400' : 'text-green-400'
              }`}>
                ${session.variance?.toFixed(2)}
              </td>
              <td className="text-center px-4 py-3">
                <span className={`text-[10px] px-2 py-1 rounded-full ${
                  session.status === 'closed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {session.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesByDayTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-white/40 py-12">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No sales data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RevenueChart data={data} />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Date</th>
              <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Revenue</th>
              <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Profit</th>
              <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Transactions</th>
              <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Avg Order</th>
              <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Margin</th>
            </tr>
          </thead>
          <tbody>
            {data.map((day, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                <td className="text-white text-sm font-light px-4 py-3">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </td>
                <td className="text-white text-sm text-right px-4 py-3">
                  ${(day.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="text-green-400 text-sm text-right px-4 py-3">
                  ${(day.gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="text-white/60 text-sm text-right px-4 py-3">{day.transaction_count || 0}</td>
                <td className="text-white/60 text-sm text-right px-4 py-3">
                  ${(day.avg_transaction || 0).toFixed(2)}
                </td>
                <td className="text-white/60 text-sm text-right px-4 py-3">{(day.margin || 0).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LocationsTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-white/40 py-12">
        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No location data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Location</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Revenue</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Profit</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Transactions</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Avg Order</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((location, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
              <td className="text-white text-sm font-light px-4 py-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white/40" />
                {location.location_name}
              </td>
              <td className="text-white text-sm text-right px-4 py-3">
                ${(location.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-green-400 text-sm text-right px-4 py-3">
                ${(location.gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{location.transaction_count || 0}</td>
              <td className="text-white/60 text-sm text-right px-4 py-3">
                ${(location.avg_transaction || 0).toFixed(2)}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{(location.percent_of_total || 0).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmployeesTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-white/40 py-12">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No employee data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Employee</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Revenue</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Transactions</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Avg Order</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Items/Trans</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((employee, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
              <td className="text-white text-sm font-light px-4 py-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-white/40" />
                {employee.employee_name}
              </td>
              <td className="text-white text-sm text-right px-4 py-3">
                ${(employee.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{employee.transaction_count || 0}</td>
              <td className="text-white/60 text-sm text-right px-4 py-3">
                ${(employee.avg_transaction || 0).toFixed(2)}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">
                {(employee.avg_items_per_transaction || 0).toFixed(1)}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{(employee.percent_of_total || 0).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductsTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-white/40 py-12">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">No product data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Product</th>
            <th className="text-left text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Category</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Units Sold</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Revenue</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Profit</th>
            <th className="text-right text-white/40 text-[10px] font-light tracking-wider uppercase px-4 py-3">Margin</th>
          </tr>
        </thead>
        <tbody>
          {data.map((product, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
              <td className="text-white text-sm font-light px-4 py-3">{product.product_name}</td>
              <td className="text-white/60 text-sm px-4 py-3">{product.category || 'Uncategorized'}</td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{product.units_sold || 0}</td>
              <td className="text-white text-sm text-right px-4 py-3">
                ${(product.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-green-400 text-sm text-right px-4 py-3">
                ${(product.gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-white/60 text-sm text-right px-4 py-3">{(product.margin || 0).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================
// Main Analytics Page
// =====================================================

export default function AnalyticsPage() {
  const { user } = useAppAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [exportModal, setExportModal] = useState<{ isOpen: boolean; reportType: string }>({
    isOpen: false,
    reportType: "",
  });

  // Initialize date range for DateRangePicker
  const getInitialDateRange = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 29); // Default to 30 days
    start.setHours(0, 0, 0, 0);
    return { start, end };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange());

  // Initialize filters state
  const [filters, setFilters] = useState<FilterState>({
    dateRange: getInitialDateRange(),
    locationIds: [],
    categoryIds: [],
    employeeIds: [],
    paymentMethods: [],
    productIds: [],
    includeRefunds: true,
    includeDiscounts: true,
  });

  // Fetch filter data
  const { data: locationsData } = useSWR('/api/vendor/locations', fetcher);
  const { data: categoriesData } = useSWR(
    user?.vendor_id ? `/api/categories?vendor_id=${user.vendor_id}` : null,
    fetcher
  );

  const locations = locationsData?.locations || [];
  const categories = categoriesData?.categories || [];
  const employees: any[] = []; // TODO: Fetch employees when endpoint is ready

  // Build query params with date range and filters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('start_date', dateRange.start.toISOString());
    params.append('end_date', dateRange.end.toISOString());

    if (filters.locationIds.length > 0) {
      params.append('location_ids', filters.locationIds.join(','));
    }

    if (filters.categoryIds.length > 0) {
      params.append('category_ids', filters.categoryIds.join(','));
    }

    if (filters.employeeIds.length > 0) {
      params.append('employee_ids', filters.employeeIds.join(','));
    }

    if (filters.paymentMethods.length > 0) {
      params.append('payment_methods', filters.paymentMethods.join(','));
    }

    params.append('include_refunds', String(filters.includeRefunds));
    params.append('include_discounts', String(filters.includeDiscounts));

    return `?${params.toString()}`;
  };

  const queryParams = buildQueryParams();

  // Filter helpers
  const getActiveFilterCount = () => {
    return (
      filters.locationIds.length +
      filters.categoryIds.length +
      filters.employeeIds.length +
      filters.paymentMethods.length +
      (filters.includeRefunds ? 0 : 1) +
      (filters.includeDiscounts ? 0 : 1)
    );
  };

  const handleRemoveLocation = (id: string) => {
    setFilters({
      ...filters,
      locationIds: filters.locationIds.filter(locId => locId !== id),
    });
  };

  const handleRemoveCategory = (id: string) => {
    setFilters({
      ...filters,
      categoryIds: filters.categoryIds.filter(catId => catId !== id),
    });
  };

  const handleRemoveEmployee = (id: string) => {
    setFilters({
      ...filters,
      employeeIds: filters.employeeIds.filter(empId => empId !== id),
    });
  };

  const handleRemovePaymentMethod = (method: string) => {
    setFilters({
      ...filters,
      paymentMethods: filters.paymentMethods.filter(m => m !== method),
    });
  };

  const handleClearAllFilters = () => {
    setFilters({
      ...filters,
      locationIds: [],
      categoryIds: [],
      employeeIds: [],
      paymentMethods: [],
      productIds: [],
      includeRefunds: true,
      includeDiscounts: true,
    });
  };

  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
    setFilters({ ...filters, dateRange: range });
    setTimeRange("30d"); // Keep timeRange in sync for backward compatibility
  };

  // Fetch all reports with date range
  const { data: overview } = useSWR(`/api/vendor/analytics/v2/overview${queryParams}`, fetcher, {
    refreshInterval: 60000,
  });
  const { data: salesByDay } = useSWR(`/api/vendor/analytics/v2/sales/by-day${queryParams}`, fetcher);
  const { data: salesByLocation } = useSWR(`/api/vendor/analytics/v2/sales/by-location${queryParams}`, fetcher);
  const { data: salesByEmployee } = useSWR(`/api/vendor/analytics/v2/sales/by-employee${queryParams}`, fetcher);
  const { data: productPerformance } = useSWR(`/api/vendor/analytics/v2/products/performance${queryParams}`, fetcher);
  const { data: salesByCategory } = useSWR(`/api/vendor/analytics/v2/sales/by-category${queryParams}`, fetcher);
  const { data: salesByPayment } = useSWR(`/api/vendor/analytics/v2/sales/by-payment-method${queryParams}`, fetcher);
  const { data: profitLoss } = useSWR(`/api/vendor/analytics/v2/financial/profit-loss${queryParams}`, fetcher);
  const { data: taxReport } = useSWR(`/api/vendor/analytics/v2/financial/tax-report${queryParams}`, fetcher);
  const { data: itemizedSales } = useSWR(`/api/vendor/analytics/v2/sales/itemized${queryParams}`, fetcher);
  const { data: sessions } = useSWR(`/api/vendor/analytics/v2/sessions/summary${queryParams}`, fetcher);

  // Map tab keys to export report types
  const getExportReportType = (tabKey: string): string => {
    const mapping: Record<string, string> = {
      sales: "sales_by_day",
      locations: "sales_by_location",
      employees: "sales_by_employee",
      products: "products_performance",
      categories: "sales_by_category",
      payments: "sales_by_payment",
      profitloss: "profit_loss",
      tax: "tax_report",
      itemized: "itemized_sales",
      sessions: "sessions",
    };
    return mapping[tabKey] || tabKey;
  };

  const handleExportClick = (reportType: string) => {
    setExportModal({ isOpen: true, reportType });
  };

  const tabs = [
    { key: "sales", label: "Sales by Day", icon: Calendar },
    { key: "locations", label: "Locations", icon: MapPin },
    { key: "employees", label: "Employees", icon: Users },
    { key: "products", label: "Products", icon: Package },
    { key: "categories", label: "Categories", icon: PieChart },
    { key: "payments", label: "Payment Methods", icon: CreditCard },
    { key: "profitloss", label: "P&L Statement", icon: BarChart3 },
    { key: "tax", label: "Tax Report", icon: Receipt },
    { key: "itemized", label: "Itemized Sales", icon: FileText },
    { key: "sessions", label: "POS Sessions", icon: Clock },
  ];

  return (
    <div className="analytics-page dashboard-container">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        {/* Header - Sticky */}
        <div className="analytics-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-1 mb-1">Analytics</h1>
              <p className="body-text text-sm">
                Comprehensive business insights and reporting
              </p>
            </div>
            <div className="flex gap-3 items-center">
              {/* Inline Filters Bar */}
              <InlineFiltersBar
                filters={filters}
                onChange={setFilters}
                locations={locations}
                categories={categories}
                employees={employees}
                onApply={() => {
                  // Filters are already applied via state change
                }}
              />
              {/* Date Range Picker */}
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
              />
              <button
                onClick={() => handleExportClick(getExportReportType(activeTab))}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Active Filter Chips */}
          {getActiveFilterCount() > 0 && (
            <div className="mt-4">
              <ActiveFilterChips
                filters={filters}
                locations={locations}
                categories={categories}
                employees={employees}
                onRemoveLocation={handleRemoveLocation}
                onRemoveCategory={handleRemoveCategory}
                onRemoveEmployee={handleRemoveEmployee}
                onRemovePaymentMethod={handleRemovePaymentMethod}
                onClearAll={handleClearAllFilters}
              />
            </div>
          )}
        </div>

        {/* KPI Section - Sticky */}
        <div className="analytics-kpi-section">
          {!overview?.data ? (
            <SkeletonKPIGrid count={4} />
          ) : (
            <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Total Revenue"
              value={`$${(overview.data.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              sublabel={`From ${overview.data.transaction_count || 0} transactions`}
              change={overview.data.comparison?.gross_sales_change}
              trend={
                overview.data.comparison?.gross_sales_change > 0
                  ? "up"
                  : overview.data.comparison?.gross_sales_change < 0
                  ? "down"
                  : "neutral"
              }
              icon={DollarSign}
              onClick={() => setActiveTab("sales")}
            />
            <StatCard
              label="Gross Profit"
              value={`$${(overview.data.gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              sublabel={`${(overview.data.margin || 0).toFixed(1)}% margin`}
              change={overview.data.comparison?.gross_profit_change}
              trend={
                overview.data.comparison?.gross_profit_change > 0
                  ? "up"
                  : overview.data.comparison?.gross_profit_change < 0
                  ? "down"
                  : "neutral"
              }
              icon={TrendingUp}
              onClick={() => setActiveTab("profitloss")}
            />
            <StatCard
              label="Average Order"
              value={`$${(overview.data.avg_transaction || 0).toFixed(2)}`}
              sublabel={`${(overview.data.avg_items_per_transaction || 0).toFixed(1)} items per order`}
              change={overview.data.comparison?.avg_transaction_change}
              trend={
                overview.data.comparison?.avg_transaction_change > 0
                  ? "up"
                  : overview.data.comparison?.avg_transaction_change < 0
                  ? "down"
                  : "neutral"
              }
              icon={ShoppingCart}
              onClick={() => setActiveTab("itemized")}
            />
            <StatCard
              label="Top Product"
              value={overview.data.top_product?.name || "N/A"}
              sublabel={
                overview.data.top_product
                  ? `${overview.data.top_product.units_sold} units • $${overview.data.top_product.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : undefined
              }
              icon={Target}
              onClick={() => setActiveTab("products")}
            />
            </div>
          )}
        </div>

        {/* Tab Navigation - Sticky */}
        <div className="analytics-tabs">
          <div className="flex gap-1 py-3 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as ReportTab)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-300 rounded-lg ${
                    activeTab === tab.key
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content - Independent Scroll */}
        <div className="analytics-content">
          <div className="minimal-glass p-8">
          {activeTab === "sales" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">Sales by Day</h2>
                <button
                  onClick={() => handleExportClick("sales_by_day")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {salesByDay?.data ? (
                <SalesByDayTable data={salesByDay.data} />
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "locations" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">Sales by Location</h2>
                <button
                  onClick={() => handleExportClick("sales_by_location")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {salesByLocation?.data ? (
                <LocationsTable data={salesByLocation.data} />
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "employees" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">Sales by Employee</h2>
                <button
                  onClick={() => handleExportClick("sales_by_employee")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {salesByEmployee?.data ? (
                <EmployeesTable data={salesByEmployee.data} />
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">Product Performance</h2>
                <button
                  onClick={() => handleExportClick("product_performance")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {productPerformance?.data ? (
                <ProductsTable data={productPerformance.data} />
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "categories" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">Sales by Category</h2>
                <button
                  onClick={() => handleExportClick("sales_by_category")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {salesByCategory?.data ? (
                <>
                  <CategoryChart data={salesByCategory.data} />
                  <div className="mt-6">
                    <CategoriesTable data={salesByCategory.data} />
                  </div>
                </>
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">Payment Methods</h2>
                <button
                  onClick={() => handleExportClick("sales_by_payment")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {salesByPayment?.data ? (
                <PaymentMethodsTable data={salesByPayment.data} />
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "profitloss" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">Profit & Loss Statement</h2>
                <button
                  onClick={() => handleExportClick("profit_loss")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {profitLoss?.data ? (
                <ProfitLossStatement data={profitLoss.data} />
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "tax" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">Tax Report</h2>
                <button
                  onClick={() => handleExportClick("tax_report")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {taxReport?.data ? (
                <TaxReportTable data={taxReport.data} />
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "itemized" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">Itemized Sales</h2>
                <button
                  onClick={() => handleExportClick("itemized_sales")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {itemizedSales?.data ? (
                <ItemizedSalesTable data={itemizedSales.data} />
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-light">POS Sessions</h2>
                <button
                  onClick={() => handleExportClick("session_summary")}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              {sessions?.data ? (
                <>
                  {sessions.summary && (
                    <div className="grid grid-cols-5 gap-4 mb-6">
                      <div className="minimal-glass p-4">
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Total Sessions</div>
                        <div className="text-white text-2xl font-light">{sessions.summary.total_sessions}</div>
                      </div>
                      <div className="minimal-glass p-4">
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Total Sales</div>
                        <div className="text-white text-2xl font-light">
                          ${sessions.summary.total_sales?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="minimal-glass p-4">
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Transactions</div>
                        <div className="text-white text-2xl font-light">{sessions.summary.total_transactions}</div>
                      </div>
                      <div className="minimal-glass p-4">
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Total Variance</div>
                        <div className={`text-2xl font-light ${
                          Math.abs(sessions.summary.total_variance) > 0.01 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          ${sessions.summary.total_variance?.toFixed(2)}
                        </div>
                      </div>
                      <div className="minimal-glass p-4">
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">With Variance</div>
                        <div className="text-white text-2xl font-light">{sessions.summary.sessions_with_variance}</div>
                      </div>
                    </div>
                  )}
                  <SessionsTable data={sessions.data} />
                </>
              ) : (
                <div className="text-center text-white/40 py-12">Loading...</div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModal.isOpen}
        onClose={() => setExportModal({ isOpen: false, reportType: "" })}
        reportType={exportModal.reportType}
        filters={{ dateRange }}
      />
    </div>
  );
}
