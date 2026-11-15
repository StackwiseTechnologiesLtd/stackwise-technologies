"use client";

import {
  AdminPanelPagination,
  ADMIN_PANEL_PAGE_SIZE,
  ADMIN_PANEL_SCROLL_MAX_H,
  paginatePanel,
} from "@/components/admin/AdminPanelPagination";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { type ReactNode, useState } from "react";

export function AdminScrollPaginatedPanel<T>({
  items,
  pageSize = ADMIN_PANEL_PAGE_SIZE,
  maxHeightClass = ADMIN_PANEL_SCROLL_MAX_H,
  firstLast,
  empty,
  getKey,
  renderItem,
  resetKey,
}: {
  items: T[];
  pageSize?: number;
  maxHeightClass?: string;
  firstLast?: boolean;
  empty: ReactNode;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Change when the underlying list identity changes (e.g. tab id). */
  resetKey?: string | number;
}) {
  const [page, setPage] = useState(1);

  useDeferredEffect(() => {
    setPage(1);
  }, [resetKey, items.length]);

  const { items: slice, currentPage, totalPages, totalItems } = paginatePanel(
    items,
    page,
    pageSize,
  );

  if (totalItems === 0) {
    return <div className="p-5 text-sm text-muted">{empty}</div>;
  }

  return (
    <>
      <div
        className={`overflow-y-auto overscroll-y-contain ${maxHeightClass}`}
      >
        {slice.map((item) => (
          <div key={getKey(item)}>{renderItem(item)}</div>
        ))}
      </div>
      {totalPages > 1 || firstLast ? (
        <footer className="border-t border-[var(--admin-border)] px-4 py-3 sm:px-5">
          <AdminPanelPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            firstLast={firstLast}
          />
        </footer>
      ) : (
        <footer className="border-t border-[var(--admin-border)] px-4 py-3 sm:px-5">
          <p className="text-xs tabular-nums text-muted">
            {totalItems === 1 ? "1 of 1" : `1-${totalItems} of ${totalItems}`}
          </p>
        </footer>
      )}
    </>
  );
}