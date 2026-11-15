"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type { InstagramAccount, InstagramCampaignInsight } from "@/lib/instagram/types";
import Link from "next/link";

function ctrPercent(clicks: number, sent: number): string {
  if (sent <= 0) return "—";
  return `${((clicks / sent) * 100).toFixed(1)}%`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function accountLabel(accounts: InstagramAccount[], accountId: string): string {
  const a = accounts.find((x) => x.id === accountId);
  if (a?.username) return `@${a.username}`;
  return a?.igUserId?.slice(0, 10) ?? "—";
}

function triggerChip(trigger: InstagramCampaignInsight["triggerType"]): string {
  if (trigger === "dm") return "bg-sky-500/15 text-sky-300";
  if (trigger === "story_reply") return "bg-violet-500/15 text-violet-300";
  return "bg-fuchsia-500/15 text-fuchsia-300";
}

export function InstagramCampaignInsightsTable({
  insights,
  accounts,
  compact,
  emptyMessage = "No automations yet.",
  onToggleActive,
  onDelete,
}: {
  insights: InstagramCampaignInsight[];
  accounts: InstagramAccount[];
  compact?: boolean;
  emptyMessage?: string;
  onToggleActive?: (id: string, active: boolean) => void;
  onDelete?: (id: string, name: string) => void;
}) {
  if (insights.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line/80 text-[11px] uppercase tracking-wide text-muted">
            <th className="px-5 py-3 font-medium">Campaign</th>
            {!compact ? (
              <th className="hidden px-3 py-3 font-medium lg:table-cell">Account</th>
            ) : null}
            <th className="px-3 py-3 text-right font-medium">7d sent</th>
            <th className="hidden px-3 py-3 text-right font-medium sm:table-cell">Total sent</th>
            <th className="hidden px-3 py-3 text-right font-medium md:table-cell">People</th>
            <th className="px-3 py-3 text-right font-medium">Clicks</th>
            <th className="hidden px-3 py-3 text-right font-medium md:table-cell">CTR</th>
            {!compact ? (
              <th className="hidden px-3 py-3 text-right font-medium lg:table-cell">7d triggers</th>
            ) : null}
            <th className="hidden px-3 py-3 font-medium xl:table-cell">Last</th>
            <th className="px-5 py-3 font-medium">Status</th>
            {!compact && (onToggleActive || onDelete) ? (
              <th className="px-3 py-3 text-right font-medium">Actions</th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {insights.map((row) => (
            <tr key={row.campaignId} className="hover:bg-white/[0.02]">
              <td className="px-5 py-3.5">
                <Link
                  href={`/admin/instagram/activity?campaignId=${encodeURIComponent(row.campaignId)}`}
                  className="font-medium text-foreground hover:text-accent"
                >
                  {row.name}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  <span
                    className={`mr-1.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${triggerChip(row.triggerType)}`}
                  >
                    {row.triggerType}
                  </span>
                  <code className="text-foreground/85">{row.keyword}</code>
                </p>
              </td>
              {!compact ? (
                <td className="hidden px-3 py-3.5 text-xs text-muted lg:table-cell">
                  {accountLabel(accounts, row.accountId)}
                </td>
              ) : null}
              <td className="px-3 py-3.5 text-right tabular-nums text-emerald-300/90">
                {row.sentLast7Days}
              </td>
              <td className="hidden px-3 py-3.5 text-right tabular-nums sm:table-cell">
                {row.sentTotal}
              </td>
              <td className="hidden px-3 py-3.5 text-right tabular-nums md:table-cell">
                {row.uniqueRecipients}
              </td>
              <td className="px-3 py-3.5 text-right tabular-nums">{row.linkClicks}</td>
              <td className="hidden px-3 py-3.5 text-right tabular-nums text-muted md:table-cell">
                {ctrPercent(row.linkClicks, row.sentTotal)}
              </td>
              {!compact ? (
                <td className="hidden px-3 py-3.5 text-right tabular-nums lg:table-cell">
                  {row.triggersLast7Days}
                </td>
              ) : null}
              <td className="hidden px-3 py-3.5 text-xs text-muted xl:table-cell">
                {formatRelative(row.lastActivityAt)}
                {row.failedTotal > 0 ? (
                  <span className="mt-0.5 block text-red-400/80">{row.failedTotal} failed</span>
                ) : null}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    row.active ? "text-emerald-300" : "text-muted"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${row.active ? "bg-emerald-400" : "bg-white/30"}`}
                  />
                  {row.active ? "Live" : "Paused"}
                </span>
              </td>
              {!compact && (onToggleActive || onDelete) ? (
                <td className="px-3 py-3.5 text-right">
                  <span className="inline-flex flex-wrap justify-end gap-2">
                    {onToggleActive ? (
                      <AdminActionButton onClick={() => onToggleActive(row.campaignId, !row.active)}>
                        {row.active ? "Pause" : "Resume"}
                      </AdminActionButton>
                    ) : null}
                    {onDelete ? (
                      <AdminActionButton
                        className="text-red-400 hover:text-red-300"
                        onClick={() => onDelete(row.campaignId, row.name)}
                      >
                        Delete
                      </AdminActionButton>
                    ) : null}
                  </span>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InstagramSendTrendChart({
  days,
}: {
  days: { day: string; sent: number; failed: number }[];
}) {
  const max = Math.max(1, ...days.map((d) => d.sent + d.failed));
  if (days.length === 0) {
    return <p className="text-xs text-muted">No sends in the last 7 days.</p>;
  }

  return (
    <div className="flex h-24 items-end gap-1.5" aria-label="Sends per day, last 7 days">
      {days.map((d) => {
        const sentH = (d.sent / max) * 100;
        const failH = (d.failed / max) * 100;
        const label = d.day.slice(5);
        return (
          <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 flex-col justify-end gap-0.5">
              {d.failed > 0 ? (
                <div
                  className="w-full rounded-sm bg-red-500/70"
                  style={{ height: `${failH}%`, minHeight: d.failed ? 2 : 0 }}
                  title={`${d.failed} failed`}
                />
              ) : null}
              <div
                className="w-full rounded-sm bg-emerald-500/80"
                style={{ height: `${sentH}%`, minHeight: d.sent ? 3 : 0 }}
                title={`${d.sent} sent`}
              />
            </div>
            <span className="text-[9px] tabular-nums text-muted">{label}</span>
          </div>
        );
      })}
    </div>
  );
}