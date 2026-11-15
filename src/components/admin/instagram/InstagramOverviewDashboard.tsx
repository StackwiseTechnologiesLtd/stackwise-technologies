"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type {
  InstagramAccount,
  InstagramCampaign,
  InstagramDelivery,
  InstagramDeliveryMetrics,
  InstagramOpsStatus,
} from "@/lib/instagram/types";
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui/buttons";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";

type DashboardPayload = {
  status: InstagramOpsStatus;
  metrics: InstagramDeliveryMetrics;
  campaigns: InstagramCampaign[];
  accounts: InstagramAccount[];
  recentDeliveries: InstagramDelivery[];
  campaignSentCounts: Record<string, number>;
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

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return formatWhen(iso);
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

function dayPart(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function triggerLabel(trigger: InstagramCampaign["triggerType"]): string {
  if (trigger === "dm") return "DM";
  if (trigger === "story_reply") return "Story";
  return "Comment";
}

function triggerChipClass(trigger: InstagramCampaign["triggerType"]): string {
  if (trigger === "dm") return "bg-sky-500/15 text-sky-300";
  if (trigger === "story_reply") return "bg-violet-500/15 text-violet-300";
  return "bg-fuchsia-500/15 text-fuchsia-300";
}

function accountLabel(accounts: InstagramAccount[], accountId: string): string {
  const a = accounts.find((x) => x.id === accountId);
  if (a?.username) return `@${a.username}`;
  return a?.igUserId?.slice(0, 10) ?? "Account";
}

function initialsFromDelivery(d: InstagramDelivery): string {
  const u = d.recipientUsername?.replace(/^@/, "") ?? "";
  if (u.length >= 2) return u.slice(0, 2).toUpperCase();
  if (u.length === 1) return u.toUpperCase();
  return (d.recipientIgsid?.slice(-2) ?? "??").toUpperCase();
}

type CampaignTab = "active" | "paused" | "all";

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pb-8">
      <div className="h-16 w-2/3 max-w-md rounded-xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-line bg-panel" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="h-80 rounded-2xl border border-line bg-panel" />
        <div className="h-80 rounded-2xl border border-line bg-panel" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  hintClass,
  href,
  accent,
}: {
  label: string;
  value: number | string;
  hint: string;
  hintClass?: string;
  href?: string;
  accent?: "default" | "success" | "danger";
}) {
  const borderAccent =
    accent === "success"
      ? "border-emerald-500/25"
      : accent === "danger"
        ? "border-red-500/30"
        : "border-line/90";

  const inner = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className={`mt-1 text-xs ${hintClass ?? "text-muted"}`}>{hint}</p>
    </>
  );

  const className = `block rounded-2xl border ${borderAccent} bg-panel/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-panel`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

function StatusBadge({ status }: { status: InstagramDelivery["status"] }) {
  const styles: Record<string, string> = {
    sent: "bg-emerald-500/15 text-emerald-300",
    failed: "bg-red-500/15 text-red-300",
    queued: "bg-amber-500/15 text-amber-200",
    skipped: "bg-white/8 text-muted",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status] ?? styles.skipped}`}
    >
      {status}
    </span>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

export function InstagramOverviewDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [campaignTab, setCampaignTab] = useState<CampaignTab>("active");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [disconnectBusy, setDisconnectBusy] = useState(false);

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
    const sorted = [...list].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    if (campaignTab === "active") return sorted.filter((c) => c.active);
    if (campaignTab === "paused") return sorted.filter((c) => !c.active);
    return sorted;
  }, [campaignTab, data?.campaigns]);

  const attentionCount = useMemo(() => {
    if (!data) return 0;
    return (
      data.metrics.failedThisWeek +
      data.metrics.queuedNow +
      data.accounts.filter((a) => !a.hasAccessToken || !a.webhookSubscribed).length
    );
  }, [data]);

  const sentWeekMax = useMemo(() => {
    const sent = data?.metrics.sentThisWeek ?? 0;
    const failed = data?.metrics.failedThisWeek ?? 0;
    return Math.max(sent + failed, 1);
  }, [data?.metrics.failedThisWeek, data?.metrics.sentThisWeek]);

  async function confirmDisconnectAccount() {
    if (!disconnectTarget) return;
    setDisconnectBusy(true);
    try {
      const res = await fetch(
        `/api/admin/instagram/accounts/${disconnectTarget.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Disconnect failed");
      toast.toast("Account disconnected.");
      setDisconnectTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setDisconnectBusy(false);
    }
  }

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  const status = data?.status;
  const metrics = data?.metrics;
  const counts = data?.campaignSentCounts ?? {};

  return (
    <div className="space-y-6 pb-10">
      <AdminConfirmDialog
        open={disconnectTarget !== null}
        title={disconnectTarget ? `Disconnect ${disconnectTarget.label}?` : ""}
        description="Soft-remove: tokens cleared and hidden from the portal; campaigns and delivery history stay on this account id."
        confirmLabel="Disconnect account"
        destructive
        busy={disconnectBusy}
        onClose={() => {
          if (!disconnectBusy) setDisconnectTarget(null);
        }}
        onConfirm={() => void confirmDisconnectAccount()}
      />
      {status?.dryRunMode ? (
        <p
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
        >
          <strong>Dry run</strong> — nothing is sent to Instagram until{" "}
          <code className="text-foreground">INSTAGRAM_DRY_RUN=0</code>.
        </p>
      ) : null}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Good {dayPart()}, {greetingName(userEmail)}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {dateHeadline()} · Campaign automations and delivery health
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
            New campaign
          </Link>
          <AdminActionButton
            className={BTN_GHOST + " text-sm"}
            busy={loading}
            busyLabel="…"
            onClick={() => void load()}
          >
            Refresh
          </AdminActionButton>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active campaigns"
          value={status?.activeCampaigns ?? 0}
          hint={
            metrics?.pausedCampaigns
              ? `${metrics.pausedCampaigns} paused`
              : "Live keyword automations"
          }
          href="/admin/instagram/campaigns"
        />
        <StatCard
          label="Connected accounts"
          value={status?.connectedAccounts ?? 0}
          hint={
            data?.access.kind === "owner"
              ? `${status?.metaAppCount ?? 0} Meta app(s) configured`
              : "In your access scope"
          }
          href={
            data?.access.canManageMetaApps
              ? "/admin/instagram/connection"
              : undefined
          }
        />
        <StatCard
          label="Sent this week"
          value={metrics?.sentThisWeek ?? 0}
          hint="Successful deliveries (7 days)"
          hintClass="text-emerald-400/90"
          accent="success"
          href="/admin/instagram/activity?status=sent"
        />
        <StatCard
          label="Needs attention"
          value={attentionCount}
          hint="Failed, queued, or connection issues"
          hintClass={attentionCount > 0 ? "text-red-400/90" : "text-muted"}
          accent={attentionCount > 0 ? "danger" : "default"}
          href={attentionCount > 0 ? "/admin/instagram/activity" : undefined}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-line bg-panel">
            <SectionTitle
              title="Automations"
              action={
                <div className="flex gap-0.5 rounded-lg border border-line bg-black/25 p-0.5 text-xs">
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
                      className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
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
              }
            />

            {filteredCampaigns.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="text-sm text-muted">No automations in this view.</p>
                <Link
                  href="/admin/instagram/campaigns"
                  className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                >
                  Create your first campaign
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line/80 text-[11px] uppercase tracking-wide text-muted">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-3 py-3 font-medium">Trigger</th>
                      <th className="hidden px-3 py-3 font-medium md:table-cell">Keyword</th>
                      <th className="hidden px-3 py-3 font-medium lg:table-cell">Account</th>
                      <th className="px-3 py-3 text-right font-medium">Sent</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {filteredCampaigns.map((c) => (
                      <tr
                        key={c.id}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3.5 font-medium text-foreground">{c.name}</td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${triggerChipClass(c.triggerType)}`}
                          >
                            {triggerLabel(c.triggerType)}
                          </span>
                        </td>
                        <td className="hidden px-3 py-3.5 text-muted md:table-cell">
                          <code className="text-foreground/90">{c.keyword}</code>
                        </td>
                        <td className="hidden px-3 py-3.5 text-xs text-muted lg:table-cell">
                          {accountLabel(data?.accounts ?? [], c.accountId)}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-muted">
                          {counts[c.id] ?? 0}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              c.active ? "text-emerald-300" : "text-muted"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${c.active ? "bg-emerald-400" : "bg-white/30"}`}
                            />
                            {c.active ? "Live" : "Paused"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-line px-5 py-3">
              <Link
                href="/admin/instagram/campaigns"
                className="text-xs font-medium text-accent hover:underline"
              >
                Manage all automations →
              </Link>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-panel">
            <SectionTitle title="Connected accounts" />
            <ul className="divide-y divide-line/60">
              {(data?.accounts ?? []).length === 0 ? (
                <li className="px-5 py-10 text-center text-sm text-muted">
                  No accounts yet.{" "}
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
                  const healthy = a.hasAccessToken && a.webhookSubscribed;
                  return (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-4 px-5 py-4 sm:flex-nowrap"
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          healthy
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-200"
                        }`}
                      >
                        {(a.username?.slice(0, 2) ?? "IG").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {a.username ? `@${a.username}` : a.igUserId}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {a.hasAccessToken ? "Token on file" : "Missing token"}
                          {a.webhookSubscribed ? " · Webhooks active" : " · Webhooks off"}
                        </p>
                      </div>
                      {data?.access.canManageMetaApps ? (
                        <span className="flex gap-2">
                          <Link
                            href="/admin/instagram/connection"
                            className="text-xs font-medium text-accent hover:underline"
                          >
                            Manage
                          </Link>
                          <button
                            type="button"
                            className="text-xs font-medium text-red-400 hover:underline"
                            onClick={() =>
                              setDisconnectTarget({
                                id: a.id,
                                label: a.username ? `@${a.username}` : a.igUserId,
                              })
                            }
                          >
                            Disconnect
                          </button>
                        </span>
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-line bg-panel p-5">
            <h2 className="text-sm font-semibold">Delivery pipeline (7d)</h2>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted">Sent</span>
                  <span className="tabular-nums text-emerald-300">
                    {metrics?.sentThisWeek ?? 0}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-emerald-500/80 transition-all"
                    style={{
                      width: `${((metrics?.sentThisWeek ?? 0) / sentWeekMax) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted">Failed</span>
                  <span className="tabular-nums text-red-300">
                    {metrics?.failedThisWeek ?? 0}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-red-500/70 transition-all"
                    style={{
                      width: `${((metrics?.failedThisWeek ?? 0) / sentWeekMax) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <ul className="mt-5 space-y-2 border-t border-line/80 pt-4 text-xs text-muted">
              <li className="flex justify-between gap-2">
                <span>In queue now</span>
                <span className="font-medium tabular-nums text-foreground">
                  {metrics?.queuedNow ?? 0}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Last webhook</span>
                <span className="text-foreground">{formatRelative(status?.lastWebhookAt ?? null)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Last send</span>
                <span className="text-foreground">{formatRelative(status?.lastSendAt ?? null)}</span>
              </li>
            </ul>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-panel">
            <SectionTitle
              title="Recent activity"
              action={
                <Link href="/admin/instagram/activity" className="text-xs font-medium text-accent">
                  View all
                </Link>
              }
            />
            <p className="border-b border-line/60 px-5 py-2 text-[11px] text-muted">
              Keyword matches on connected accounts only.
            </p>
            <ul className="max-h-[28rem] divide-y divide-line/60 overflow-y-auto">
              {(data?.recentDeliveries ?? []).length === 0 ? (
                <li className="px-5 py-12 text-center text-sm text-muted">
                  Triggers and replies will show up here.
                </li>
              ) : (
                data?.recentDeliveries.map((d) => (
                  <li key={d.id} className="flex gap-3 px-5 py-3.5">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-[11px] font-semibold text-muted"
                      aria-hidden
                    >
                      {initialsFromDelivery(d)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={d.status} />
                        {d.campaignName ? (
                          <span className="truncate text-sm font-medium">{d.campaignName}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {d.recipientUsername ? `@${d.recipientUsername}` : "Recipient"} ·{" "}
                        {formatRelative(d.sentAt ?? d.createdAt)}
                      </p>
                      {d.triggerText ? (
                        <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
                          “{d.triggerText}”
                        </p>
                      ) : null}
                      {d.recipientIgsid && d.accountId ? (
                        <Link
                          href={`/admin/instagram/inbox?accountId=${encodeURIComponent(d.accountId)}&participantIgsid=${encodeURIComponent(d.recipientIgsid)}`}
                          className="mt-1.5 inline-block text-[11px] font-medium text-accent hover:underline"
                        >
                          Open contact
                        </Link>
                      ) : null}
                    </div>
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