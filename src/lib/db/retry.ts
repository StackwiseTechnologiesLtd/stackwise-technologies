import { resetSqlClient } from "@/lib/db/postgres";

const RETRY_DELAYS_MS = [0, 300, 900];

export function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { message?: string; sourceError?: unknown; name?: string };
  const msg = String(e.message ?? "");
  if (
    msg.includes("fetch failed") ||
    msg.includes("Connect Timeout") ||
    msg.includes("connecting to database")
  ) {
    return true;
  }
  const source = e.sourceError;
  if (source && typeof source === "object") {
    const s = source as { message?: string; cause?: { code?: string } };
    if (String(s.message ?? "").includes("fetch failed")) return true;
    if (s.cause?.code === "UND_ERR_CONNECT_TIMEOUT") return true;
  }
  return false;
}

export async function withDbRetry<T>(
  label: string,
  fn: () => Promise<T>,
  options?: { attempts?: number },
): Promise<T> {
  const attempts = options?.attempts ?? RETRY_DELAYS_MS.length;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      resetSqlClient();
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[i] ?? 1000));
    }
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || i === attempts - 1) {
        throw error;
      }
      console.warn(`[db-retry] ${label} attempt ${i + 1}/${attempts}: transient error`);
    }
  }
  throw lastError;
}