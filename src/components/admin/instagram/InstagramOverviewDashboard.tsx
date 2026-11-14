"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import type {
  InstagramAccount,
  InstagramCampaign,
  InstagramDelivery,
  InstagramDeliveryMetrics,
  InstagramOpsStatus,
} from "@/lib/instagram/types";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui/buttons";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";

type DashboardPayload = {
  status: InstagramOpsStatus;
  metrics: InstagramDeliveryMetrics;
  campaigns: InstagramCampaign[];
  accounts: InstagramAccount[];
  recentDeliveries: InstagramDelivery[];
  access: { kind: "owner" | "operator"; canManageMetaApps: boolean };
};

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function greetingName(email: string | null): string {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "";
  const bit = local.split(/[.+_-]/)[0];
  if (!bit) return "there";
  return bit.charAt(0).toUpperCase() + bit.slice(1).toLowerCase();
}

function dateHeadline(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function triggerLabel(trigger: InstagramCampaign["triggerType"]): string {
  if (trigger === "dm") return "DM keyword";
  if (trigger === "story_reply") return "Story reply";
  return "Comment keyword";
}

function triggerDotClass(trigger: InstagramCampaign["triggerType"]): string {
  if (trigger === "dm") return "bg-sky-400";
  if (trigger === "story_reply") return "bg-violet-400";
  return "bg-fuchsia-400";
}

function deliveryStatusTone(d: InstagramDelivery): string {
  if (d.status === "sent") return "text-emerald-400";
  if (d.status === "failed") return "text-red-400";
  if (d.status === "queued") return "text-amber-300";
  return "text-muted";
}

function accountLabel(accounts: InstagramAccount[], accountId: string): string {
  const a = accounts.find((x) => x.id === accountId);
  if (a?.username) return `@${a.username}`;
  return a?.igUserId?.slice(0, 8) ?? accountId.slice(0, 8);
}

type CampaignTab = "active" | "paused" | "all";

function StatCard({
  label,
  value,
  hint,
  hintClass,
}: {
  label: string;
  value: number | string;
  hint: string;
  hintClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-line/90 bg-panel/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className={`mt-1 text-xs ${hintClass ?? "text-muted"}`}>{hint}</p>
    </div>
  );
}

function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>;
}

export function InstagramOverviewDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [campaignTab, setCampaignTab] = useState<CampaignTab>("active");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, accessRes] = await Promise.all([
        fetch("/api/admin/instagram/dashboard"),
        fetch("/api/admin/instagram/access"),
      ]);
      if (!dashRes.ok) throw new Error("Dashboard load failed");
      setData((await dashRes.json()) as DashboardPayload);
      if (accessRes.ok) {
        const access = (await accessRes.json()) as { email?: string };
        setUserEmail(access.email ?? null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  const filteredCampaigns = useMemo(() => {
    const list = data?.campaigns ?? [];
    if (campaignTab === "active") return list.filter((c) => c.active);
    if (campaignTab === "paused") return list.filter((c) => !c.active);
    return list;
  }, [campaignTab, data?.campaigns]);

  const attentionCount = useMemo(() => {
    if (!data) return 0;
    return (
      data.metrics.failedThisWeek +
      data.metrics.queuedNow +
      data.accounts.filter((a) => !a.hasAccessToken || !a.webhookSubscribed).length
    );
  }, [data]);

  const upcoming = useMemo(() => {
    const queued = (data?.recentDeliveries ?? []).filter((d) => d.status === "queued");
    const failed = (data?.recentDeliveries ?? []).filter((d) => d.status === "failed");
    return [...queued, ...failed].slice(0, 5);
  }, [data?.recentDeliveries]);

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-line bg-panel p-12 text-center text-sm text-muted">
        Loading workspace…
      </div>
    );
  }

  const status = data?.status;
  const metrics = data?.metrics;

  return (
    <div className="space-y-6 pb-8">
      {status?.dryRunMode ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <strong>Dry run</strong> — deliveries are logged, not sent. Set{" "}
          <code className="text-foreground">INSTAGRAM_DRY_RUN=0</code> in production.
        </p>
      ) : null}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}
            , {greetingName(userEmail)}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {dateHeadline()} · Instagram automations across your connected accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data?.access.canManageMetaApps ? (
            <Link href="/admin/instagram/connection" className={BTN_SECONDARY + " text-sm"}>
              Connection
            </Link>
          ) : null}
          <Link href="/admin/instagram/inbox" className={BTN_SECONDARY + " text-sm"}>
            Inbox
          </Link>
          <Link href="/admin/instagram/campaigns" className={BTN_PRIMARY + " text-sm"}>
            + New campaign
          </Link>
          <AdminActionButton busy={loading} busyLabel="Refreshing…" onClick={() => void load()}>
            Refresh
          </AdminActionButton>
        </div>
      </header>

      <Panel className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active campaigns"
          value={status?.activeCampaigns ?? 0}
          hint={
            metrics?.pausedCampaigns
              ? `${metrics.pausedCampaigns} paused`
              : "Keyword automations live"
          }
        />
        <StatCard
          label="Connected accounts"
          value={status?.connectedAccounts ?? 0}
          hint={
            data?.access.kind === "owner"
              ? `${status?.metaAppCount ?? 0} Meta apps`
              : "Accounts you can run"
          }
        />
        <StatCard
          label="Sent this week"
          value={metrics?.sentThisWeek ?? 0}
          hint="DMs & replies delivered"
          hintClass="text-emerald-400/90"
        />
        <StatCard
          label="Needs attention"
          value={attentionCount}
          hint="Failed, queued, or connection gaps"
          hintClass={attentionCount > 0 ? "text-red-400/90" : "text-muted"}
        />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-line bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-sm font-semibold">Campaigns</h2>
              <div className="flex gap-1 rounded-lg border border-line bg-black/30 p-0.5 text-xs">
                {(
                  [
                    ["active", "Active"],
                    ["paused", "Paused"],
                    ["all", "All"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                      campaignTab === id
                        ? "bg-white/10 text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                    onClick={() => setCampaignTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ul className="divide-y divide-line/80">
              {filteredCampaigns.length === 0 ? (
                <li className="px-5 py-10 text-center text-sm text-muted">
                  No campaigns here.{" "}
                  <Link href="/admin/instagram/campaigns" className="text-accent underline">
                    Create one
                  </Link>
                </li>
              ) : (
                filteredCampaigns.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                  >
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${triggerDotClass(c.triggerType)}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {triggerLabel(c.triggerType)} ·{" "}
                        <span className="text-foreground/80">{c.keyword}</span> ·{" "}
                        {accountLabel(data?.accounts ?? [], c.accountId)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        c.active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/8 text-muted"
                      }`}
                    >
                      {c.active ? "Live" : "Paused"}
                    </span>
                    <Link
                      href="/admin/instagram/activity"
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Activity
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-panel">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-semibold">Account health</h2>
            </div>
            <ul className="divide-y divide-line/80">
              {(data?.accounts ?? []).length === 0 ? (
                <li className="px-5 py-8 text-sm text-muted">
                  No accounts in your scope.{" "}
                  {data?.access.canManageMetaApps ? (
                    <Link href="/admin/instagram/connection" className="text-accent underline">
                      Connect Instagram
                    </Link>
                  ) : (
                    "Ask an owner for access."
                  )}
                </li>
              ) : (
                data?.accounts.map((a) => {
                  const ok = a.hasAccessToken && a.webhookSubscribed;
                  return (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm"
                    >
                      <span
                        className={`size-2 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`}
                      />
                      <span className="min-w-0 flex-1 font-medium">
                        {a.username ? `@${a.username}` : a.igUserId}
                      </span>
                      <span className="text-xs text-muted">
                        {a.hasAccessToken ? "Token ok" : "No token"}
                        {a.webhookSubscribed ? " · Webhooks on" : " · Webhooks off"}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </Panel>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-line bg-panel p-5">
            <h2 className="text-sm font-semibold">Pipeline</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between gap-2">
                <span className="text-muted">In queue</span>
                <span className="font-medium tabular-nums">{metrics?.queuedNow ?? 0}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-muted">Failed (7d)</span>
                <span className="font-medium tabular-nums text-red-400/90">
                  {metrics?.failedThisWeek ?? 0}
                </span>
              </li>
              <li className="flex justify-between gap-2 border-t border-line/80 pt-3">
                <span className="text-muted">Last webhook</span>
                <span className="text-xs text-foreground">
                  {formatWhen(status?.lastWebhookAt ?? null)}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-muted">Last send</span>
                <span className="text-xs text-foreground">
                  {formatWhen(status?.lastSendAt ?? null)}
                </span>
              </li>
            </ul>
          </section>

          {upcoming.length > 0 ? (
            <section className="rounded-2xl border border-line bg-panel p-5">
              <h2 className="text-sm font-semibold">Watch list</h2>
              <ul className="mt-3 space-y-3">
                {upcoming.map((d) => (
                  <li key={d.id} className="text-xs">
                    <p className="font-medium text-foreground">
                      {d.campaignName ?? "Automation"} · {d.status}
                    </p>
                    <p className="mt-0.5 text-muted">
                      {d.recipientUsername ? `@${d.recipientUsername}` : d.recipientIgsid}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <Link href="/admin/instagram/activity" className="text-xs font-medium text-accent">
                View all
              </Link>
            </div>
            <ul className="max-h-[22rem] divide-y divide-line/80 overflow-y-auto">
              {(data?.recentDeliveries ?? []).length === 0 ? (
                <li className="px-5 py-8 text-sm text-muted">No deliveries yet.</li>
              ) : (
                data?.recentDeliveries.map((d) => (
                  <li key={d.id} className="px-5 py-3.5">
                    <p className="text-sm text-foreground">
                      <span className={deliveryStatusTone(d)}>{d.status}</span>
                      {d.campaignName ? (
                        <>
                          {" "}
                          · <span className="font-medium">{d.campaignName}</span>
                        </>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {d.recipientUsername ? `@${d.recipientUsername}` : "Recipient"} ·{" "}
                      {formatWhen(d.sentAt ?? d.createdAt)}
                      {d.triggerText ? (
                        <>
                          {" "}
                          — “{d.triggerText.slice(0, 48)}
                          {d.triggerText.length > 48 ? "…" : ""}”
                        </>
                      ) : null}
                    </p>
                    {d.recipientIgsid && d.accountId ? (
                      <Link
                        href={`/admin/instagram/inbox?accountId=${encodeURIComponent(d.accountId)}&participantIgsid=${encodeURIComponent(d.recipientIgsid)}`}
                        className="mt-1 inline-block text-[11px] text-accent hover:underline"
                      >
                        Open thread
                      </Link>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}