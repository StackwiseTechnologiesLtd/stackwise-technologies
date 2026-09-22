import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(url);
const migrationPath = path.join(process.cwd(), "migrations/0001_neon_init.sql");
const migration = fs.readFileSync(migrationPath, "utf8");

await sql.unsafe(migration);
console.log("Migration applied:", migrationPath);
