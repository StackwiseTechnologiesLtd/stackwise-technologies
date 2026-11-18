import { describe, expect, it } from "vitest";

import {
  contentCalendarAssetDownloadUrl,
  contentDispositionFilename,
} from "@/lib/content-calendar/asset-download";

describe("asset-download", () => {
  it("appends download query", () => {
    expect(contentCalendarAssetDownloadUrl("/api/foo")).toBe("/api/foo?download=1");
    expect(contentCalendarAssetDownloadUrl("/api/foo?v=2")).toBe("/api/foo?v=2&download=1");
  });

  it("sanitizes filename", () => {
    expect(contentDispositionFilename('ok.pdf')).toBe("ok.pdf");
    expect(contentDispositionFilename('bad"name.pdf')).toBe("bad_name.pdf");
  });
});