"use client";

import { ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";

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
    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className={`order-2 sm:order-1 justify-self-stretch sm:justify-self-start ${ADMIN_BTN_SECONDARY}`}
        aria-label="Previous page"
      >
        Previous
      </button>

      <div className="order-1 text-center text-muted sm:order-2">
        <p className="text-sm">
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
        className={`order-3 justify-self-stretch sm:justify-self-end ${ADMIN_BTN_SECONDARY}`}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}
