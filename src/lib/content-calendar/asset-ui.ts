import { isContentCalendarLinkAsset } from "@/lib/content-calendar/media-storage";

export type AssetUiKind = "link" | "pdf" | "image" | "video" | "audio" | "file";

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

export function getAssetUiKind(contentType: string): AssetUiKind {
  if (isContentCalendarLinkAsset(contentType)) return "link";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "file";
}

export function isGalleryImageAsset(contentType: string): boolean {
  return getAssetUiKind(contentType) === "image";
}

/** Row list: everything except images (images use the gallery strip). */
export function isAttachmentListAsset(contentType: string): boolean {
  return !isGalleryImageAsset(contentType);
}

export function assetLinkUrl(filename: string): string {
  try {
    const u = new URL(filename);
    return u.href;
  } catch {
    return filename.startsWith("http") ? filename : `https://${filename}`;
  }
}

export function canQuickViewAsset(contentType: string): boolean {
  const k = getAssetUiKind(contentType);
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
  return filename;
}