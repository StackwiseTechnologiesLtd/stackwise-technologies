import { describe, expect, it } from "vitest";
import { isoDateLocal, monthGridDays, rangeForMonth, startOfWeek } from "./dates";

describe("content calendar dates", () => {
  it("builds month grid with 35 or 42 cells", () => {
    const feb2026 = new Date(2026, 1, 15);
    const days = monthGridDays(feb2026);
    expect([35, 42]).toContain(days.length);
  });

  it("startOfWeek is Monday for default", () => {
    const wed = new Date(2026, 10, 18);
    const mon = startOfWeek(wed, 1);
    expect(mon.getDay()).toBe(1);
    expect(isoDateLocal(mon)).toBe("2026-11-16");
  });

  it("rangeForMonth covers grid endpoints", () => {
    const cur = new Date(2026, 10, 1);
    const range = rangeForMonth(cur);
    const grid = monthGridDays(cur);
    expect(range.from).toBe(isoDateLocal(grid[0]));
    expect(range.to).toBe(isoDateLocal(grid[grid.length - 1]));
  });
});