import { neon } from "@neondatabase/serverless";

export type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql(): SqlClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

export function asRows<T>(result: unknown): T[] {
  return result as T[];
}
