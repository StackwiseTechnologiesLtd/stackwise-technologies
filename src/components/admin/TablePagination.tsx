"use client";

import { BTN_GHOST } from "@/lib/ui/buttons";

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className={`border border-line ${BTN_GHOST}`}
        aria-label="Previous page"
      >
        Previous
      </button>

      <div className="text-center text-muted">
        <p>
          Page {currentPage} of {totalPages}
        </p>
        <p className="text-xs">
          {totalItems === 0
            ? "No rows"
            : `Rows ${start}–${end} of ${totalItems}`}
        </p>
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className={`border border-line ${BTN_GHOST}`}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}
