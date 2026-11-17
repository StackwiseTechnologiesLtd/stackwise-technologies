import { listDueMilestones } from "@/lib/agency/projects";
import type { AgencyDueMilestone } from "@/lib/agency/types";
import { crmAutoPipelineMinScore } from "@/lib/crm/auto-sync";
import { listOpportunities } from "@/lib/crm/repository";
import { crmStageLabels, type CrmOpportunity } from "@/lib/crm/types";
import { listContractEngagements } from "@/lib/db/contracts";
import { listPaymentLinks } from "@/lib/db/payment-links";
import { listMaintenanceSubscriptions } from "@/lib/db/maintenance-subscriptions";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { pipelineStatuses, type PipelineStatus } from "@/lib/growth/types";
import {
  getIntegrationsStatus,
  type IntegrationServiceStatus,
} from "@/lib/integrations/repository";
import {
  getInstagramDeliveryMetrics,
  getInstagramOpsStatus,
} from "@/lib/instagram/repository";
import type {
  InstagramDeliveryMetrics,
  InstagramOpsStatus,
} from "@/lib/instagram/types";
import type { ContractStatus } from "@/lib/contracts/types";
import type { PaymentLink } from "@/lib/payments/types";

export type AgencyCrmStageCount = {
  stage: PipelineStatus;
  label: string;
  count: number;
};

export type AgencyRecentPaymentLink = {
  id: string;
  slug: string;
  customerName: string;
  status: PaymentLink["status"];
  amountUsd: number;
  updatedAt: string;
};

export type AgencyRecentAgreement = {
  id: string;
  slug: string;
  title: string;
  status: ContractStatus;
  customerName: string;
  updatedAt: string;
};

export type AgencyOverviewPayload = {
  crm: {
    activeOpportunities: number;
    byStage: AgencyCrmStageCount[];
    recent: CrmOpportunity[];
  };
  revenue: {
    openPaymentLinks: number;
    draftPaymentLinks: number;
    paidLast30Days: number;
    pendingAgreements: number;
    activeSubscriptions: number;
    recentPaymentLinks: AgencyRecentPaymentLink[];
    recentAgreements: AgencyRecentAgreement[];
  };
  growth: {
    triageLeads: number;
  };
  brand: {
    publishedBrands: number;
    portalMembers: number;
  };
  instagram: {
    status: InstagramOpsStatus;
    metrics: InstagramDeliveryMetrics;
  };
  integrations: {
    ingestSecretConfigured: boolean;
    services: IntegrationServiceStatus[];
  };
  delivery: {
    dueSoon: AgencyDueMilestone[];
  };
};

const ACTIVE_CRM_STAGES: PipelineStatus[] = pipelineStatuses.filter(
  (s) => s !== "lost" && s !== "not_a_fit",
);

const PENDING_CONTRACT_STATUSES: ContractStatus[] = [
  "PENDING_REVIEW",
  "SENT",
  "FEEDBACK_RECEIVED",
  "GENERATING",
  "GENERATION_FAILED",
];

async function ready() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required");
  }
  await ensureSchema();
}

export async function getAgencyOverview(): Promise<AgencyOverviewPayload> {
  await ready();
  const sql = getSql();
  const minFit = crmAutoPipelineMinScore();

  const [
    stageRows,
    paymentAgg,
    growthRow,
    brandRow,
    igStatus,
    igMetrics,
    integrations,
    recent,
    paymentLinks,
    contracts,
    subscriptions,
    dueMilestones,
  ] = await Promise.all([
    asRows<{ stage: string; count: number }>(
      await sql`
        SELECT stage, COUNT(*)::int AS count
        FROM crm_opportunities
        WHERE fit_score >= ${minFit}
          AND stage = ANY(${ACTIVE_CRM_STAGES})
        GROUP BY stage
      `,
    ),
    asRows<{
      open_count: number;
      draft_count: number;
      paid_30d: number;
    }>(
      await sql`
        SELECT
          COUNT(*) FILTER (
            WHERE status IN ('SENT', 'PENDING')
              AND COALESCE(kpay_is_test, false) = false
          )::int AS open_count,
          COUNT(*) FILTER (
            WHERE status = 'DRAFT'
              AND COALESCE(kpay_is_test, false) = false
          )::int AS draft_count,
          COUNT(*) FILTER (
            WHERE status = 'PAID'
              AND COALESCE(kpay_is_test, false) = false
              AND paid_at > NOW() - INTERVAL '30 days'
          )::int AS paid_30d
        FROM payment_links
      `,
    ),
    asRows<{ triage: number }>(
      await sql`
        SELECT COUNT(*)::int AS triage
        FROM growth_leads
        WHERE pipeline_status IN ('new', 'reviewed')
          AND composite_score >= ${minFit}
      `,
    ),
    asRows<{ brands: number; members: number }>(
      await sql`
        SELECT
          (SELECT COUNT(*)::int FROM brand_guidelines) AS brands,
          (
            SELECT COUNT(*)::int FROM brand_portal_members WHERE active = TRUE
          ) AS members
      `,
    ),
    getInstagramOpsStatus(),
    getInstagramDeliveryMetrics(),
    getIntegrationsStatus(),
    listOpportunities({ limit: 8 }),
    listPaymentLinks("production"),
    listContractEngagements(),
    listMaintenanceSubscriptions(),
    listDueMilestones({ withinDays: 14, limit: 8 }),
  ]);

  const byStageMap = new Map(stageRows.map((r) => [r.stage, r.count]));
  const byStage: AgencyCrmStageCount[] = ACTIVE_CRM_STAGES.map((stage) => ({
    stage,
    label: crmStageLabels[stage],
    count: byStageMap.get(stage) ?? 0,
  }));

  const activeOpportunities = byStage.reduce((sum, row) => sum + row.count, 0);

  const pendingAgreements = contracts.filter((c) =>
    PENDING_CONTRACT_STATUSES.includes(c.status),
  ).length;

  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE").length;

  const recentPaymentLinks: AgencyRecentPaymentLink[] = paymentLinks
    .slice(0, 5)
    .map((link) => ({
      id: link.id,
      slug: link.slug,
      customerName: link.customerName,
      status: link.status,
      amountUsd: link.amountUsd,
      updatedAt: new Date(link.updatedAt).toISOString(),
    }));

  const recentAgreements: AgencyRecentAgreement[] = contracts.slice(0, 5).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    status: c.status,
    customerName: c.customerName,
    updatedAt: new Date(c.updatedAt).toISOString(),
  }));

  return {
    crm: {
      activeOpportunities,
      byStage,
      recent,
    },
    revenue: {
      openPaymentLinks: paymentAgg[0]?.open_count ?? 0,
      draftPaymentLinks: paymentAgg[0]?.draft_count ?? 0,
      paidLast30Days: paymentAgg[0]?.paid_30d ?? 0,
      pendingAgreements,
      activeSubscriptions,
      recentPaymentLinks,
      recentAgreements,
    },
    growth: {
      triageLeads: growthRow[0]?.triage ?? 0,
    },
    brand: {
      publishedBrands: brandRow[0]?.brands ?? 0,
      portalMembers: brandRow[0]?.members ?? 0,
    },
    instagram: {
      status: igStatus,
      metrics: igMetrics,
    },
    integrations,
    delivery: {
      dueSoon: dueMilestones,
    },
  };
}