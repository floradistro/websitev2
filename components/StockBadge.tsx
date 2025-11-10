interface StockBadgeProps {
  quantity: number;
  lowStockThreshold?: number;
  className?: string;
}

export default function StockBadge({
  quantity,
  lowStockThreshold = 10,
  className = "",
}: StockBadgeProps) {
  const getStockStatus = () => {
    if (quantity === 0) {
      return {
        text: "Out of Stock",
        textColor: "text-[#999]",
      };
    } else if (quantity <= lowStockThreshold) {
      return {
        text: "Low Stock",
        textColor: "text-[#767676]",
      };
    } else {
      return {
        text: "In Stock",
        textColor: "text-black",
      };
    }
  };

  const status = getStockStatus();

  return (
    <span className={`text-xs font-light ${status.textColor} ${className}`}>
      {status.text}
    </span>
  );
}
