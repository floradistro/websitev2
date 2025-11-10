import ProductCardSkeleton from "./ProductCardSkeleton";

interface ProductListSkeletonProps {
  count?: number;
}

export default function ProductListSkeleton({
  count = 8,
}: ProductListSkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
