import type { GrowthPlatform, LeadSource } from "@/lib/growth/types";

export const crmSavedViewIds = [
  "all",
  "new_this_week",
  "high_fit",
  "needs_action",
  "linkedin",
  "x_hiring",
] as const;

export type CrmSavedViewId = (typeof crmSavedViewIds)[number];

export type CrmSavedView = {
  id: CrmSavedViewId;
  label: string;
  description?: string;
  leadSource?: LeadSource;
  platform?: GrowthPlatform;
};

export const crmSavedViews: CrmSavedView[] = [
  { id: "all", label: "All qualified" },
  {
    id: "new_this_week",
    label: "New this week",
    description: "Created in the last 7 days · New or Qualified",
  },
  {
    id: "high_fit",
    label: "High fit",
    description: "At or above CRM fit bar · Active stages",
  },
  {
    id: "needs_action",
    label: "Needs action",
    description: "Outreach or Engaged · open tasks due",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    platform: "linkedin",
    description: "Opportunities tied to LinkedIn harvest",
  },
  {
    id: "x_hiring",
    label: "X hiring",
    description: "Developer job posts from X harvest · apply queue",
  },
];

export function parseCrmSavedView(
  value: string | null | undefined,
): CrmSavedViewId {
  if (value && crmSavedViewIds.includes(value as CrmSavedViewId)) {
    return value as CrmSavedViewId;
  }
  return "all";
}

export function crmOpportunitiesQuery(view: CrmSavedViewId): string {
  const params = new URLSearchParams();
  if (view !== "all") params.set("view", view);
  const q = params.toString();
  return q ? `?${q}` : "";
}