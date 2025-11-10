"use client";

import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  Store,
  XCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";

interface OrderStatus {
  status: string;
  label: string;
  timestamp?: string;
  completed: boolean;
}

interface OrderTrackingProps {
  orderStatus: string;
  orderType: "delivery" | "pickup";
  dateCreated: string;
  dateCompleted?: string;
  dateShipped?: string;
  pickupLocation?: string;
}

export default function OrderTracking({
  orderStatus,
  orderType,
  dateCreated,
  dateCompleted,
  dateShipped,
  pickupLocation,
}: OrderTrackingProps) {
  // Map order statuses to tracking stages
  const getTrackingStages = (): OrderStatus[] => {
    const baseStages: OrderStatus[] = [
      {
        status: "pending",
        label: "Order Placed",
        timestamp: dateCreated,
        completed: true,
      },
      {
        status: "processing",
        label: "Confirmed",
        timestamp:
          orderStatus === "processing" || orderStatus === "completed" ? dateCreated : undefined,
        completed:
          orderStatus === "processing" || orderStatus === "completed" || orderStatus === "on-hold",
      },
    ];

    if (orderType === "delivery") {
      baseStages.push(
        {
          status: "shipped",
          label: "Shipped",
          timestamp: dateShipped,
          completed: orderStatus === "completed" || (dateShipped ? true : false),
        },
        {
          status: "completed",
          label: "Delivered",
          timestamp: dateCompleted,
          completed: orderStatus === "completed",
        },
      );
    } else {
      baseStages.push(
        {
          status: "ready",
          label: "Ready for Pickup",
          timestamp:
            orderStatus === "completed" || orderStatus === "on-hold" ? dateCreated : undefined,
          completed: orderStatus === "completed" || orderStatus === "on-hold",
        },
        {
          status: "completed",
          label: "Picked Up",
          timestamp: dateCompleted,
          completed: orderStatus === "completed",
        },
      );
    }

    return baseStages;
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (orderStatus === "cancelled" || orderStatus === "failed") {
      return <XCircle size={20} className="text-red-400" />;
    }

    if (orderStatus === "refunded") {
      return <AlertCircle size={20} className="text-yellow-400" />;
    }

    if (completed) {
      return <CheckCircle size={20} className="text-green-400" />;
    }

    if (status === "processing" && !completed) {
      return <Clock size={20} className="text-blue-400 animate-pulse" />;
    }

    switch (status) {
      case "pending":
        return <Clock size={20} className="text-white/40" />;
      case "processing":
        return <Package size={20} className="text-white/40" />;
      case "shipped":
        return <Truck size={20} className="text-white/40" />;
      case "ready":
        return <Store size={20} className="text-white/40" />;
      case "completed":
        return <CheckCircle size={20} className="text-white/40" />;
      default:
        return <Clock size={20} className="text-white/40" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "processing":
      case "on-hold":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "cancelled":
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "refunded":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      default:
        return "bg-white/5 text-white/60 border-white/20";
    }
  };

  const getStatusMessage = () => {
    switch (orderStatus) {
      case "pending":
        return "Your order has been received and is awaiting confirmation.";
      case "processing":
        return orderType === "delivery"
          ? "Your order is being prepared for shipment."
          : "Your order is being prepared for pickup.";
      case "on-hold":
        return "Your order is on hold. We'll notify you when it's ready.";
      case "completed":
        return orderType === "delivery"
          ? "Your order has been delivered."
          : "Your order has been picked up.";
      case "cancelled":
        return "This order has been cancelled.";
      case "refunded":
        return "This order has been refunded.";
      case "failed":
        return "This order payment failed.";
      default:
        return "Order status information will appear here.";
    }
  };

  // Handle cancelled, failed, or refunded orders
  if (orderStatus === "cancelled" || orderStatus === "failed" || orderStatus === "refunded") {
    return (
      <div className="bg-[#2a2a2a] border border-white/10 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-12 h-12 rounded-full ${
              orderStatus === "cancelled" || orderStatus === "failed"
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-orange-500/10 border border-orange-500/30"
            } flex items-center justify-center`}
          >
            {orderStatus === "refunded" ? (
              <AlertCircle size={24} className="text-orange-400" />
            ) : (
              <XCircle size={24} className="text-red-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm uppercase tracking-[0.2em] text-white font-medium mb-1">
              Order{" "}
              {orderStatus === "refunded"
                ? "Refunded"
                : orderStatus === "cancelled"
                  ? "Cancelled"
                  : "Failed"}
            </h3>
            <p className="text-xs text-white/60">{getStatusMessage()}</p>
          </div>
        </div>
      </div>
    );
  }

  const stages = getTrackingStages();
  const currentStageIndex = stages.findIndex((s) => !s.completed);
  const activeIndex = currentStageIndex === -1 ? stages.length - 1 : currentStageIndex;

  return (
    <div className="bg-[#2a2a2a] border border-white/10 p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] text-white font-medium mb-2">
            {orderType === "delivery" ? "Delivery Status" : "Pickup Status"}
          </h3>
          <p className="text-xs text-white/60">{getStatusMessage()}</p>
          {pickupLocation && orderType === "pickup" && (
            <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
              <MapPin size={12} />
              <span>{pickupLocation}</span>
            </div>
          )}
        </div>
        <span
          className={`text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 border ${getStatusColor(orderStatus)}`}
        >
          {orderStatus.replace("-", " ")}
        </span>
      </div>

      {/* Progress Timeline */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isActive = index === activeIndex;
          const isCompleted = stage.completed;

          return (
            <div key={stage.status} className="relative flex items-start gap-4">
              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className={`absolute left-[20px] top-[32px] w-[2px] h-[calc(100%+8px)] ${
                    isCompleted ? "bg-green-500/30" : "bg-white/10"
                  }`}
                />
              )}

              {/* Status Icon */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isCompleted
                    ? "bg-green-500/10 border-2 border-green-500/50"
                    : isActive
                      ? "bg-blue-500/10 border-2 border-blue-500/50 animate-pulse"
                      : "bg-white/5 border-2 border-white/10"
                }`}
              >
                {getStatusIcon(stage.status, isCompleted)}
              </div>

              {/* Status Info */}
              <div className="flex-1 pt-1.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className={`text-sm mb-1 ${
                        isCompleted
                          ? "text-white font-medium"
                          : isActive
                            ? "text-white"
                            : "text-white/40"
                      }`}
                    >
                      {stage.label}
                    </p>
                    {stage.timestamp && (
                      <p className="text-[10px] text-white/40">
                        {new Date(stage.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {isActive && !isCompleted && (
                      <p className="text-[10px] text-blue-400 mt-1 uppercase tracking-wider">
                        In Progress
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated Delivery/Pickup */}
      {orderStatus === "processing" && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="bg-blue-500/5 border border-blue-500/20 p-4">
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-blue-400 mt-0.5" />
              <div>
                <p className="text-xs text-white/80 mb-1 font-medium">
                  {orderType === "delivery" ? "Estimated Delivery" : "Estimated Ready Time"}
                </p>
                <p className="text-[10px] text-white/60">
                  {orderType === "delivery"
                    ? "2-3 business days"
                    : "1-2 hours from order confirmation"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
