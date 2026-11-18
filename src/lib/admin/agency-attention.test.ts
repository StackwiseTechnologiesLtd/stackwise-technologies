import { describe, expect, it } from "vitest";
import { buildAgencyAttentionItems, countUrgentAttention } from "@/lib/admin/agency-attention";
import type { AgencyOverviewPayload } from "@/lib/admin/agency-overview";

function minimalOverview(
  overrides: Partial<AgencyOverviewPayload> = {},
): AgencyOverviewPayload {
  return {
    crm: { activeOpportunities: 0, byStage: [], recent: [] },
    revenue: {
      openPaymentLinks: 0,
      draftPaymentLinks: 0,
      paidLast30Days: 0,
      pendingAgreements: 0,
      activeSubscriptions: 0,
      recentPaymentLinks: [],
      recentAgreements: [],
    },
    growth: { triageLeads: 0 },
    brand: { publishedBrands: 0, portalMembers: 0 },
    instagram: {
      status: {
        metaAppCount: 0,
        connectedAccounts: 0,
        activeCampaigns: 0,
        lastWebhookAt: null,
        lastSendAt: null,
        webhookUrlPattern: "/api/webhooks/meta/{slug}",
        dryRunMode: false,
      },
      metrics: {
        failedThisWeek: 0,
        queuedNow: 0,
        sentThisWeek: 0,
        pausedCampaigns: 0,
      },
    },
    integrations: { ingestSecretConfigured: true, services: [] },
    delivery: { dueSoon: [] },
    jobApplications: {
      stats: {
        submittedLast7Days: 0,
        submittedLast30Days: 0,
        xReplyCount: 0,
        atsCount: 0,
        pendingResponse: 0,
      },
      recent: [],
    },
    ...overrides,
  };
}

describe("buildAgencyAttentionItems", () => {
  it("flags triage and urgent IG failures", () => {
    const data = minimalOverview({
      growth: { triageLeads: 3 },
      instagram: {
        status: {
          metaAppCount: 1,
          connectedAccounts: 1,
          activeCampaigns: 0,
          lastWebhookAt: null,
          lastSendAt: null,
          webhookUrlPattern: "/api/webhooks/meta/{slug}",
          dryRunMode: false,
        },
        metrics: {
          failedThisWeek: 2,
          queuedNow: 0,
          sentThisWeek: 0,
          pausedCampaigns: 0,
        },
      },
    });
    const items = buildAgencyAttentionItems(data);
    expect(items).toHaveLength(2);
    expect(countUrgentAttention(items)).toBe(2);
  });

  it("returns empty when nothing needs attention", () => {
    expect(buildAgencyAttentionItems(minimalOverview())).toEqual([]);
  });
});