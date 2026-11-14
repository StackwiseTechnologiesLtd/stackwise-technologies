import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { normalizeAdminEmail } from "@/lib/otp/identity";

async function ready() {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL is required");
  await ensureSchema();
}

export type InstagramOperatorGrant = {
  id: string;
  email: string;
  label: string | null;
  instagramAccountId: string | null;
  createdAt: string;
  createdBy: string | null;
};

export async function listInstagramGrants(): Promise<InstagramOperatorGrant[]> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    email: string;
    label: string | null;
    instagram_account_id: string | null;
    created_at: string;
    created_by: string | null;
  }>(
    await sql`
      SELECT id, email, label, instagram_account_id, created_at, created_by
      FROM instagram_operator_grants
      ORDER BY email ASC
    `,
  );
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    label: row.label,
    instagramAccountId: row.instagram_account_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }));
}

export async function getInstagramGrantForEmail(
  email: string,
): Promise<InstagramOperatorGrant | null> {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return null;
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    email: string;
    label: string | null;
    instagram_account_id: string | null;
    created_at: string;
    created_by: string | null;
  }>(
    await sql`
      SELECT id, email, label, instagram_account_id, created_at, created_by
      FROM instagram_operator_grants
      WHERE LOWER(email) = ${normalized}
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    label: row.label,
    instagramAccountId: row.instagram_account_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export async function upsertInstagramGrant(input: {
  email: string;
  label?: string | null;
  instagramAccountId?: string | null;
  createdBy?: string | null;
}): Promise<InstagramOperatorGrant> {
  const normalized = normalizeAdminEmail(input.email);
  if (!normalized) throw new Error("Invalid email");

  await ready();
  const sql = getSql();
  const existing = await getInstagramGrantForEmail(normalized);
  const id = existing?.id ?? crypto.randomUUID();

  if (existing) {
    await sql`
      UPDATE instagram_operator_grants SET
        label = COALESCE(${input.label ?? null}, label),
        instagram_account_id = ${input.instagramAccountId ?? null}::uuid,
        created_by = COALESCE(${input.createdBy ?? null}, created_by)
      WHERE id = ${id}::uuid
    `;
  } else {
    await sql`
      INSERT INTO instagram_operator_grants (
        id, email, label, instagram_account_id, created_by
      ) VALUES (
        ${id}::uuid,
        ${normalized},
        ${input.label ?? null},
        ${input.instagramAccountId ?? null}::uuid,
        ${input.createdBy ?? null}
      )
    `;
  }

  const grant = await getInstagramGrantForEmail(normalized);
  if (!grant) throw new Error("Grant upsert failed");
  return grant;
}

export async function deleteInstagramGrant(id: string): Promise<void> {
  await ready();
  const sql = getSql();
  await sql`DELETE FROM instagram_operator_grants WHERE id = ${id}::uuid`;
}