import { authorizeAgencyAlertCron } from "@/lib/admin/agency-alert-config";
import { runAgencyAlertDigest } from "@/lib/admin/run-agency-alert-digest";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = authorizeAgencyAlertCron(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAgencyAlertDigest();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }
    return NextResponse.json({
      sent: result.sent,
      itemCount: result.itemCount,
      recipients: result.recipients,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Alert digest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}