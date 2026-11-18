"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { StackwiseSelect } from "@/components/stackwise";
import { ADMIN_INPUT } from "@/lib/ui/admin";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { useToast } from "@/components/ToastProvider";
import type { InstagramAccount } from "@/lib/instagram/types";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useMemo, useState } from "react";

const GRANT_PAGE_SIZE = 10;

type Grant = {
  id: string;
  email: string;
  label: string | null;
  instagramAccountId: string | null;
};

export function InstagramTeamPanel({
  accounts,
}: {
  accounts: InstagramAccount[];
}) {
  const toast = useToast();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [grantPage, setGrantPage] = useState(1);
  const [form, setForm] = useState({
    email: "",
    label: "",
    instagramAccountId: "",
  });
  const [revokeTarget, setRevokeTarget] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/instagram/grants");
    if (!res.ok) return;
    const data = (await res.json()) as { grants: Grant[] };
    setGrants(data.grants);
  }

  useDeferredEffect(() => {
    void load();
  }, []);

  async function save() {
    try {
      const res = await fetch("/api/admin/instagram/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          label: form.label || null,
          instagramAccountId: form.instagramAccountId || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Team member added");
      setForm({ email: "", label: "", instagramAccountId: "" });
      await load();
    } catch {
      toast.error("Could not save grant");
    }
  }

  const grantTotalPages = Math.max(1, Math.ceil(grants.length / GRANT_PAGE_SIZE));
  const pagedGrants = useMemo(() => {
    const start = (grantPage - 1) * GRANT_PAGE_SIZE;
    return grants.slice(start, start + GRANT_PAGE_SIZE);
  }, [grantPage, grants]);

  async function confirmRevokeGrant() {
    if (!revokeTarget) return;
    setRevokeBusy(true);
    try {
      const res = await fetch(
        `/api/admin/instagram/grants?id=${encodeURIComponent(revokeTarget.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Access removed");
      setRevokeTarget(null);
      await load();
    } catch {
      toast.error("Could not remove");
    } finally {
      setRevokeBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminConfirmDialog
        open={revokeTarget !== null}
        title={revokeTarget ? `Revoke access for ${revokeTarget.email}?` : ""}
        description="They will no longer be able to sign in to the Instagram portal with this email."
        confirmLabel="Revoke access"
        destructive
        busy={revokeBusy}
        onClose={() => {
          if (!revokeBusy) setRevokeTarget(null);
        }}
        onConfirm={() => void confirmRevokeGrant()}
      />
      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h2 className="text-base font-semibold">Invite operator</h2>
        <p className="mt-1 text-sm text-muted">
          Adding someone whitelists their email — we do not send an invite email. They sign in at{" "}
          <strong>/admin/login</strong> with that exact email, request a one-time code, then land in
          the Instagram portal only (not billing or other admin areas). Pick one connected account
          or leave scope empty to allow every connected Instagram account.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Work email
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Label
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </label>
          <div className="text-sm">
            Instagram account scope
            <StackwiseSelect
              aria-label="Instagram account scope"
              className="mt-1"
              value={form.instagramAccountId}
              onChange={(v) =>
                setForm((f) => ({ ...f, instagramAccountId: v }))
              }
              options={[
                { value: "", label: "All connected accounts" },
                ...accounts.map((a) => ({
                  value: a.id,
                  label: a.username ? `@${a.username}` : a.igUserId,
                })),
              ]}
            />
          </div>
        </div>
        <AdminActionButton className="mt-4" onClick={() => void save()}>
          Save invite
        </AdminActionButton>
      </section>

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h2 className="text-base font-semibold">Active grants</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="pb-2 pr-3">Email</th>
                <th className="pb-2 pr-3">Label</th>
                <th className="pb-2 pr-3">Scope</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-muted">
                    No operators yet
                  </td>
                </tr>
              ) : (
                pagedGrants.map((g) => (
                  <tr key={g.id} className="border-t border-line/60">
                    <td className="py-2 pr-3">{g.email}</td>
                    <td className="py-2 pr-3">{g.label ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {g.instagramAccountId ? "Single account" : "All accounts"}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        className="text-xs text-red-300 underline"
                        onClick={() =>
                          setRevokeTarget({ id: g.id, email: g.email })
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {grants.length > GRANT_PAGE_SIZE ? (
          <div className="mt-4">
            <TablePagination
              currentPage={grantPage}
              totalPages={grantTotalPages}
              totalItems={grants.length}
              pageSize={GRANT_PAGE_SIZE}
              onPageChange={setGrantPage}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}