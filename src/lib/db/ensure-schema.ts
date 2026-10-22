import { MIGRATION_STATEMENTS } from "@/lib/db/migration-statements";
import { getSql, isDatabaseConfigured } from "@/lib/db/postgres";

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
    const script = MIGRATION_STATEMENTS.join(";\n");
    await sql.query(script);
    schemaReady = true;
  })();

  return schemaPromise;
}
