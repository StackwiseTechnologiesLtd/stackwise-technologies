import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const memoryLockouts = new Map<
  string,
  { failedCount: number; lockedUntil: number | null }
>();

export async function assertOtpNotLocked(subjectHash: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const sql = getSql();
    const rows = asRows<{ locked_until: string | null }>(await sql`
      SELECT locked_until FROM otp_verify_attempts
      WHERE subject_hash = ${subjectHash}
      LIMIT 1
    `);
    const lockedUntil = rows[0]?.locked_until
      ? new Date(String(rows[0].locked_until)).getTime()
      : null;
    if (lockedUntil && lockedUntil > Date.now()) {
      throw new OtpLockedError();
    }
    return;
  }

  const entry = memoryLockouts.get(subjectHash);
  if (entry?.lockedUntil && entry.lockedUntil > Date.now()) {
    throw new OtpLockedError();
  }
}

export async function recordOtpVerifyFailure(subjectHash: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const sql = getSql();
    const rows = asRows<{ failed_count: number; locked_until: string | null }>(
      await sql`
      SELECT failed_count, locked_until FROM otp_verify_attempts
      WHERE subject_hash = ${subjectHash}
      LIMIT 1
    `,
    );

    let failedCount = 1;
    let lockedUntil: Date | null = null;

    if (rows.length) {
      const existing = rows[0]!;
      const locked = existing.locked_until
        ? new Date(String(existing.locked_until)).getTime()
        : null;
      if (locked && locked > Date.now()) {
        throw new OtpLockedError();
      }
      const expired = locked !== null && locked <= Date.now();
      failedCount = expired ? 1 : Number(existing.failed_count) + 1;
    }

    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }

    await sql`
      INSERT INTO otp_verify_attempts (subject_hash, failed_count, locked_until, updated_at)
      VALUES (${subjectHash}, ${failedCount}, ${lockedUntil}, NOW())
      ON CONFLICT (subject_hash) DO UPDATE SET
        failed_count = EXCLUDED.failed_count,
        locked_until = EXCLUDED.locked_until,
        updated_at = NOW()
    `;
    await assertOtpNotLocked(subjectHash);
    return;
  }

  const entry = memoryLockouts.get(subjectHash);
  const failedCount = (entry?.failedCount ?? 0) + 1;
  let lockedUntil: number | null = null;
  if (failedCount >= MAX_FAILED_ATTEMPTS) {
    lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
  }
  memoryLockouts.set(subjectHash, { failedCount, lockedUntil });
  await assertOtpNotLocked(subjectHash);
}

export async function clearOtpVerifyAttempts(subjectHash: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const sql = getSql();
    await sql`DELETE FROM otp_verify_attempts WHERE subject_hash = ${subjectHash}`;
    return;
  }
  memoryLockouts.delete(subjectHash);
}

export class OtpLockedError extends Error {
  status = 429;
  constructor() {
    super("Too many failed attempts. Try again later.");
  }
}
