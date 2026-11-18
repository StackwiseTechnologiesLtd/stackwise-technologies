import { describe, expect, it, vi, afterEach } from "vitest";
import {
  fetchContentCalendarRange,
  invalidateContentCalendarCache,
  isContentCalendarCacheFresh,
  primeContentCalendarCache,
} from "@/lib/content-calendar/client-cache";

describe("content calendar client cache", () => {
  afterEach(() => {
    invalidateContentCalendarCache();
    vi.unstubAllGlobals();
  });

  it("returns cached data without a second fetch when fresh", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ posts: [{ id: "a", title: "T", scheduledOn: "2026-01-01" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    primeContentCalendarCache("2026-01-01", "2026-01-31", []);
    expect(isContentCalendarCacheFresh("2026-01-01", "2026-01-31")).toBe(true);

    await fetchContentCalendarRange("2026-01-01", "2026-01-31");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});