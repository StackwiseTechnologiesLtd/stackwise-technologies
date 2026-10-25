import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { sendEmail } from "@/lib/emails/sendEmail";
import { assertOtpNotLocked, clearOtpVerifyAttempts, recordOtpVerifyFailure } from "@/lib/otp/lockout";
import { assertOtpSendAllowed, markOtpSendSuccess } from "@/lib/otp/throttle";
import { brandPortalOtpSubjectHash } from "@/lib/branding-portal/identity";
import {
  findActiveMember,
  resolveOtpMemberByEmail,
} from "@/lib/branding-portal/members";

const OTP_TTL_MS = 10 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

const memoryOtps = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  const value = (crypto.getRandomValues(new Uint32Array(1))[0] % 900_000) + 100_000;
  return String(value);
}

export async function sendBrandPortalLoginOtpForEmail(
  email: string,
): Promise<{ success: boolean; dispatched: boolean }> {
  const member = await resolveOtpMemberByEmail(email);
  if (!member) {
    if (!isProduction) {
      console.info("[brand-portal-otp] no unique OTP member for email");
    }
    return { success: true, dispatched: false };
  }
  return sendBrandPortalLoginOtp(member.brandSlug, email);
}

export async function sendBrandPortalLoginOtp(
  brandSlug: string,
  email: string,
): Promise<{ success: boolean; dispatched: boolean }> {
  const member = await findActiveMember(brandSlug, email);
  const subjectHash = await brandPortalOtpSubjectHash(brandSlug, email);

  if (!member || member.authMethod !== "otp" || !subjectHash) {
    if (!isProduction) {
      console.info("[brand-portal-otp] no active OTP member — responding without sending");
    }
    return { success: true, dispatched: false };
  }

  await ensureSchema();
  await assertOtpNotLocked(subjectHash);
  await assertOtpSendAllowed(subjectHash);

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
      to: member.email,
      template: "login-otp",
      version: "0.0.1",
      metadata: {
        otp,
        displayName: member.email.split("@")[0] ?? "there",
        subject: `Your brand guidelines code: ${otp}`,
      },
    });
    sent = true;
    await markOtpSendSuccess(subjectHash);
  } catch (error) {
    if (!isProduction) {
      console.info(`[brand-portal-otp] email failed, dev code=${otp}`, error);
    } else {
      throw error;
    }
  }

  if (!isProduction) {
    console.info(
      `[brand-portal-otp] code=${otp} brand=${member.brandSlug} email=${member.email} sent=${sent}`,
    );
  }

  return { success: true, dispatched: true };
}

export async function verifyBrandPortalLoginOtpForEmail(
  email: string,
  otp: string,
): Promise<{ email: string; brandSlug: string }> {
  const member = await resolveOtpMemberByEmail(email);
  if (!member) {
    throw new Error("Invalid or expired code");
  }
  return verifyBrandPortalLoginOtp(member.brandSlug, email, otp);
}

export async function verifyBrandPortalLoginOtp(
  brandSlug: string,
  email: string,
  otp: string,
): Promise<{ email: string; brandSlug: string }> {
  const member = await findActiveMember(brandSlug, email);
  const subjectHash = await brandPortalOtpSubjectHash(brandSlug, email);

  if (!member || member.authMethod !== "otp" || !subjectHash) {
    throw new Error("Invalid or expired code");
  }

  await ensureSchema();
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
    valid = Boolean(entry && entry.otp === otp && entry.expiresAt > Date.now());
    if (valid) memoryOtps.delete(subjectHash);
  }

  if (!valid) {
    await recordOtpVerifyFailure(subjectHash);
    throw new Error("Invalid or expired code");
  }

  await clearOtpVerifyAttempts(subjectHash);
  return { email: member.email, brandSlug: member.brandSlug };
}
