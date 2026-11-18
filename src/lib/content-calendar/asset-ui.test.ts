import { describe, expect, it } from "vitest";

import {
  formatFileBytes,
  getAssetUiKind,
  isVisualGalleryAsset,
} from "@/lib/content-calendar/asset-ui";
import { CONTENT_CALENDAR_LINK_TYPE } from "@/lib/content-calendar/media-storage";

describe("formatFileBytes", () => {
  it("formats sizes", () => {
    expect(formatFileBytes(198_000)).toBe("193 KB");
    expect(formatFileBytes(0)).toBe("—");
  });
});

describe("getAssetUiKind", () => {
  it("detects link and media", () => {
    expect(getAssetUiKind(CONTENT_CALENDAR_LINK_TYPE)).toBe("link");
    expect(getAssetUiKind("application/pdf")).toBe("pdf");
    expect(isVisualGalleryAsset("image/jpeg")).toBe(true);
    expect(isVisualGalleryAsset("audio/mpeg")).toBe(false);
  });
});