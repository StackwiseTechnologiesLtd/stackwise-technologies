"use client";

import { useCallback, useState } from "react";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { listBrands } from "@/lib/branding/brands";
import {
  parsePortalEmail,
  parsePortalPassword,
  PORTAL_EMAIL_MAX_LENGTH,
  PORTAL_PASSWORD_MAX_LENGTH,
} from "@/lib/branding-portal/validation";
import { BTN_PRIMARY } from "@/lib/ui/buttons";
import { useToast } from "@/components/ToastProvider";

type MemberRow = {
  id: string;
  brandSlug: string;
  email: string;
  authMethod: "password" | "otp";
  active: boolean;
};

export default function AdminBrandPortalPage() {
  const toast = useToast();
  const brands = listBrands();
  const [brandSlug, setBrandSlug] = useState(brands[0]?.slug ?? "");
  const [email, setEmail] = useState("");
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [password, setPassword] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!brandSlug) return;
    const res = await fetch(
      `/api/admin/brand-portal/members?brandSlug=${encodeURIComponent(brandSlug)}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as { members: MemberRow[] };
    setMembers(data.members);
  }, [brandSlug]);

  useDeferredEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function createMember(e: React.FormEvent) {
    e.preventDefault();
    const parsedEmail = parsePortalEmail(email);
    if (!parsedEmail) {
      toast.error("Enter a valid customer email");
      return;
    }
    if (authMethod === "password" && password.trim()) {
      if (!parsePortalPassword(password)) {
        toast.error("Password must be 8–128 characters");
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brand-portal/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandSlug,
          email: parsedEmail,
          authMethod,
          password: authMethod === "password" ? password.trim() || undefined : undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        temporaryPassword?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not create access");
      if (data.temporaryPassword) {
        toast.toast(`Temporary password: ${data.temporaryPassword}`);
      } else {
        toast.toast("Portal access saved. Customer signs in with email code.");
      }
      setEmail("");
      setPassword("");
      await loadMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create access");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch("/api/admin/brand-portal/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    if (!res.ok) {
      toast.error("Could not update access");
      return;
    }
    await loadMembers();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold">Brand guidelines access</h1>
        <p className="mt-1 text-sm text-muted">
          Invite contracted customers to their guidelines portal. They sign in with email only;
          the account you create determines which brand they see. Use a unique email per customer
          (especially for email-code sign-in).
        </p>
      </div>

      <form onSubmit={createMember} className="space-y-4 rounded-xl border border-line bg-panel p-5">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Brand project</span>
          <select
            className="w-full rounded-lg border border-line bg-background px-3 py-2"
            value={brandSlug}
            onChange={(e) => setBrandSlug(e.target.value)}
          >
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">Customer email</span>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-line bg-background px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={PORTAL_EMAIL_MAX_LENGTH}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">Sign-in method</span>
          <select
            className="w-full rounded-lg border border-line bg-background px-3 py-2"
            value={authMethod}
            onChange={(e) => setAuthMethod(e.target.value as "password" | "otp")}
          >
            <option value="password">Email + password (you set or generate)</option>
            <option value="otp">Email one-time code only</option>
          </select>
        </label>
        {authMethod === "password" ? (
          <label className="block space-y-2">
            <span className="text-sm text-muted">Password (optional — generated if empty)</span>
            <input
              type="text"
              className="w-full rounded-lg border border-line bg-background px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={PORTAL_PASSWORD_MAX_LENGTH}
              autoComplete="off"
            />
          </label>
        ) : null}
        <button type="submit" disabled={loading} className={`${BTN_PRIMARY} px-4 py-2`}>
          {loading ? "Saving…" : "Grant access"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Active invitations</h2>
        <ul className="divide-y divide-line rounded-xl border border-line bg-panel">
          {members.length === 0 ? (
            <li className="p-4 text-sm text-muted">No customers for this project yet.</li>
          ) : (
            members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{m.email}</p>
                  <p className="text-muted">
                    {m.authMethod === "otp" ? "Email code" : "Password"} ·{" "}
                    {m.active ? "Active" : "Revoked"}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-muted underline"
                  onClick={() => void toggleActive(m.id, !m.active)}
                >
                  {m.active ? "Revoke" : "Restore"}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
