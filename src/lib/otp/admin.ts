import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { sendEmail } from "@/lib/emails/sendEmail";
import {
  adminOtpSubjectHash,
  isAllowedAdminEmail,
  normalizeAdminEmail,
} from "@/lib/otp/identity";
import { assertOtpNotLocked, clearOtpVerifyAttempts, recordOtpVerifyFailure } from "@/lib/otp/lockout";
import { assertOtpSendAllowed, markOtpSendSuccess } from "@/lib/otp/throttle";

const OTP_TTL_MS = 10 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

const memoryOtps = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000;
  return String(value);
}

export async function sendAdminLoginOtp(email: string): Promise<{
  success: boolean;
  dispatched: boolean;
  sent: boolean;
}> {
  const normalizedEmail = normalizeAdminEmail(email);
  const subjectHash = normalizedEmail
    ? await adminOtpSubjectHash(normalizedEmail)
    : null;

  if (!normalizedEmail || !subjectHash) {
    throw new Error("Valid email is required");
  }

  await assertOtpNotLocked(subjectHash);
  await assertOtpSendAllowed(subjectHash);

  if (!isAllowedAdminEmail(normalizedEmail)) {
    if (!isProduction) {
      console.info(
        `[admin-otp] no allowlisted admin for ${normalizedEmail} — responding 200 without sending`,
      );
    }
    return { success: true, dispatched: false, sent: false };
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  if (isDatabaseConfigured()) {
    const sql = getSql();
    await sql`DELETE FROM admin_otps WHERE subject_hash = ${subjectHash}`;
    await sql`
      INSERT INTO admin_otps (id, subject_hash, otp, expires_at)
      VALUES (${crypto.randomUUID()}::uuid, ${subjectHash}, ${otp}, ${expiresAt.toISOString()})
    `;
  } else {
    memoryOtps.set(subjectHash, { otp, expiresAt: expiresAt.getTime() });
  }

  let sent = false;
  try {
    await sendEmail({
      to: normalizedEmail,
      template: "login-otp",
      version: "0.0.1",
      metadata: {
        otp,
        displayName: normalizedEmail.split("@")[0] ?? "there",
        subject: `Your Stackwise code: ${otp}`,
      },
    });
    sent = true;
    await markOtpSendSuccess(subjectHash);
  } catch (error) {
    if (!isProduction) {
      console.info(`[admin-otp] email failed, logging code for dev: ${otp}`, error);
      sent = false;
    } else {
      throw error;
    }
  }

  if (!isProduction) {
    console.info(`[admin-otp] code=${otp} email=${normalizedEmail} sent=${sent}`);
  }

  return { success: true, dispatched: true, sent };
}

export async function verifyAdminLoginOtp(
  email: string,
  otp: string,
): Promise<{ email: string }> {
  const normalizedEmail = normalizeAdminEmail(email);
  const subjectHash = normalizedEmail
    ? await adminOtpSubjectHash(normalizedEmail)
    : null;

  if (!normalizedEmail || !subjectHash) {
    throw new Error("Valid email is required");
  }

  if (!isAllowedAdminEmail(normalizedEmail)) {
    throw new Error("Invalid or expired OTP");
  }

  await assertOtpNotLocked(subjectHash);

  let valid = false;

  if (isDatabaseConfigured()) {
    const sql = getSql();
    const rows = asRows<{ otp: string }>(await sql`
      SELECT otp FROM admin_otps
      WHERE subject_hash = ${subjectHash}
        AND otp = ${otp}
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `);
    valid = rows.length > 0;
    if (valid) {
      await sql`DELETE FROM admin_otps WHERE subject_hash = ${subjectHash}`;
    }
  } else {
    const entry = memoryOtps.get(subjectHash);
    valid = Boolean(
      entry && entry.otp === otp && entry.expiresAt > Date.now(),
    );
    if (valid) memoryOtps.delete(subjectHash);
  }

  if (!valid) {
    await recordOtpVerifyFailure(subjectHash);
    throw new Error("Invalid or expired OTP");
  }

  await clearOtpVerifyAttempts(subjectHash);
  return { email: normalizedEmail };
}
