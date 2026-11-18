import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  getJobApplicationStats,
  listJobApplications,
  jobApplicationResponseStatuses,
  type JobApplicationResponseStatus,
} from "@/lib/jobs/applications";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql } from "@/lib/db/postgres";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "50", 10) || 50),
  );

  try {
    const [applications, stats] = await Promise.all([
      listJobApplications({ limit }),
      getJobApplicationStats(),
    ]);
    return NextResponse.json({ applications, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string; responseStatus?: string };
  try {
    body = (await request.json()) as { id?: string; responseStatus?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id?.trim();
  const responseStatus = body.responseStatus?.trim() as
    | JobApplicationResponseStatus
    | undefined;
  if (!id || !responseStatus) {
    return NextResponse.json(
      { error: "id and responseStatus required" },
      { status: 400 },
    );
  }
  if (!jobApplicationResponseStatuses.includes(responseStatus)) {
    return NextResponse.json({ error: "Invalid responseStatus" }, { status: 400 });
  }

  try {
    await ensureSchema();
    const sql = getSql();
    const now = new Date().toISOString();
    const rows = asRows<{ id: string }>(
      await sql`
        UPDATE crm_job_applications
        SET response_status = ${responseStatus}, updated_at = ${now}::timestamptz
        WHERE id = ${id}::uuid
        RETURNING id
      `,
    );
    if (!rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: rows[0].id, responseStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}