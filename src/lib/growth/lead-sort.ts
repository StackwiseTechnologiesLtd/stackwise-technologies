import type { GrowthDraft, GrowthInboxItem, GrowthLead } from "@/lib/growth/types";

function inboxItemActivityTime(item: GrowthInboxItem): number {
  const posted = item.signal?.postedAt;
  const ingested = item.signal?.ingestedAt;
  const leadCreated = item.lead.createdAt;
  const iso = posted ?? ingested ?? leadCreated;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** Preserve API order: newest posts first, then fit score. */
export function sortInboxItemsByRecency(items: GrowthInboxItem[]): GrowthInboxItem[] {
  return [...items].sort(
    (a, b) =>
      inboxItemActivityTime(b) - inboxItemActivityTime(a) ||
      b.lead.compositeScore - a.lead.compositeScore,
  );
}

export function sortLeadsByCompositeScore(leads: GrowthLead[]): GrowthLead[] {
  return [...leads].sort(
    (a, b) =>
      b.compositeScore - a.compositeScore ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function sortDraftsByLeadScore(
  drafts: GrowthDraft[],
  leads: GrowthLead[],
): GrowthDraft[] {
  const scoreByLeadId = new Map(leads.map((l) => [l.id, l.compositeScore]));
  return [...drafts].sort((a, b) => {
    const scoreA = a.leadId ? scoreByLeadId.get(a.leadId) ?? 0 : 0;
    const scoreB = b.leadId ? scoreByLeadId.get(b.leadId) ?? 0 : 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
