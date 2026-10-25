import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { getBrand } from "@/lib/branding/brands";
import { hashPortalPassword, verifyPortalPassword } from "@/lib/branding-portal/password";
import {
  normalizeBrandSlug,
  normalizePortalEmail,
} from "@/lib/branding-portal/identity";

export type BrandPortalAuthMethod = "password" | "otp";

export type BrandPortalMember = {
  id: string;
  brandSlug: string;
  email: string;
  authMethod: BrandPortalAuthMethod;
  active: boolean;
  passwordHash: string | null;
};

type MemberRow = {
  id: string;
  brand_slug: string;
  email: string;
  password_hash: string | null;
  auth_method: string;
  active: boolean;
};

const memoryMembers = new Map<string, BrandPortalMember>();

function memberKey(brandSlug: string, email: string): string {
  return `${brandSlug}:${email}`;
}

function rowToMember(row: MemberRow): BrandPortalMember {
  return {
    id: row.id,
    brandSlug: row.brand_slug,
    email: row.email,
    authMethod: row.auth_method === "otp" ? "otp" : "password",
    active: row.active,
    passwordHash: row.password_hash,
  };
}

export async function findActiveMember(
  brandSlug: string,
  email: string,
): Promise<BrandPortalMember | null> {
  const slug = normalizeBrandSlug(brandSlug);
  const normalizedEmail = normalizePortalEmail(email);
  if (!slug || !normalizedEmail || !getBrand(slug)) return null;

  if (isDatabaseConfigured()) {
    await ensureSchema();
    const sql = getSql();
    const rows = asRows<MemberRow>(await sql`
      SELECT id, brand_slug, email, password_hash, auth_method, active
      FROM brand_portal_members
      WHERE brand_slug = ${slug}
        AND email = ${normalizedEmail}
        AND active = TRUE
      LIMIT 1
    `);
    return rows[0] ? rowToMember(rows[0]) : null;
  }

  return memoryMembers.get(memberKey(slug, normalizedEmail)) ?? null;
}

export async function verifyMemberPassword(
  brandSlug: string,
  email: string,
  password: string,
): Promise<BrandPortalMember | null> {
  const member = await findActiveMember(brandSlug, email);
  if (!member || member.authMethod !== "password" || !member.passwordHash) {
    return null;
  }
  const ok = await verifyPortalPassword(password, member.passwordHash);
  return ok ? member : null;
}

export async function listMembers(brandSlug: string): Promise<BrandPortalMember[]> {
  const slug = normalizeBrandSlug(brandSlug);
  if (!slug || !getBrand(slug)) return [];

  if (isDatabaseConfigured()) {
    await ensureSchema();
    const sql = getSql();
    const rows = asRows<MemberRow>(await sql`
      SELECT id, brand_slug, email, password_hash, auth_method, active
      FROM brand_portal_members
      WHERE brand_slug = ${slug}
      ORDER BY created_at DESC
    `);
    return rows.map(rowToMember);
  }

  return [...memoryMembers.values()].filter((m) => m.brandSlug === slug);
}

export async function createMember(input: {
  brandSlug: string;
  email: string;
  authMethod: BrandPortalAuthMethod;
  password?: string;
}): Promise<{ member: BrandPortalMember; temporaryPassword?: string }> {
  const slug = normalizeBrandSlug(input.brandSlug);
  const normalizedEmail = normalizePortalEmail(input.email);
  if (!slug || !normalizedEmail || !getBrand(slug)) {
    throw new Error("Invalid brand or email");
  }

  let temporaryPassword: string | undefined;
  let passwordHash: string | null = null;

  if (input.authMethod === "password") {
    const password = input.password?.trim() || crypto.randomUUID().replace(/-/g, "").slice(0, 14);
    if (!input.password?.trim()) temporaryPassword = password;
    passwordHash = await hashPortalPassword(password);
  }

  const id = crypto.randomUUID();
  const member: BrandPortalMember = {
    id,
    brandSlug: slug,
    email: normalizedEmail,
    authMethod: input.authMethod,
    active: true,
    passwordHash,
  };

  if (isDatabaseConfigured()) {
    await ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO brand_portal_members (
        id, brand_slug, email, password_hash, auth_method, active
      )
      VALUES (
        ${id}::uuid,
        ${slug},
        ${normalizedEmail},
        ${passwordHash},
        ${input.authMethod},
        TRUE
      )
      ON CONFLICT (brand_slug, email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        auth_method = EXCLUDED.auth_method,
        active = TRUE,
        updated_at = NOW()
    `;
  } else {
    memoryMembers.set(memberKey(slug, normalizedEmail), member);
  }

  return { member, temporaryPassword };
}

export async function setMemberActive(
  memberId: string,
  active: boolean,
): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema();
    const sql = getSql();
    await sql`
      UPDATE brand_portal_members
      SET active = ${active}, updated_at = NOW()
      WHERE id = ${memberId}::uuid
    `;
    return;
  }

  for (const [key, member] of memoryMembers) {
    if (member.id === memberId) {
      memoryMembers.set(key, { ...member, active });
      break;
    }
  }
}
