"use client";

import type {
  JobApplication,
  JobApplicationStats,
} from "@/lib/jobs/applications";
import { jobApplicationResponseStatuses } from "@/lib/jobs/applications";
import {
  AdminPanelPagination,
  ADMIN_PANEL_PAGE_SIZE,
  paginatePanel,
} from "@/components/admin/AdminPanelPagination";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { useCallback, useState } from "react";

function channelLabel(channel: JobApplication["channel"]): string {
  if (channel === "x_reply") return "X reply";
  if (channel === "ats") return "ATS";
  return "Manual";
}

function statusClass(status: JobApplication["status"]): string {
  if (status === "submitted") return "text-[var(--admin-success)]";
  if (status === "partial") return "text-[var(--admin-warn)]";
  if (status === "failed") return "text-[var(--admin-danger)]";
  return "text-muted";
}

function formatWhen(iso: string): string {
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

export function JobApplicationsPanel({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<JobApplicationStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/job-applications?limit=${compact ? 8 : 50}`,
      );
      if (!res.ok) throw new Error("Could not load applications");
      const data = (await res.json()) as {
        applications: JobApplication[];
        stats: JobApplicationStats;
      };
      setApplications(data.applications);
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }, [compact]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  async function updateResponse(id: string, responseStatus: string) {
    const res = await fetch("/api/admin/job-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, responseStatus }),
    });
    if (res.ok) void load();
  }

  const {
    items: pageItems,
    currentPage,
    totalPages,
    totalItems,
  } = paginatePanel(applications, page, ADMIN_PANEL_PAGE_SIZE);

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Applied (7d)",
              value: stats.submittedLast7Days,
            },
            {
              label: "Applied (30d)",
              value: stats.submittedLast30Days,
            },
            {
              label: "X replies",
              value: stats.xReplyCount,
            },
            {
              label: "Awaiting response",
              value: stats.pendingResponse,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] px-3 py-2.5"
            >
              <p className="text-[11px] text-muted">{kpi.label}</p>
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-[var(--admin-danger)]">
          {error}{" "}
          <button type="button" className="underline" onClick={() => void load()}>
            Retry
          </button>
        </p>
      )}

      <div
        className={`overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] ${
          compact ? "max-h-[22rem]" : ""
        }`}
      >
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--admin-canvas)] text-[11px] font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 sm:px-5">When</th>
              <th className="px-4 py-2.5 sm:px-5">Employer / role</th>
              <th className="px-4 py-2.5 sm:px-5">Channel</th>
              <th className="px-4 py-2.5 sm:px-5">Links</th>
              <th className="px-4 py-2.5 sm:px-5">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)]">
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-muted sm:px-5"
                >
                  No applications recorded yet. Run{" "}
                  <code className="text-xs">npm run growth:x-hiring:apply</code>.
                </td>
              </tr>
            ) : (
              pageItems.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--admin-nav-hover)]">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted sm:px-5">
                    {formatWhen(row.appliedAt)}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <p className="font-medium text-foreground line-clamp-1">
                      {row.employerLabel ?? "—"}
                    </p>
                    {row.roleTitle && (
                      <p className="text-xs text-muted line-clamp-1">
                        {row.roleTitle}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs sm:px-5">
                    <span>{channelLabel(row.channel)}</span>
                    <span className={` block ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs sm:px-5">
                    {row.sourcePostUrl ? (
                      <a
                        href={row.sourcePostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Post
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                    {row.applyUrl && (
                      <>
                        {" · "}
                        <a
                          href={row.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          Apply
                        </a>
                      </>
                    )}
                    {row.opportunityId && (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/crm?o=${row.opportunityId}`}
                          className="text-accent hover:underline"
                        >
                          CRM
                        </Link>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    {!compact ? (
                      <select
                        className="rounded border border-[var(--admin-border)] bg-[var(--admin-canvas)] px-2 py-1 text-xs text-foreground"
                        value={row.responseStatus}
                        onChange={(e) =>
                          void updateResponse(row.id, e.target.value)
                        }
                        aria-label="Application response status"
                      >
                        {jobApplicationResponseStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-muted">
                        {row.responseStatus}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!compact && totalItems > ADMIN_PANEL_PAGE_SIZE && (
        <AdminPanelPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={ADMIN_PANEL_PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}