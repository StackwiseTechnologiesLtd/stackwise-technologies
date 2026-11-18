"use client";

import {
  buildAgencyAttentionItems,
  countUrgentAttention,
  type AgencyAttentionItem,
} from "@/lib/admin/agency-attention";
import type {
  AgencyOverviewPayload,
  AgencyRecentAgreement,
  AgencyRecentPaymentLink,
} from "@/lib/admin/agency-overview";
import type { AgencyDueMilestone } from "@/lib/agency/types";
import {
  AdminPanelPagination,
  ADMIN_PANEL_PAGE_SIZE,
  ADMIN_PANEL_SCROLL_MAX_H,
  paginatePanel,
} from "@/components/admin/AdminPanelPagination";
import { AdminScrollPaginatedPanel } from "@/components/admin/AdminScrollPaginatedPanel";
import { crmStageLabels } from "@/lib/crm/types";
import type { CrmOpportunity } from "@/lib/crm/types";
import type { IntegrationServiceStatus } from "@/lib/integrations/repository";
import { ADMIN_BTN_PRIMARY, ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";

type OverviewResponse = AgencyOverviewPayload & { email: string };

type WorkTab = "pipeline" | "revenue";

function greetingName(email: string): string {
  const local = email.split("@")[0] ?? "";
  const bit = local.split(/[.+_-]/)[0];
  if (!bit) return "there";
  return bit.charAt(0).toUpperCase() + bit.slice(1).toLowerCase();
}

function dayPart(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function dateHeadline(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

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

function KpiCard({
  label,
  value,
  hint,
  hintWarn,
  href,
}: {
  label: string;
  value: number | string;
  hint: string;
  hintWarn?: boolean;
  href?: string;
}) {
  const inner = (
    <Box className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[var(--admin-panel-inset)] transition-colors hover:bg-[var(--admin-surface-hover)]">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p
        className={`mt-1 text-xs ${hintWarn ? "text-[var(--admin-warn)]" : "text-muted"}`}
      >
        {hint}
      </p>
    </Box>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-panel-inset)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function stageDot(stage: CrmOpportunity["stage"]): string {
  const map: Record<string, string> = {
    new: "bg-sky-400",
    reviewed: "bg-violet-400",
    outreach: "bg-amber-400",
    replied: "bg-teal-400",
    booked: "bg-emerald-400",
    won: "bg-emerald-500",
    lost: "bg-zinc-500",
    not_a_fit: "bg-zinc-600",
  };
  return map[stage] ?? "bg-muted";
}

function OpportunityRow({ opp }: { opp: CrmOpportunity }) {
  return (
    <Link
      href={`/admin/crm/opportunities/${opp.id}`}
      className="flex items-start gap-3 border-b border-[var(--admin-border)] px-4 py-3 last:border-0 hover:bg-[var(--admin-nav-hover)] sm:px-5"
    >
      <span
        className={`mt-1.5 size-2 shrink-0 rounded-full ${stageDot(opp.stage)}`}
        aria-hidden
      />
      <Box className="min-w-0 flex-1 text-sm">
        <p className="truncate font-medium text-foreground">{opp.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {crmStageLabels[opp.stage]} · fit {opp.fitScore}
        </p>
      </Box>
      <span className="shrink-0 text-xs text-muted">{formatWhen(opp.updatedAt)}</span>
    </Link>
  );
}

function PipelineStagePanel({
  rows,
  max,
}: {
  rows: AgencyOverviewPayload["crm"]["byStage"];
  max: number;
}) {
  const [page, setPage] = useState(1);
  const paged = paginatePanel(rows, page, ADMIN_PANEL_PAGE_SIZE);

  return (
    <>
      <div
        className={`overflow-y-auto overscroll-y-contain ${ADMIN_PANEL_SCROLL_MAX_H}`}
      >
        <PipelineTable rows={paged.items} max={max} />
      </div>
      <footer className="border-t border-[var(--admin-border)] px-4 py-3 sm:px-5">
        {paged.totalPages > 1 ? (
          <AdminPanelPagination
            currentPage={paged.currentPage}
            totalPages={paged.totalPages}
            totalItems={paged.totalItems}
            pageSize={paged.pageSize}
            onPageChange={setPage}
          />
        ) : (
          <p className="text-xs tabular-nums text-muted">
            1-{paged.totalItems} of {paged.totalItems}
          </p>
        )}
      </footer>
    </>
  );
}

function PipelineTable({
  rows,
  max,
}: {
  rows: AgencyOverviewPayload["crm"]["byStage"];
  max: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead className="bg-[var(--admin-canvas)] text-[11px] font-medium uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium sm:px-5">Stage</th>
            <th className="px-4 py-2.5 font-medium sm:px-5">Count</th>
            <th className="px-4 py-2.5 font-medium sm:px-5">Share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)]">
          {rows.map((row) => {
            const pct = max > 0 ? Math.round((row.count / max) * 100) : 0;
            return (
              <tr key={row.stage} className="hover:bg-[var(--admin-nav-hover)]">
                <td className="px-4 py-3 font-medium text-foreground sm:px-5">
                  {row.label}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted sm:px-5">
                  {row.count}
                </td>
                <td className="px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 min-w-[6rem] flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--admin-border)_60%,transparent)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(pct, row.count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs text-muted">
                      {pct}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActivityRow({ service }: { service: IntegrationServiceStatus }) {
  return (
    <div className="border-b border-[var(--admin-border)] px-4 py-3 last:border-0 sm:px-5">
      <p className="text-sm text-foreground">{service.label}</p>
      <p className="mt-0.5 text-xs text-muted">
        {service.lastSuccessAt
          ? `Last success ${formatWhen(service.lastSuccessAt)}`
          : service.configured
            ? "Configured"
            : "Not set up"}
      </p>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 rounded-xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="h-96 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]" />
        <div className="h-96 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]" />
      </div>
    </div>
  );
}

function Box({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function AgencyOverviewDashboard() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workTab, setWorkTab] = useState<WorkTab>("pipeline");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Could not load overview");
      setData((await res.json()) as OverviewResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  const attention = useMemo(
    () => (data ? buildAgencyAttentionItems(data) : []),
    [data],
  );

  if (loading && !data) return <OverviewSkeleton />;
  if (error && !data) {
    return (
      <Box className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-6 text-sm text-foreground">
        {error}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-3 text-accent underline"
        >
          Try again
        </button>
      </Box>
    );
  }
  if (!data) return null;

  const maxStage = Math.max(1, ...data.crm.byStage.map((s) => s.count));
  const ig = data.instagram;
  const overdueCount = countUrgentAttention(attention);

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <Box>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            Good {dayPart()}, {greetingName(data.email)}
          </h1>
          <p className="mt-1 text-sm text-muted">{dateHeadline()}</p>
        </Box>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          <Link href="/admin/content-calendar" className={ADMIN_BTN_SECONDARY}>
            Content calendar
          </Link>
          <Link href="/admin/payment-links/new" className={ADMIN_BTN_PRIMARY}>
            New payment link
          </Link>
        </div>
      </header>

      <Box className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active pipeline"
          value={data.crm.activeOpportunities}
          hint={
            data.growth.triageLeads > 0
              ? `${data.growth.triageLeads} waiting in inbox`
              : "Opportunities in CRM"
          }
          hintWarn={data.growth.triageLeads > 0}
          href="/admin/crm"
        />
        <KpiCard
          label="Open invoices"
          value={data.revenue.openPaymentLinks + data.revenue.draftPaymentLinks}
          hint={
            data.revenue.draftPaymentLinks > 0
              ? `${data.revenue.draftPaymentLinks} still in draft`
              : "Sent or pending checkout"
          }
          hintWarn={data.revenue.openPaymentLinks > 0}
          href="/admin/payment-links"
        />
        <KpiCard
          label="Paid last 30 days"
          value={data.revenue.paidLast30Days}
          hint={`${data.revenue.activeSubscriptions} active subscriptions`}
          href="/admin/payment-links"
        />
        <KpiCard
          label="Needs review"
          value={overdueCount}
          hint={
            overdueCount > 0
              ? "Open the queue below"
              : `${ig.metrics.sentThisWeek} Instagram sends this week`
          }
          hintWarn={overdueCount > 0}
        />
      </Box>

      <Box className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Panel
            title="Work queue"
            action={
              <Link
                href={workTab === "pipeline" ? "/admin/crm" : "/admin/payment-links"}
                className="text-xs font-medium text-accent hover:underline"
              >
                View all
              </Link>
            }
          >
            <nav
              className="flex gap-1 border-b border-[var(--admin-border)] px-4 pt-2 sm:px-5"
              aria-label="Work queue tabs"
            >
              {(
                [
                  ["pipeline", "Pipeline"],
                  ["revenue", "Revenue"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setWorkTab(id)}
                  className={`rounded-t-md px-3 py-2 text-xs font-medium transition-colors ${
                    workTab === id
                      ? "border border-b-transparent border-[var(--admin-border)] border-t-[var(--accent)] bg-[var(--admin-canvas)] text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
            {workTab === "pipeline" ? (
              <AdminScrollPaginatedPanel
                items={data.crm.recent}
                resetKey={workTab}
                empty="No opportunities yet. Promote a lead from the inbox."
                getKey={(opp) => opp.id}
                renderItem={(opp) => <OpportunityRow opp={opp} />}
              />
            ) : (
              <AdminScrollPaginatedPanel
                items={data.revenue.recentPaymentLinks}
                resetKey={workTab}
                empty="No payment links yet."
                getKey={(link) => link.id}
                renderItem={(link: AgencyRecentPaymentLink) => (
                  <Link
                    href={`/admin/payment-links/${link.id}`}
                    className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3 text-sm last:border-0 hover:bg-[var(--admin-nav-hover)] sm:px-5"
                  >
                    <span className="min-w-0 truncate font-medium text-foreground">
                      {link.customerName}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {link.status.replaceAll("_", " ")} · ${link.amountUsd.toFixed(0)}
                    </span>
                  </Link>
                )}
              />
            )}
          </Panel>

          <Panel
            title="Pipeline by stage"
            action={
              <Link href="/admin/crm" className="text-xs font-medium text-accent hover:underline">
                CRM
              </Link>
            }
          >
            <PipelineStagePanel rows={data.crm.byStage} max={maxStage} />
          </Panel>

          <Panel title="Agreements in review">
            <AdminScrollPaginatedPanel
              items={data.revenue.recentAgreements}
              empty="No agreements yet."
              getKey={(a) => a.id}
              renderItem={(agreement: AgencyRecentAgreement) => (
                <Link
                  href={`/admin/contracts/${agreement.id}`}
                  className="flex flex-col gap-0.5 border-b border-[var(--admin-border)] px-4 py-3 text-sm last:border-0 hover:bg-[var(--admin-nav-hover)] sm:px-5"
                >
                  <span className="truncate font-medium text-foreground">
                    {agreement.title}
                  </span>
                  <span className="text-xs text-muted">
                    {agreement.customerName} · {agreement.status.replaceAll("_", " ")}
                  </span>
                </Link>
              )}
            />
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel
            title="Delivery"
            action={
              <Link
                href="/admin/projects"
                className="text-xs font-medium text-accent hover:underline"
              >
                Projects
              </Link>
            }
          >
            <AdminScrollPaginatedPanel
              items={data.delivery.dueSoon}
              pageSize={4}
              empty="No milestones due in the next 14 days."
              getKey={(m) => m.milestoneId}
              renderItem={(m: AgencyDueMilestone) => (
                <Link
                  href={`/admin/projects/${m.projectId}`}
                  className="block border-b border-[var(--admin-border)] px-4 py-3 text-sm last:border-0 hover:bg-[var(--admin-nav-hover)] sm:px-5"
                >
                  <p className="font-medium text-foreground">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {m.projectTitle} · {m.clientName}
                  </p>
                </Link>
              )}
            />
          </Panel>

          <Panel
            title="Job applications"
            action={
              <Link
                href="/admin/growth/jobs"
                className="text-xs font-medium text-accent hover:underline"
              >
                All applications
              </Link>
            }
          >
            <dl className="grid grid-cols-2 gap-3 border-b border-[var(--admin-border)] px-4 py-3 text-sm sm:px-5">
              <div>
                <dt className="text-xs text-muted">Last 7 days</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {data.jobApplications.stats.submittedLast7Days}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Last 30 days</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {data.jobApplications.stats.submittedLast30Days}
                </dd>
              </div>
            </dl>
            <AdminScrollPaginatedPanel
              items={data.jobApplications.recent}
              pageSize={4}
              empty="No applications logged yet."
              getKey={(a) => a.id}
              renderItem={(a) => (
                <div className="border-b border-[var(--admin-border)] px-4 py-3 text-sm last:border-0 sm:px-5">
                  <p className="font-medium text-foreground line-clamp-1">
                    {a.employerLabel ?? "Application"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {a.channel === "x_reply" ? "X reply" : a.channel}{" "}
                    · {a.status} · {formatWhen(a.appliedAt)}
                  </p>
                  {a.sourcePostUrl ? (
                    <a
                      href={a.sourcePostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-accent hover:underline"
                    >
                      View post
                    </a>
                  ) : null}
                </div>
              )}
            />
          </Panel>

          <Panel title="Due soon">
            <AdminScrollPaginatedPanel
              items={attention}
              pageSize={4}
              empty="Nothing flagged right now."
              getKey={(item) => item.label}
              renderItem={(item: AgencyAttentionItem) => (
                <Link
                  href={item.href}
                  className={`block border-b border-[var(--admin-border)] px-4 py-3 text-sm last:border-0 hover:bg-[var(--admin-nav-hover)] sm:px-5 ${
                    item.tone === "danger"
                      ? "text-[var(--admin-danger)]"
                      : item.tone === "warn"
                        ? "text-[var(--admin-warn)]"
                        : "text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              )}
            />
          </Panel>

          <Panel title="Instagram">
            <dl className="space-y-3 px-4 py-3 text-sm sm:px-5">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Queued</dt>
                <dd className="font-medium tabular-nums">
                  <Link href="/admin/instagram/activity" className="hover:text-accent">
                    {ig.metrics.queuedNow}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Live campaigns</dt>
                <dd className="font-medium tabular-nums">{ig.status.activeCampaigns}</dd>
              </div>
              <div className="flex justify-between gap-2 text-xs text-muted">
                <dt>Last webhook</dt>
                <dd>{formatWhen(ig.status.lastWebhookAt)}</dd>
              </div>
              <div className="flex justify-between gap-2 text-xs text-muted">
                <dt>Last send</dt>
                <dd>{formatWhen(ig.status.lastSendAt)}</dd>
              </div>
            </dl>
            {ig.status.dryRunMode ? (
              <p className="border-t border-[var(--admin-border)] px-4 py-2 text-xs text-[var(--admin-warn)] sm:px-5">
                Dry run mode is on.
              </p>
            ) : null}
          </Panel>

          <Panel
            title="Recent activity"
            action={
              <Link
                href="/admin/growth/settings"
                className="text-xs font-medium text-accent hover:underline"
              >
                Settings
              </Link>
            }
          >
            <AdminScrollPaginatedPanel
              items={data.integrations.services}
              firstLast
              empty="No integration activity yet."
              getKey={(s) => s.id}
              renderItem={(s) => <ActivityRow service={s} />}
            />
          </Panel>

          <Panel title="Brand">
            <dl className="space-y-3 px-4 py-3 text-sm sm:px-5">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Guidelines</dt>
                <dd className="font-medium tabular-nums">
                  <Link href="/admin/brand-guidelines" className="hover:text-accent">
                    {data.brand.publishedBrands}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Portal members</dt>
                <dd className="font-medium tabular-nums">
                  <Link href="/admin/brand-portal" className="hover:text-accent">
                    {data.brand.portalMembers}
                  </Link>
                </dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </Box>
    </div>
  );
}