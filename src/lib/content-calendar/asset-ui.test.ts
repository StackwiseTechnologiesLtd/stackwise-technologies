import { describe, expect, it } from "vitest";

import {
  canQuickViewAsset,
  contentCalendarAssetMediaUrl,
  formatFileBytes,
  getAssetUiKind,
  isAttachmentListAsset,
  isGalleryImageAsset,
  isUrlLikelyImage,
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
    expect(isGalleryImageAsset("image/jpeg")).toBe(true);
    expect(isGalleryImageAsset("video/mp4")).toBe(false);
    expect(isAttachmentListAsset("video/mp4")).toBe(true);
    expect(isAttachmentListAsset("image/jpeg")).toBe(false);
    expect(canQuickViewAsset("application/pdf")).toBe(true);
    expect(canQuickViewAsset("application/zip")).toBe(false);
  });

  it("treats image URLs as gallery images", () => {
    const png = "https://example.com/creatives/hero.png";
    expect(isUrlLikelyImage(png)).toBe(true);
    expect(getAssetUiKind(CONTENT_CALENDAR_LINK_TYPE, png)).toBe("image");
    expect(
      isGalleryImageAsset({
        id: "x",
        contentType: CONTENT_CALENDAR_LINK_TYPE,
        filename: png,
      }),
    ).toBe(true);
    expect(
      isAttachmentListAsset({
        id: "x",
        contentType: CONTENT_CALENDAR_LINK_TYPE,
        filename: png,
      }),
    ).toBe(false);
    expect(contentCalendarAssetMediaUrl(
      { id: "x", contentType: CONTENT_CALENDAR_LINK_TYPE, filename: png },
      (id) => `/file/${id}`,
    )).toBe(png);
    expect(canQuickViewAsset(CONTENT_CALENDAR_LINK_TYPE, png)).toBe(true);
  });
});