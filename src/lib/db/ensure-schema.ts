import fs from "node:fs";
import path from "node:path";
import { getSql, isDatabaseConfigured } from "@/lib/db/postgres";

let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (schemaReady || !isDatabaseConfigured()) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const sql = getSql();
    const migrationPath = path.join(
      process.cwd(),
      "migrations/0001_neon_init.sql",
    );
    const migration = fs.readFileSync(migrationPath, "utf8");
    const statements = migration
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await sql.query(statement);
    }

    const migrationsDir = path.join(process.cwd(), "migrations");
    for (const file of fs.readdirSync(migrationsDir).sort()) {
      if (file === "0001_neon_init.sql") continue;
      if (!file.endsWith(".sql")) continue;
      const extra = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      for (const statement of extra
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)) {
        await sql.query(statement);
      }
    }

    schemaReady = true;
  })();

  return schemaPromise;
}
