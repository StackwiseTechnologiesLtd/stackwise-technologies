"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
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

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/admin/instagram/grants?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Removed");
      await load();
    } catch {
      toast.error("Could not remove");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h2 className="text-base font-semibold">Invite operator</h2>
        <p className="mt-1 text-sm text-muted">
          Operators sign in at the same admin login with OTP. They only see Instagram
          automations — not billing or other growth tools. Scope to one account or leave all
          accounts if you only have one connected.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Work email
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Label
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Instagram account scope
            <select
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={form.instagramAccountId}
              onChange={(e) =>
                setForm((f) => ({ ...f, instagramAccountId: e.target.value }))
              }
            >
              <option value="">All connected accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.username ? `@${a.username}` : a.igUserId}
                </option>
              ))}
            </select>
          </label>
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
                        onClick={() => void remove(g.id)}
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