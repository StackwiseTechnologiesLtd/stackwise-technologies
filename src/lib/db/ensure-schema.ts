import { MIGRATION_SQL_FILE_COUNT } from "@/lib/db/migration-file-count";
import { MIGRATION_STATEMENTS } from "@/lib/db/migration-statements";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";

let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

/** Neon HTTP calls count as Worker subrequests (limit 50). Prod schema: `npm run db:migrate:prod`. */
function shouldRunRuntimeMigrations(): boolean {
  if (process.env.RUNTIME_SCHEMA_MIGRATIONS === "1") return true;
  if (process.env.RUNTIME_SCHEMA_MIGRATIONS === "0") return false;
  return process.env.NODE_ENV !== "production";
}

export async function ensureSchema(): Promise<void> {
  if (schemaReady || !isDatabaseConfigured()) return;
  if (!shouldRunRuntimeMigrations()) {
    schemaReady = true;
    return;
  }
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const sql = getSql();
    try {
      const rows = asRows<{ n: number }>(
        await sql`SELECT COUNT(*)::int AS n FROM stackwise_schema_migrations`,
      );
      const recorded = rows[0]?.n ?? 0;
      if (recorded >= MIGRATION_SQL_FILE_COUNT) {
        schemaReady = true;
        return;
      }
    } catch {
      /* history table missing — apply embedded DDL below */
    }
    for (const statement of MIGRATION_STATEMENTS) {
      await sql.query(statement);
    }
    schemaReady = true;
  })();

  return schemaPromise;
}
