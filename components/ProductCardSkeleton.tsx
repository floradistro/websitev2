export default function ProductCardSkeleton() {
  return (
    <div className="block relative bg-[#3a3a3a] border border-transparent">
      {/* Image Skeleton */}
      <div className="relative aspect-square md:aspect-[4/5] overflow-hidden bg-[#2a2a2a]">
        <div className="w-full h-full bg-white/5 animate-pulse"></div>
      </div>

      {/* Product Info Skeleton */}
      <div className="space-y-3 px-3 py-4 animate-pulse">
        {/* Title */}
        <div className="h-3 bg-white/5 w-3/4"></div>
        
        {/* Price */}
        <div className="h-3 bg-white/5 w-1/3"></div>
        
        {/* Stock Indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/5"></div>
          <div className="h-3 bg-white/5 w-16"></div>
        </div>
        
        {/* Fields */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="h-2 bg-white/5"></div>
          <div className="h-2 bg-white/5"></div>
          <div className="h-2 bg-white/5 w-4/5"></div>
        </div>
      </div>
    </div>
  );
}

