import type { AgencyOverviewPayload } from "@/lib/admin/agency-overview";

export type AgencyAttentionTone = "warn" | "danger" | "default";

export type AgencyAttentionItem = {
  label: string;
  href: string;
  tone: AgencyAttentionTone;
};

/** Same rules as the Overview “Due soon” panel — usable from UI and alert jobs. */
export function buildAgencyAttentionItems(
  data: AgencyOverviewPayload,
): AgencyAttentionItem[] {
  const items: AgencyAttentionItem[] = [];
  if (data.growth.triageLeads > 0) {
    items.push({
      label: `${data.growth.triageLeads} leads waiting in the inbox`,
      href: "/admin/growth/inbox",
      tone: "warn",
    });
  }
  if (data.instagram.metrics.failedThisWeek > 0) {
    items.push({
      label: `${data.instagram.metrics.failedThisWeek} Instagram sends failed this week`,
      href: "/admin/instagram/activity?status=failed",
      tone: "danger",
    });
  }
  if (data.instagram.metrics.queuedNow > 0) {
    items.push({
      label: `${data.instagram.metrics.queuedNow} Instagram deliveries queued`,
      href: "/admin/instagram/activity",
      tone: "default",
    });
  }
  if (data.revenue.pendingAgreements > 0) {
    items.push({
      label: `${data.revenue.pendingAgreements} agreements waiting on clients`,
      href: "/admin/contracts",
      tone: "warn",
    });
  }
  if (data.revenue.openPaymentLinks > 0) {
    items.push({
      label: `${data.revenue.openPaymentLinks} payment links still open`,
      href: "/admin/payment-links",
      tone: "default",
    });
  }
  if (data.revenue.draftPaymentLinks > 0) {
    items.push({
      label: `${data.revenue.draftPaymentLinks} draft invoices not sent yet`,
      href: "/admin/payment-links/new",
      tone: "warn",
    });
  }
  if (data.instagram.status.dryRunMode) {
    items.push({
      label: "Instagram dry run is on. DMs are logged, not sent live.",
      href: "/admin/instagram/connection",
      tone: "warn",
    });
  }
  return items;
}

export function countUrgentAttention(items: AgencyAttentionItem[]): number {
  return items.filter((i) => i.tone === "warn" || i.tone === "danger").length;
}