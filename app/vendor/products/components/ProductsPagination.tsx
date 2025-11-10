import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, ds, cn } from "@/components/ds";

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export function ProductsPagination({
  currentPage,
  totalPages,
  total,
  itemsPerPage,
  onPageChange,
  isLoading,
}: ProductsPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, total);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Show 5 page numbers

    if (totalPages <= showPages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={cn(
        "flex items-center justify-between mt-6 pt-6 border-t",
        ds.colors.border.default,
      )}
      role="navigation"
      aria-label="Product pagination"
    >
      {/* Results Info */}
      <div
        className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Showing{" "}
        <span className={cn(ds.typography.weight.medium)}>{startItem}</span> to{" "}
        <span className={cn(ds.typography.weight.medium)}>{endItem}</span> of{" "}
        <span className={cn(ds.typography.weight.medium)}>{total}</span>{" "}
        products
      </div>

      {/* Pagination Controls */}
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Pagination controls"
      >
        {/* Previous Button */}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          variant="secondary"
          size="sm"
          className="flex items-center gap-1"
          aria-label="Go to previous page"
        >
          <ChevronLeft
            className="w-4 h-4"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          Previous
        </Button>

        {/* Page Numbers */}
        <div
          className="hidden sm:flex items-center gap-1"
          role="list"
          aria-label="Page numbers"
        >
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className={cn("px-3 py-1", ds.colors.text.whisper)}
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isCurrent = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                disabled={isLoading}
                className={cn(
                  "px-3 py-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50",
                  ds.typography.size.sm,
                  ds.typography.weight.medium,
                  isCurrent
                    ? cn(ds.colors.bg.active, "text-white")
                    : cn(
                        ds.colors.text.tertiary,
                        ds.colors.bg.hover,
                        "hover:text-white/80",
                      ),
                )}
                aria-label={
                  isCurrent
                    ? `Current page, page ${page}`
                    : `Go to page ${page}`
                }
                aria-current={isCurrent ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          variant="secondary"
          size="sm"
          className="flex items-center gap-1"
          aria-label="Go to next page"
        >
          Next
          <ChevronRight
            className="w-4 h-4"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </Button>
      </div>
    </nav>
  );
}
