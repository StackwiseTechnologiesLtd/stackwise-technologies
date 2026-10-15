import { describe, expect, it } from "vitest";
import { paginate } from "@/lib/admin/pagination";

describe("paginate", () => {
  it("returns first page slice", () => {
    const result = paginate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 1, 10);
    expect(result.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(2);
  });

  it("clamps page above total pages", () => {
    const result = paginate([1, 2, 3], 99, 10);
    expect(result.currentPage).toBe(1);
    expect(result.items).toEqual([1, 2, 3]);
  });

  it("handles empty lists with one page", () => {
    const result = paginate([], 1, 10);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });
});
