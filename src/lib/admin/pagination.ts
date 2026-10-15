/** Default page size for admin data tables. */
export const ADMIN_TABLE_PAGE_SIZE = 10;

export function paginate<T>(items: T[], page: number, pageSize = ADMIN_TABLE_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
    totalItems: items.length,
    pageSize,
  };
}
