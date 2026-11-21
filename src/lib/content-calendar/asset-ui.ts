import { isContentCalendarLinkAsset } from "@/lib/content-calendar/media-storage";

export type AssetUiKind = "link" | "pdf" | "image" | "video" | "audio" | "file";

export type ContentCalendarAssetLike = {
  id: string;
  contentType: string;
  filename: string;
};

const IMAGE_URL_PATH =
  /\.(avif|bmp|gif|jpe?g|png|svg|webp)(\?.*)?$|\.(avif|bmp|gif|jpe?g|png|svg|webp)(&|#)/i;

/** Heuristic: pasted URLs that should render as <img> (not fetched). */
export function isUrlLikelyImage(href: string): boolean {
  const normalized = href.trim();
  if (!normalized) return false;
  try {
    const u = new URL(assetLinkUrl(normalized));
    if (IMAGE_URL_PATH.test(u.pathname) || IMAGE_URL_PATH.test(u.search)) return true;
    if (/images\.unsplash\.com|i\.imgur\.com|pbs\.twimg\.com\/media/i.test(u.href)) return true;
    return false;
  } catch {
    return IMAGE_URL_PATH.test(normalized);
  }
}

export function formatFileBytes(bytes: number): string {
  if (bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"] as const;
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const digits = i === 0 ? 0 : i === 1 ? 0 : 1;
  return `${n.toFixed(digits)} ${units[i]}`;
}

export function getAssetUiKind(contentType: string, filename = ""): AssetUiKind {
  if (isContentCalendarLinkAsset(contentType)) {
    return isUrlLikelyImage(filename) ? "image" : "link";
  }
  if (contentType === "application/pdf") return "pdf";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "file";
}

export function isGalleryImageAsset(
  assetOrContentType: ContentCalendarAssetLike | string,
  filename?: string,
): boolean {
  const asset =
    typeof assetOrContentType === "string"
      ? { id: "", contentType: assetOrContentType, filename: filename ?? "" }
      : assetOrContentType;
  return getAssetUiKind(asset.contentType, asset.filename) === "image";
}

/** Row list: everything except images (images use the gallery strip). */
export function isAttachmentListAsset(
  assetOrContentType: ContentCalendarAssetLike | string,
  filename?: string,
): boolean {
  return !isGalleryImageAsset(assetOrContentType, filename);
}

export function assetLinkUrl(filename: string): string {
  try {
    const u = new URL(filename);
    return u.href;
  } catch {
    return filename.startsWith("http") ? filename : `https://${filename}`;
  }
}

/** Served via admin file API or direct URL for image links. */
export function contentCalendarAssetMediaUrl(
  asset: ContentCalendarAssetLike,
  assetUrl: (id: string) => string,
): string {
  if (isContentCalendarLinkAsset(asset.contentType) && isUrlLikelyImage(asset.filename)) {
    return assetLinkUrl(asset.filename);
  }
  return assetUrl(asset.id);
}

export function canQuickViewAsset(contentType: string, filename = ""): boolean {
  const k = getAssetUiKind(contentType, filename);
  return k === "pdf" || k === "image" || k === "video" || k === "audio";
}

export function displayAssetName(filename: string, kind: AssetUiKind): string {
  if (kind === "link") {
    try {
      return new URL(assetLinkUrl(filename)).hostname;
    } catch {
      return filename;
    }
  }
  if (kind === "image" && isUrlLikelyImage(filename)) {
    try {
      const u = new URL(assetLinkUrl(filename));
      const base = u.pathname.split("/").pop() || u.hostname;
      return base.length > 48 ? `${base.slice(0, 45)}…` : base;
    } catch {
      return filename;
    }
  }
  return filename;
}