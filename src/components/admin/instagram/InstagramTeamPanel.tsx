"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import type { InstagramAccount } from "@/lib/instagram/types";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useState } from "react";

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
        <ul className="mt-3 space-y-2 text-sm">
          {grants.length === 0 ? (
            <li className="text-muted">No operators yet</li>
          ) : (
            grants.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-black/20 px-3 py-2"
              >
                <span>
                  {g.email}
                  {g.label ? ` · ${g.label}` : ""}
                  {g.instagramAccountId
                    ? " · scoped account"
                    : " · all accounts"}
                </span>
                <button
                  type="button"
                  className="text-xs text-red-300 underline"
                  onClick={() => void remove(g.id)}
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}