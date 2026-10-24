import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import type { LeadSource } from "@/lib/growth/types";

async function ready() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required");
  }
  await ensureSchema();
}

export async function recordIntegrationEvent(input: {
  leadSource: LeadSource;
  eventType: "ingest_ok" | "ingest_skipped" | "ingest_rejected";
  leadId?: string | null;
  detail?: string | null;
}): Promise<void> {
  await ready();
  const sql = getSql();
  await sql`
    INSERT INTO integration_events (id, lead_source, event_type, lead_id, detail)
    VALUES (
      ${crypto.randomUUID()}::uuid,
      ${input.leadSource},
      ${input.eventType},
      ${input.leadId ?? null}::uuid,
      ${input.detail ?? null}
    )
  `;
}

export type IntegrationServiceStatus = {
  id: LeadSource | "crm";
  label: string;
  configured: boolean;
  lastEventAt: string | null;
  lastSuccessAt: string | null;
  lastDetail: string | null;
};

export async function getIntegrationsStatus(): Promise<{
  services: IntegrationServiceStatus[];
  ingestSecretConfigured: boolean;
}> {
  await ready();
  const sql = getSql();

  const rows = asRows<{
    lead_source: string;
    last_at: string;
    last_ok: string | null;
  }>(
    await sql`
      SELECT
        lead_source,
        MAX(created_at) AS last_at,
        MAX(created_at) FILTER (WHERE event_type = 'ingest_ok') AS last_ok
      FROM integration_events
      WHERE lead_source IN ('huginn', 'freehire', 'manual', 'harvest')
      GROUP BY lead_source
    `,
  );

  const detailRows = asRows<{ lead_source: string; detail: string | null }>(
    await sql`
      SELECT DISTINCT ON (lead_source) lead_source, detail
      FROM integration_events
      WHERE lead_source IN ('huginn', 'freehire', 'manual', 'harvest')
      ORDER BY lead_source, created_at DESC
    `,
  );

  const bySource = new Map(
    rows.map((r) => [
      r.lead_source,
      {
        last_at: r.last_at,
        last_ok: r.last_ok,
        last_detail: detailRows.find((d) => d.lead_source === r.lead_source)
          ?.detail ?? null,
      },
    ]),
  );

  const ingestSecretConfigured =
    Boolean(process.env.INTEGRATIONS_INGEST_SECRET?.trim()) ||
    Boolean(process.env.GROWTH_CONNECTOR_SECRET?.trim());

  function service(
    id: LeadSource,
    label: string,
  ): IntegrationServiceStatus {
    const row = bySource.get(id);
    return {
      id,
      label,
      configured: id === "harvest" ? true : ingestSecretConfigured,
      lastEventAt: row?.last_at ?? null,
      lastSuccessAt: row?.last_ok ?? null,
      lastDetail: row?.last_detail ?? null,
    };
  }

  return {
    ingestSecretConfigured,
    services: [
      service("harvest", "LinkedIn / X harvest"),
      service("huginn", "Huginn webhooks"),
      service("freehire", "freehire jobs"),
      service("manual", "Manual capture"),
      {
        id: "crm",
        label: "CRM (in-repo)",
        configured: false,
        lastEventAt: null,
        lastSuccessAt: null,
        lastDetail: "Phase 2 — not wired yet",
      },
    ],
  };
}
