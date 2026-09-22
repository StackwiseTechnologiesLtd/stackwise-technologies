import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { neon } from "@neondatabase/serverless";

function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(url);
const migrationPath = path.join(process.cwd(), "migrations/0001_neon_init.sql");
const migration = fs.readFileSync(migrationPath, "utf8");

const statements = migration
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
  console.log("Applied:", statement.split("\n")[0].slice(0, 80));
}

console.log("Migration complete:", migrationPath);
