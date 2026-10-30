export type OutreachTotals = {
  processed: number;
  sent: number;
  no_email: number;
  failed: number;
  used_ai: number;
};

export type GrowthOutreachRun = {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  totals: OutreachTotals;
  createdBy: string | null;
};

export type GrowthOutreachItem = {
  id: string;
  runId: string;
  leadId: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  companyName: string | null;
  profileUrl: string | null;
  subjectLine: string;
  bodyText: string;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
  usedAi: boolean;
  createdAt: string;
};

export type RunOutreachOptions = {
  limit?: number;
  send?: boolean;
  createdBy?: string | null;
  /** Write CSV/MD under repo exports/ (CLI only). */
  writeExportFiles?: boolean;
};
