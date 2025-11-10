"use client";

import { Check, Package, Truck, MapPin } from "lucide-react";

interface OrderTimelineProps {
  status: string;
  dateCreated: string;
  dateCompleted?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export default function OrderTimeline({
  status,
  dateCreated,
  dateCompleted,
  trackingNumber,
  estimatedDelivery,
}: OrderTimelineProps) {
  // Map order status to timeline steps
  const getTimelineSteps = () => {
    const steps = [
      {
        id: "pending",
        label: "Order Placed",
        icon: Package,
        date: dateCreated,
      },
      { id: "processing", label: "Processing", icon: Package },
      {
        id: "shipped",
        label: "Shipped",
        icon: Truck,
        tracking: trackingNumber,
      },
      {
        id: "completed",
        label: "Delivered",
        icon: MapPin,
        date: dateCompleted,
      },
    ];

    // Determine which steps are complete based on status
    const statusMap: { [key: string]: number } = {
      pending: 0,
      "on-hold": 1,
      processing: 1,
      completed: 3,
      shipped: 2,
      cancelled: -1,
      refunded: -1,
      failed: -1,
    };

    const currentStepIndex = statusMap[status] ?? 0;

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStepIndex,
      current: index === currentStepIndex,
    }));
  };

  const steps = getTimelineSteps();

  if (status === "cancelled" || status === "refunded" || status === "failed") {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-6">
        <p className="text-red-400 text-sm uppercase tracking-wider">Order {status}</p>
        <p className="text-white/60 text-xs mt-2">
          {status === "cancelled" && "This order has been cancelled."}
          {status === "refunded" && "This order has been refunded."}
          {status === "failed" && "Payment failed for this order."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] border border-white/10 p-6">
      <h3 className="text-sm uppercase tracking-[0.2em] text-white font-medium mb-8">
        Order Status
      </h3>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-white/10" />

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Icon */}
              <div
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  step.completed
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : step.current
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-[#3a3a3a] border-white/20 text-white/40"
                }`}
              >
                {step.completed ? <Check size={20} strokeWidth={2.5} /> : <step.icon size={20} />}
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className={`text-sm uppercase tracking-wider font-medium ${
                      step.completed
                        ? "text-white"
                        : step.current
                          ? "text-amber-400"
                          : "text-white/40"
                    }`}
                  >
                    {step.label}
                  </h4>
                  {step.current && (
                    <span className="text-[9px] uppercase tracking-[0.2em] bg-amber-500/20 text-amber-400 px-2 py-1 border border-amber-500/30">
                      Current
                    </span>
                  )}
                </div>

                {step.date && (
                  <p className="text-xs text-white/60 mb-1">
                    {new Date(step.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}

                {step.tracking && trackingNumber && (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                      Tracking Number
                    </p>
                    <p className="text-xs text-white/80 font-mono">{trackingNumber}</p>
                  </div>
                )}

                {step.id === "shipped" && estimatedDelivery && !step.completed && step.current && (
                  <p className="text-xs text-white/60 mt-1">
                    Est. delivery:{" "}
                    {new Date(estimatedDelivery).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      {trackingNumber && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <a
            href={`https://www.google.com/search?q=${trackingNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
          >
            <Truck size={12} />
            Track Shipment
          </a>
        </div>
      )}
    </div>
  );
}
