import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";

async function ready() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for the growth engine");
  }
  await ensureSchema();
}
import type { GrowthPlatform } from "@/lib/growth/types";

export type ConnectBrowserSessionStatus =
  | "login"
  | "syncing"
  | "complete"
  | "error";

export type ConnectBrowserSessionRow = {
  id: string;
  platform: GrowthPlatform;
  puppeteerSessionId: string;
  status: ConnectBrowserSessionStatus;
  lastError: string | null;
};

export async function insertConnectBrowserSession(input: {
  id: string;
  platform: GrowthPlatform;
  puppeteerSessionId: string;
  status: ConnectBrowserSessionStatus;
}): Promise<void> {
  await ready();
  const sql = getSql();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO growth_connect_browser_sessions (
      id, platform, puppeteer_session_id, status, updated_at
    ) VALUES (
      ${input.id}::uuid,
      ${input.platform},
      ${input.puppeteerSessionId},
      ${input.status},
      ${now}::timestamptz
    )
  `;
}

export async function updateConnectBrowserSession(
  id: string,
  patch: { status: ConnectBrowserSessionStatus; lastError?: string | null },
): Promise<void> {
  await ready();
  const sql = getSql();
  const now = new Date().toISOString();
  await sql`
    UPDATE growth_connect_browser_sessions
    SET
      status = ${patch.status},
      last_error = ${patch.lastError ?? null},
      updated_at = ${now}::timestamptz
    WHERE id = ${id}::uuid
  `;
}

export async function getConnectBrowserSession(
  id: string,
): Promise<ConnectBrowserSessionRow | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    platform: string;
    puppeteer_session_id: string;
    status: string;
    last_error: string | null;
  }>(
    await sql`
      SELECT id, platform, puppeteer_session_id, status, last_error
      FROM growth_connect_browser_sessions
      WHERE id = ${id}::uuid
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    platform: row.platform as GrowthPlatform,
    puppeteerSessionId: row.puppeteer_session_id,
    status: row.status as ConnectBrowserSessionStatus,
    lastError: row.last_error,
  };
}
