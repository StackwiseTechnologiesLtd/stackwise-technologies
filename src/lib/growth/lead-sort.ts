import type { GrowthDraft, GrowthLead } from "@/lib/growth/types";

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
