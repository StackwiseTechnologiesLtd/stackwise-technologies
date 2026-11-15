"use client";

import type { AgencyOverviewPayload } from "@/lib/admin/agency-overview";
import { growthHubLinks } from "@/lib/admin/nav-meta";
import { crmStageLabels } from "@/lib/crm/types";
import type { CrmOpportunity } from "@/lib/crm/types";
import type { IntegrationServiceStatus } from "@/lib/integrations/repository";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { useCallback, useState } from "react";

type OverviewResponse = AgencyOverviewPayload & { email: string };

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

function StatCard({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: number | string;
  hint: string;
  href?: string;
  accent?: "default" | "success" | "danger" | "warn";
}) {
  const borderAccent =
    accent === "success"
      ? "border-emerald-500/25"
      : accent === "danger"
        ? "border-red-500/30"
        : accent === "warn"
          ? "border-amber-500/30"
          : "border-line/90";

  const inner = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
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

function IntegrationChip({ service }: { service: IntegrationServiceStatus }) {
  const healthy =
    service.configured &&
    (service.lastSuccessAt != null || service.id === "crm" || service.id === "harvest");
  return (
    <Link
      href="/admin/growth/settings"
      className={`rounded-lg border px-3 py-2 text-xs transition-colors hover:border-accent/35 ${
        healthy ? "border-line bg-black/20" : "border-amber-500/25 bg-amber-500/5"
      }`}
    >
      <span className="font-medium text-foreground">{service.label}</span>
      <span className="mt-0.5 block text-[11px] text-muted">
        {service.lastSuccessAt
          ? `Last ok ${formatWhen(service.lastSuccessAt)}`
          : service.configured
            ? "Configured"
            : "Needs setup"}
      </span>
    </Link>
  );
}

function CrmStageBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums font-medium text-foreground">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-accent/70 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RecentOpportunityRow({ opp }: { opp: CrmOpportunity }) {
  return (
    <Link
      href={`/admin/crm/opportunities/${opp.id}`}
      className="flex items-center justify-between gap-3 border-b border-line/60 px-5 py-3 text-sm last:border-0 hover:bg-white/[0.03]"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{opp.name}</p>
        <p className="truncate text-xs text-muted">
          {crmStageLabels[opp.stage]} · fit {opp.fitScore}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted">
        {formatWhen(opp.updatedAt)}
      </span>
    </Link>
  );
}

const flowSteps = [
  {
    step: "1",
    title: "Connect & harvest",
    body: "LinkedIn, X, jobs, web discover — feed the pipeline.",
    href: "/admin/growth/discover",
  },
  {
    step: "2",
    title: "Triage & DM",
    body: "Growth inbox, Instagram campaigns, and tracked replies.",
    href: "/admin/growth/inbox",
  },
  {
    step: "3",
    title: "Close & bill",
    body: "CRM stages, agreements, and payment links for clients.",
    href: "/admin/crm",
  },
];

function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-14 w-2/3 max-w-md rounded-xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-line bg-panel" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-line bg-panel" />
    </div>
  );
}

export function AgencyOverviewDashboard() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Could not load agency overview");
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

  if (loading && !data) return <OverviewSkeleton />;
  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-200">
        {error}
        <button type="button" onClick={() => void load()} className="ml-3 text-accent underline">
          Retry
        </button>
      </div>
    );
  }
  if (!data) return null;

  const maxStage = Math.max(1, ...data.crm.byStage.map((s) => s.count));
  const ig = data.instagram;

  return (
    <div className="space-y-8 pb-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Good {dayPart()}, {greetingName(data.email)}
      </h1>
      <p className="-mt-6 text-sm text-muted">
        Billing, growth, CRM, and Instagram automation in one place.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="CRM pipeline"
          value={data.crm.activeOpportunities}
          hint="Active opportunities"
          href="/admin/crm"
        />
        <StatCard
          label="Growth triage"
          value={data.growth.triageLeads}
          hint="New & reviewed leads"
          href="/admin/growth/inbox"
          accent={data.growth.triageLeads > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Open invoices"
          value={data.billing.openPaymentLinks}
          hint={`${data.billing.draftPaymentLinks} draft link(s)`}
          href="/admin"
        />
        <StatCard
          label="Instagram sends"
          value={ig.metrics.sentThisWeek}
          hint={`${ig.metrics.failedThisWeek} failed · ${ig.status.activeCampaigns} live campaigns`}
          href="/admin/instagram"
          accent={ig.metrics.failedThisWeek > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-line bg-panel/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Pipeline by stage</h2>
            <Link href="/admin/crm" className="text-xs font-medium text-accent hover:underline">
              Open CRM →
            </Link>
          </header>
          <div className="space-y-4 p-5">
            {data.crm.byStage.map((row) => (
              <CrmStageBar
                key={row.stage}
                label={row.label}
                count={row.count}
                max={maxStage}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <header className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Instagram ops</h2>
            <p className="mt-1 text-xs text-muted">
              {ig.status.connectedAccounts} account(s) · webhook{" "}
              {ig.status.lastWebhookAt ? formatWhen(ig.status.lastWebhookAt) : "never"}
            </p>
          </header>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <StatCard
              label="Queued"
              value={ig.metrics.queuedNow}
              hint="Campaign deliveries"
              href="/admin/instagram/activity"
            />
            <StatCard
              label="Paused campaigns"
              value={ig.metrics.pausedCampaigns}
              hint="Turn on in Campaigns"
              href="/admin/instagram/campaigns"
            />
          </div>
          <div className="border-t border-line px-5 py-3 text-xs text-muted">
            Last send: {formatWhen(ig.status.lastSendAt)}
            {ig.status.dryRunMode ? (
              <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-200">
                Dry run
              </span>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-panel/90">
        <header className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Recent opportunities</h2>
        </header>
        {data.crm.recent.length === 0 ? (
          <p className="p-5 text-sm text-muted">No opportunities yet — promote a lead from Growth.</p>
        ) : (
          <div>
            {data.crm.recent.map((opp) => (
              <RecentOpportunityRow key={opp.id} opp={opp} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Integrations
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.integrations.services.map((s) => (
            <IntegrationChip key={s.id} service={s} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {flowSteps.map((item) => (
          <Link
            key={item.step}
            href={item.href}
            className="group rounded-xl border border-line bg-panel p-4 transition-colors hover:border-accent/40 hover:bg-accent/5"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              Step {item.step}
            </span>
            <h2 className="mt-2 text-base font-semibold text-foreground group-hover:text-accent">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{item.body}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          All areas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {growthHubLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-line bg-black/20 px-4 py-3 text-sm transition-colors hover:border-accent/35 hover:bg-black/30"
            >
              <span className="font-medium text-foreground">{link.label}</span>
              {link.description ? (
                <span className="mt-0.5 block text-xs text-muted">{link.description}</span>
              ) : null}
            </Link>
          ))}
          <Link
            href="/admin"
            className="rounded-xl border border-line bg-black/20 px-4 py-3 text-sm transition-colors hover:border-accent/35 hover:bg-black/30"
          >
            <span className="font-medium text-foreground">Payment links</span>
            <span className="mt-0.5 block text-xs text-muted">Invoices and checkout</span>
          </Link>
          <Link
            href="/admin/contracts"
            className="rounded-xl border border-line bg-black/20 px-4 py-3 text-sm transition-colors hover:border-accent/35 hover:bg-black/30"
          >
            <span className="font-medium text-foreground">Agreements</span>
            <span className="mt-0.5 block text-xs text-muted">Client contracts</span>
          </Link>
        </div>
      </section>
    </div>
  );
}