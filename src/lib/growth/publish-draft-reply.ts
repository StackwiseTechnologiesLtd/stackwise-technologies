import { asRows, getSql } from "@/lib/db/postgres";
import type { GrowthSessionCookie } from "@/lib/growth/growth-session-cookie";
import {
  getPlatformSession,
  updateDraft,
} from "@/lib/growth/repository";
import type { GrowthDraft } from "@/lib/growth/types";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { isDatabaseConfigured } from "@/lib/db/postgres";

type DraftRow = {
  signal_id: string | null;
  platform: string;
  body_text: string;
  status: string;
};

type SignalRow = {
  source_url: string | null;
};

function normalizeCookies(cookies: unknown): GrowthSessionCookie[] {
  if (!Array.isArray(cookies)) return [];
  return cookies as GrowthSessionCookie[];
}

async function ready() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for the growth engine");
  }
  await ensureSchema();
}

/** Dev-only X reply posting via local Playwright — not imported from repository (Worker bundle). */
export async function publishDraftReply(
  draftId: string,
  bodyText: string,
): Promise<GrowthDraft> {
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "Posting runs via Playwright on your machine — use npm run dev locally (not production Worker-only deploy yet).",
    );
  }

  await ready();
  const sql = getSql();
  const draftRows = asRows<DraftRow>(
    await sql`SELECT * FROM growth_drafts WHERE id = ${draftId}::uuid LIMIT 1`,
  );
  const draftRow = draftRows[0];
  if (!draftRow) throw new Error("Draft not found");
  if (draftRow.status === "published") {
    throw new Error("This reply was already posted");
  }
  if (draftRow.platform !== "x") {
    throw new Error(
      "Auto-post is only supported for X replies. Copy the draft for LinkedIn.",
    );
  }
  if (!draftRow.signal_id) {
    throw new Error("Draft is missing the source post");
  }

  const signalRows = asRows<SignalRow>(
    await sql`SELECT * FROM growth_signals WHERE id = ${draftRow.signal_id}::uuid`,
  );
  const signal = signalRows[0];
  if (!signal?.source_url) {
    throw new Error("No tweet URL to reply to — re-harvest or capture with a post link");
  }

  const session = await getPlatformSession("x");
  if (!session?.cookies) {
    throw new Error("Connect X in Settings before posting");
  }

  const text = (bodyText.trim() || draftRow.body_text).trim();
  if (!text) throw new Error("Reply text is empty");
  const { publishXReplyWithPlaywright } = await import(
    "@/lib/growth/publish-x-reply"
  );
  const result = await publishXReplyWithPlaywright(
    normalizeCookies(session.cookies),
    session.userAgent,
    signal.source_url,
    text,
  );

  if (!result.ok) {
    await updateDraft(draftId, {
      bodyText: text,
      status: "failed",
      publishError: result.error,
    });
    throw new Error(result.error);
  }

  const updated = await updateDraft(draftId, {
    bodyText: text,
    status: "published",
    markPublished: true,
    publishError: null,
  });
  if (!updated) throw new Error("Draft not found after post");
  return updated;
}
