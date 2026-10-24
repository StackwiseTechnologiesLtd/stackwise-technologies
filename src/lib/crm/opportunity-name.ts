import type { GrowthLead } from "@/lib/growth/types";

export function crmOpportunityDisplayName(lead: {
  leadSource: GrowthLead["leadSource"];
  fullName: string;
  roleTitle: string | null;
  companyName: string | null;
}): string {
  if (lead.leadSource === "freehire") {
    const role = lead.roleTitle?.trim() || lead.fullName.trim() || "Role";
    const company = lead.companyName?.trim();
    return company ? `Hiring: ${role} @ ${company}` : `Hiring: ${role}`;
  }

  if (lead.companyName?.trim()) {
    return `${lead.fullName} @ ${lead.companyName.trim()}`;
  }
  return lead.fullName;
}
