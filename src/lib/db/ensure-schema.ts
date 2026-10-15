import { MIGRATION_STATEMENTS } from "@/lib/db/migration-statements";
import { getSql, isDatabaseConfigured } from "@/lib/db/postgres";

let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (schemaReady || !isDatabaseConfigured()) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const sql = getSql();
    for (const statement of MIGRATION_STATEMENTS) {
      await sql.query(statement);
    }
    schemaReady = true;
  })();

  return schemaPromise;
}
