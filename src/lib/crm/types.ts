import type { GrowthPlatform, LeadSource, PipelineStatus } from "@/lib/growth/types";

export const crmActivityTypes = ["note", "stage_change", "system"] as const;
export type CrmActivityType = (typeof crmActivityTypes)[number];

/** CRM opportunity stage is stored as growth `pipeline_status` for 1:1 sync. */
export type CrmOpportunityStage = PipelineStatus;

export type CrmCompany = {
  id: string;
  name: string;
  domain: string | null;
  growthLeadId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmPerson = {
  id: string;
  fullName: string;
  email: string | null;
  roleTitle: string | null;
  linkedinUrl: string | null;
  xProfileUrl: string | null;
  companyId: string | null;
  growthLeadId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmOpportunity = {
  id: string;
  name: string;
  stage: CrmOpportunityStage;
  amountCents: number | null;
  fitScore: number;
  sourcePostUrl: string | null;
  platform: GrowthPlatform | null;
  leadSource: LeadSource | null;
  personId: string;
  companyId: string | null;
  growthLeadId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmActivity = {
  id: string;
  opportunityId: string;
  activityType: CrmActivityType;
  body: string;
  createdAt: string;
};

export type CrmOpportunityDetail = {
  opportunity: CrmOpportunity;
  person: CrmPerson;
  company: CrmCompany | null;
  activities: CrmActivity[];
};

export const crmStageLabels: Record<PipelineStatus, string> = {
  new: "New",
  reviewed: "Qualified",
  outreach: "Outreach",
  replied: "Engaged",
  booked: "Meeting booked",
  won: "Won",
  lost: "Lost",
  not_a_fit: "Disqualified",
};
