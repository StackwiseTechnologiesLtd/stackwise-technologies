export const agencyProjectStatuses = [
  "planned",
  "active",
  "blocked",
  "delivered",
  "archived",
] as const;

export type AgencyProjectStatus = (typeof agencyProjectStatuses)[number];

export const agencyProjectStatusLabels: Record<AgencyProjectStatus, string> = {
  planned: "Planned",
  active: "Active",
  blocked: "Blocked",
  delivered: "Delivered",
  archived: "Archived",
};

export type AgencyProject = {
  id: string;
  title: string;
  clientName: string;
  status: AgencyProjectStatus;
  crmOpportunityId: string | null;
  contractEngagementId: string | null;
  paymentLinkId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgencyProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  dueAt: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AgencyProjectDetail = {
  project: AgencyProject;
  milestones: AgencyProjectMilestone[];
};

export type AgencyDueMilestone = {
  milestoneId: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  title: string;
  dueAt: string | null;
};