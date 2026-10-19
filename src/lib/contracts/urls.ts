import type { ContractEngagement } from "@/lib/contracts/types";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function contractAdminReviewUrl(engagement: ContractEngagement): string {
  return `${siteUrl()}/admin/contracts/${engagement.id}`;
}

export function contractClientUrl(engagement: ContractEngagement): string {
  return `${siteUrl()}/c/${engagement.slug}`;
}
