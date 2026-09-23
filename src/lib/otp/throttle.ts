import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";

const MIN_INTERVAL_MS = Number(process.env.OTP_MIN_INTERVAL_MS ?? 5000);
const SUCCESS_COOLDOWN_MS = Number(process.env.OTP_SUCCESS_COOLDOWN_MS ?? 90000);

const memoryThrottle = new Map<
  string,
  { lastAttemptAt: number; lastSentAt: number | null }
>();

export class OtpThrottleError extends Error {
  status = 429;
  constructor(message = "Please wait before requesting another code.") {
    super(message);
  }
}

export async function assertOtpSendAllowed(subjectHash: string): Promise<void> {
  const now = Date.now();

  if (isDatabaseConfigured()) {
    const sql = getSql();
    const rows = asRows<{
      last_attempt_at: string | null;
      last_sent_at: string | null;
    }>(await sql`
      SELECT last_attempt_at, last_sent_at FROM otp_send_throttle
      WHERE subject_hash = ${subjectHash}
      LIMIT 1
    `);
    if (rows.length) {
      const row = rows[0]!;
      const lastAttempt = row.last_attempt_at
        ? new Date(String(row.last_attempt_at)).getTime()
        : 0;
      const lastSent = row.last_sent_at
        ? new Date(String(row.last_sent_at)).getTime()
        : null;
      if (now - lastAttempt < MIN_INTERVAL_MS) {
        throw new OtpThrottleError();
      }
      if (lastSent && now - lastSent < SUCCESS_COOLDOWN_MS) {
        throw new OtpThrottleError();
      }
    }

    await sql`
      INSERT INTO otp_send_throttle (subject_hash, last_attempt_at)
      VALUES (${subjectHash}, NOW())
      ON CONFLICT (subject_hash) DO UPDATE SET last_attempt_at = NOW()
    `;
    return;
  }

  const entry = memoryThrottle.get(subjectHash);
  if (entry) {
    if (now - entry.lastAttemptAt < MIN_INTERVAL_MS) {
      throw new OtpThrottleError();
    }
    if (entry.lastSentAt && now - entry.lastSentAt < SUCCESS_COOLDOWN_MS) {
      throw new OtpThrottleError();
    }
  }
  memoryThrottle.set(subjectHash, {
    lastAttemptAt: now,
    lastSentAt: entry?.lastSentAt ?? null,
  });
}

export async function markOtpSendSuccess(subjectHash: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const sql = getSql();
    await sql`
      INSERT INTO otp_send_throttle (subject_hash, last_attempt_at, last_sent_at)
      VALUES (${subjectHash}, NOW(), NOW())
      ON CONFLICT (subject_hash) DO UPDATE SET
        last_attempt_at = NOW(),
        last_sent_at = NOW()
    `;
    return;
  }

  const entry = memoryThrottle.get(subjectHash);
  memoryThrottle.set(subjectHash, {
    lastAttemptAt: entry?.lastAttemptAt ?? Date.now(),
    lastSentAt: Date.now(),
  });
}
