import { Package, Calendar, Building2, Users, PackageCheck, MapPin } from "lucide-react";
import { ds, cn, Button } from "@/components/ds";
import type { PurchaseOrder } from "./types";

interface POListProps {
  orders: PurchaseOrder[];
  isLoading: boolean;
  type: "inbound" | "outbound";
  onReceive?: (po: PurchaseOrder) => void;
}

export function POList({ orders, isLoading, type, onReceive }: POListProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-12 text-center",
          ds.colors.bg.secondary,
          ds.colors.border.default,
        )}
      >
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p
          className={cn(
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.quaternary,
          )}
        >
          Loading purchase orders...
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-16 text-center",
          ds.colors.bg.secondary,
          ds.colors.border.default,
        )}
      >
        <Package size={48} className="text-white/10 mx-auto mb-4" strokeWidth={1} />
        <p className={cn(ds.typography.size.sm, "text-white/60 mb-2")}>No purchase orders found</p>
        <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
          Create your first {type} PO to get started
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "text-green-400";
      case "ordered":
        return "text-blue-400";
      case "confirmed":
        return "text-cyan-400";
      case "shipped":
        return "text-purple-400";
      case "receiving":
        return "text-yellow-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  return (
    <div className="space-y-3">
      {orders.map((po) => (
        <div
          key={po.id}
          className={cn(
            "rounded-2xl border p-4 transition-all",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            "hover:border-white/20",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left Side */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className={cn(ds.typography.size.sm, "text-white font-light")}>
                  {po.po_number}
                </h3>
                <span
                  className={cn(
                    "px-2 py-0.5 text-[8px] uppercase tracking-wider border rounded",
                    ds.colors.border.default,
                    getStatusColor(po.status),
                  )}
                >
                  {po.status}
                </span>
              </div>

              <div
                className={cn(
                  "flex items-center gap-3",
                  ds.typography.size.xs,
                  ds.colors.text.tertiary,
                  "flex-wrap",
                )}
              >
                {po.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(po.created_at).toLocaleDateString()}
                  </span>
                )}

                {type === "inbound" && po.supplier && (
                  <span className="flex items-center gap-1">
                    <Building2 size={10} />
                    {po.supplier.external_name}
                  </span>
                )}

                {type === "outbound" && po.wholesale_customer && (
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {po.wholesale_customer.external_company_name}
                  </span>
                )}

                {po.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {po.location.name}
                  </span>
                )}

                {po.items && po.items.length > 0 && (
                  <span>
                    {po.items.length} item{po.items.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Right Side - Total & Actions */}
            <div className="text-right flex flex-col items-end gap-2">
              <div>
                <div
                  className={cn(
                    ds.typography.size.xs,
                    ds.colors.text.quaternary,
                    ds.typography.transform.uppercase,
                    ds.typography.tracking.wide,
                    "mb-1",
                  )}
                >
                  Total
                </div>
                <div className="text-xl font-light text-white">
                  ${parseFloat(po.total?.toString() || "0").toFixed(2)}
                </div>
              </div>

              {/* Action Button - Only "Receive Items" */}
              {type === "inbound" &&
                onReceive &&
                ["ordered", "confirmed", "shipped", "receiving"].includes(po.status) && (
                  <Button variant="primary" size="sm" onClick={() => onReceive(po)}>
                    <PackageCheck size={12} />
                    {po.status === "receiving" ? "Continue Receiving" : "Receive Items"}
                  </Button>
                )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
