import type { BrandGuidelines } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validates admin/DB JSON before save; full shape matches BrandGuidelines. */
export function parseBrandGuidelinesConfig(raw: unknown): BrandGuidelines {
  if (!isRecord(raw)) {
    throw new Error("Brand config must be a JSON object");
  }
  const slug = raw.slug;
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Invalid slug in brand config");
  }
  if (typeof raw.name !== "string" || raw.name.trim().length === 0) {
    throw new Error("Brand name is required");
  }
  if (!isRecord(raw.theme) || !isRecord(raw.introduction) || !isRecord(raw.colors)) {
    throw new Error("Brand config is missing required sections");
  }
  return raw as BrandGuidelines;
}
