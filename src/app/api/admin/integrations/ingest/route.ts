import { NextResponse } from "next/server";
import { authorizeIntegrationsIngest } from "@/lib/integrations/auth";
import { parseIntegrationIngestBody } from "@/lib/integrations/ingest-payload";
import { recordIntegrationEvent } from "@/lib/integrations/repository";
import { evaluateHarvestCandidate } from "@/lib/growth/harvest-quality";
import { getIcpConfig, ingestSignal, signalAlreadyIngested } from "@/lib/growth/repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await authorizeIntegrationsIngest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = parseIntegrationIngestBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const input = parsed.input;
    const leadSource = input.leadSource ?? "manual";

    if (await signalAlreadyIngested(input)) {
      await recordIntegrationEvent({
        leadSource,
        eventType: "ingest_skipped",
        detail: "Duplicate post",
      });
      return NextResponse.json(
        { skipped: true, reason: "duplicate" },
        { status: 409 },
      );
    }

    const config = await getIcpConfig();
    const verdict = evaluateHarvestCandidate(input, config);
    if (!verdict.ok) {
      await recordIntegrationEvent({
        leadSource,
        eventType: "ingest_rejected",
        detail: verdict.reason,
      });
      return NextResponse.json(
        { skipped: true, reason: verdict.reason },
        { status: 422 },
      );
    }

    const result = await ingestSignal(input);
    await recordIntegrationEvent({
      leadSource,
      eventType: "ingest_ok",
      leadId: result.lead.id,
      detail: `Score ${verdict.score.compositeScore}%`,
    });

    return NextResponse.json({
      ingested: true,
      leadId: result.lead.id,
      signalId: result.signal.id,
      compositeScore: result.lead.compositeScore,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
