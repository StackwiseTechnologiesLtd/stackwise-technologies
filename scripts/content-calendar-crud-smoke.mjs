#!/usr/bin/env node
/**
 * Smoke: create, update, delete a content calendar post (same DB paths as API).
 *   node scripts/content-calendar-crud-smoke.mjs
 */
import { randomUUID } from "node:crypto";
import process from "node:process";
import { neon } from "@neondatabase/serverless";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const SMOKE_PREFIX = "[smoke-crud]";
const today = new Date().toISOString().slice(0, 10);

async function main() {
  await sql`DELETE FROM content_calendar_posts WHERE title LIKE ${`${SMOKE_PREFIX}%`}`;

  const id = randomUUID();
  const title = `${SMOKE_PREFIX} save delete check`;

  await sql`
    INSERT INTO content_calendar_posts (
      id, title, scheduled_on, channel, status, script, notes, accent, updated_at
    ) VALUES (
      ${id}::uuid,
      ${title},
      ${today}::date,
      'instagram',
      'draft',
      'smoke script',
      'smoke notes',
      '#7038f4',
      NOW()
    )
  `;

  const created = await sql`
    SELECT id, title, script FROM content_calendar_posts WHERE id = ${id}::uuid
  `;
  if (created.length !== 1 || created[0].title !== title) {
    throw new Error("Create failed");
  }
  console.log("✓ create");

  const patched = `${title} (updated)`;
  await sql`
    UPDATE content_calendar_posts
    SET title = ${patched}, script = 'smoke script v2', updated_at = NOW()
    WHERE id = ${id}::uuid
  `;
  const updated = await sql`SELECT title, script FROM content_calendar_posts WHERE id = ${id}::uuid`;
  if (updated[0]?.title !== patched || updated[0]?.script !== "smoke script v2") {
    throw new Error("Update failed");
  }
  console.log("✓ update (save)");

  await sql`DELETE FROM content_calendar_posts WHERE id = ${id}::uuid`;
  const gone = await sql`SELECT 1 FROM content_calendar_posts WHERE id = ${id}::uuid`;
  if (gone.length !== 0) {
    throw new Error("Delete failed");
  }
  console.log("✓ delete");
  console.log("Content calendar CRUD smoke passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});