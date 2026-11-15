"use client";

import { paginate } from "@/lib/admin/pagination";

function pageButtons(current: number, total: number): (number | "gap")[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: (number | "gap")[] = [];
  const add = (n: number) => {
    if (n >= 1 && n <= total && out[out.length - 1] !== n) out.push(n);
  };
  add(1);
  if (current > 3) out.push("gap");
  for (const n of [current - 1, current, current + 1]) add(n);
  if (current < total - 2) out.push("gap");
  add(total);
  return out;
}

const navBtn =
  "inline-flex h-8 shrink-0 items-center justify-center gap-0.5 whitespace-nowrap rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-[var(--admin-surface-hover)] disabled:cursor-not-allowed disabled:border-[var(--admin-border)] disabled:bg-transparent disabled:text-[var(--admin-subtle)]";

const pageBtn =
  "inline-flex size-8 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs font-medium tabular-nums text-foreground transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--admin-border))] hover:bg-[var(--admin-surface-hover)]";

const pageBtnActive =
  "border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]";

export function AdminPanelPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  firstLast = false,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  firstLast?: boolean;
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);
  const pages = pageButtons(currentPage, totalPages);

  if (totalItems === 0) {
    return <p className="text-xs text-muted">No items</p>;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs tabular-nums text-[var(--admin-subtle)]">
        {start}-{end} of {totalItems}
      </p>
      <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Pagination">
        {firstLast ? (
          <button
            type="button"
            className={navBtn}
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            «
          </button>
        ) : null}
        <button
          type="button"
          className={navBtn}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <span aria-hidden>‹</span>
          <span className="hidden sm:inline">Back</span>
        </button>
        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${pageBtn} ${p === currentPage ? pageBtnActive : ""}`}
              onClick={() => onPageChange(p)}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={navBtn}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <span aria-hidden>›</span>
        </button>
        {firstLast ? (
          <button
            type="button"
            className={navBtn}
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            »
          </button>
        ) : null}
      </nav>
    </div>
  );
}

export const ADMIN_PANEL_PAGE_SIZE = 5;

export const ADMIN_PANEL_SCROLL_MAX_H = "max-h-[16.5rem]";

export function paginatePanel<T>(
  items: T[],
  page: number,
  pageSize = ADMIN_PANEL_PAGE_SIZE,
) {
  return paginate(items, page, pageSize);
}