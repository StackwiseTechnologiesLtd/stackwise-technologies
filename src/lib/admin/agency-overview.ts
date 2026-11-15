import { crmAutoPipelineMinScore } from "@/lib/crm/auto-sync";
import { listOpportunities } from "@/lib/crm/repository";
import { crmStageLabels, type CrmOpportunity } from "@/lib/crm/types";
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

export type AgencyCrmStageCount = {
  stage: PipelineStatus;
  label: string;
  count: number;
};

export type AgencyOverviewPayload = {
  crm: {
    activeOpportunities: number;
    byStage: AgencyCrmStageCount[];
    recent: CrmOpportunity[];
  };
  billing: {
    openPaymentLinks: number;
    draftPaymentLinks: number;
  };
  growth: {
    triageLeads: number;
  };
  instagram: {
    status: InstagramOpsStatus;
    metrics: InstagramDeliveryMetrics;
  };
  integrations: {
    ingestSecretConfigured: boolean;
    services: IntegrationServiceStatus[];
  };
};

const ACTIVE_CRM_STAGES: PipelineStatus[] = pipelineStatuses.filter(
  (s) => s !== "lost" && s !== "not_a_fit",
);

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

  const [stageRows, paymentRow, growthRow, igStatus, igMetrics, integrations, recent] =
    await Promise.all([
      asRows<{ stage: string; count: number }>(
        await sql`
          SELECT stage, COUNT(*)::int AS count
          FROM crm_opportunities
          WHERE fit_score >= ${minFit}
            AND stage = ANY(${ACTIVE_CRM_STAGES})
          GROUP BY stage
        `,
      ),
      asRows<{ open_count: number; draft_count: number }>(
        await sql`
          SELECT
            COUNT(*) FILTER (
              WHERE status IN ('SENT', 'PENDING')
                AND COALESCE(kpay_is_test, false) = false
            )::int AS open_count,
            COUNT(*) FILTER (
              WHERE status = 'DRAFT'
                AND COALESCE(kpay_is_test, false) = false
            )::int AS draft_count
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
      getInstagramOpsStatus(),
      getInstagramDeliveryMetrics(),
      getIntegrationsStatus(),
      listOpportunities({ limit: 8 }),
    ]);

  const byStageMap = new Map(stageRows.map((r) => [r.stage, r.count]));
  const byStage: AgencyCrmStageCount[] = ACTIVE_CRM_STAGES.map((stage) => ({
    stage,
    label: crmStageLabels[stage],
    count: byStageMap.get(stage) ?? 0,
  }));

  const activeOpportunities = byStage.reduce((sum, row) => sum + row.count, 0);

  return {
    crm: {
      activeOpportunities,
      byStage,
      recent,
    },
    billing: {
      openPaymentLinks: paymentRow[0]?.open_count ?? 0,
      draftPaymentLinks: paymentRow[0]?.draft_count ?? 0,
    },
    growth: {
      triageLeads: growthRow[0]?.triage ?? 0,
    },
    instagram: {
      status: igStatus,
      metrics: igMetrics,
    },
    integrations,
  };
}