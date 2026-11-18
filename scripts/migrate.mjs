#!/usr/bin/env node
/**
 * Apply SQL migrations in migrations/*.sql (sorted) to Neon Postgres.
 * Records each file in stackwise_schema_migrations (name, applied_at, checksum) once applied.
 *
 * Usage:
 *   node scripts/migrate.mjs              # .env.local → .env.prod → .env
 *   MIGRATE_ENV=prod node scripts/migrate.mjs   # .env.prod only
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { neon } from "@neondatabase/serverless";

function loadEnvFile(filename, { override = false } = {}) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (override || !process.env[key]) process.env[key] = value;
  }
}

if (process.env.MIGRATE_ENV === "prod") {
  loadEnvFile(".env.prod", { override: true });
} else {
  loadEnvFile(".env.local");
  loadEnvFile(".env.prod");
  loadEnvFile(".env");
  loadEnvFile(".env.example");
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(url);

const MIGRATION_TABLE_BOOTSTRAP = `
CREATE TABLE IF NOT EXISTS stackwise_schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT,
  description TEXT
);
CREATE INDEX IF NOT EXISTS idx_stackwise_schema_migrations_applied_at
  ON stackwise_schema_migrations (applied_at DESC);
`;

async function ensureMigrationTable() {
  for (const statement of MIGRATION_TABLE_BOOTSTRAP.split(";")
    .map((s) => s.trim())
    .filter(Boolean)) {
    await sql.query(statement);
  }
}

async function isMigrationApplied(name) {
  const rows = await sql`SELECT 1 AS ok FROM stackwise_schema_migrations WHERE name = ${name} LIMIT 1`;
  return rows.length > 0;
}

async function recordMigration(name, checksum, description) {
  await sql`
    INSERT INTO stackwise_schema_migrations (name, applied_at, checksum, description)
    VALUES (${name}, NOW(), ${checksum}, ${description})
    ON CONFLICT (name) DO UPDATE SET
      applied_at = EXCLUDED.applied_at,
      checksum = EXCLUDED.checksum,
      description = COALESCE(EXCLUDED.description, stackwise_schema_migrations.description)
  `;
}

function migrationDescription(file, rawSql) {
  const firstComment = rawSql
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("--"));
  if (firstComment) return firstComment.replace(/^--\s*/, "").slice(0, 500);
  return file.replace(/^\d+_/, "").replace(/_/g, " ").replace(/\.sql$/, "");
}

const migrationsDir = path.join(process.cwd(), "migrations");
const files = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

await ensureMigrationTable();

let applied = 0;
let skipped = 0;

for (const file of files) {
  const migrationPath = path.join(migrationsDir, file);
  const migration = fs.readFileSync(migrationPath, "utf8");
  const checksum = crypto.createHash("sha256").update(migration).digest("hex");
  const description = migrationDescription(file, migration);

  if (await isMigrationApplied(file)) {
    console.log(`[skip] ${file} (already recorded)`);
    skipped += 1;
    continue;
  }

  const statements = migration
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
    console.log(`[${file}]`, statement.split("\n")[0].slice(0, 80));
  }

  await recordMigration(file, checksum, description);
  console.log(`[recorded] ${file} at ${new Date().toISOString()}`);
  applied += 1;
}

console.log(`Migration complete: ${applied} applied, ${skipped} skipped (${files.length} files).`);