import type { ReactNode } from "react";
import type { Locale } from "@/lib/content";

function Frame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-52 flex-col bg-[#070707]">
      <div className="flex items-center gap-1.5 border-b border-white/8 px-3 py-2">
        <span className="size-1.5 rounded-full bg-white/20" />
        <span className="size-1.5 rounded-full bg-white/20" />
        <span className="size-1.5 rounded-full bg-white/20" />
        <span className="ml-2 font-mono text-[10px] text-muted">{title}</span>
      </div>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </div>
  );
}

const labels = {
  en: {
    dashboard: "dashboard",
    design: "design",
    products: "products",
    saas: "saas · admin",
    agent: "agent",
    pipeline: "pipeline",
    codebase: "codebase",
    booking: "discovery call",
    revenue: "Revenue",
    orders: "Orders",
    uptime: "Uptime",
    web: "Web app",
    mobile: "Mobile",
    portal: "Portal",
    search: "Search invoices…",
    history: "History",
    admin: "Admin",
    customers: "Customers",
    toolSearch: "1. Read ops metrics",
    toolApi: "2. Call billing API",
    toolWrite: "3. Write the report",
    done: "→ delivered",
    build: "Build",
    test: "Test",
    deploy: "Deploy",
    before: "before",
    after: "after",
    team: "Named pod",
    slot: "Tue · 30 min",
    book: "Book",
  },
  fr: {
    dashboard: "tableau de bord",
    design: "design",
    products: "produits",
    saas: "saas · admin",
    agent: "agent",
    pipeline: "pipeline",
    codebase: "codebase",
    booking: "appel découverte",
    revenue: "Revenus",
    orders: "Commandes",
    uptime: "Dispo",
    web: "App web",
    mobile: "Mobile",
    portal: "Portail",
    search: "Chercher factures…",
    history: "Historique",
    admin: "Admin",
    customers: "Clients",
    toolSearch: "1. Lire les métriques",
    toolApi: "2. Appeler l’API billing",
    toolWrite: "3. Rédiger le rapport",
    done: "→ livré",
    build: "Build",
    test: "Tests",
    deploy: "Deploy",
    before: "avant",
    after: "après",
    team: "Pod nommé",
    slot: "Mar · 30 min",
    book: "Réserver",
  },
} as const;

function Dashboard({ locale }: { locale: Locale }) {
  const t = labels[locale];
  const metrics = [
    { label: t.revenue, value: "$128k", width: "72%" },
    { label: t.orders, value: "1,842", width: "58%" },
    { label: t.uptime, value: "99.9%", width: "96%" },
  ];

  return (
    <Frame title={t.dashboard}>
      <div className="grid h-full grid-cols-3 gap-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex flex-col justify-between rounded-lg border border-white/8 bg-white/3 p-2"
          >
            <span className="text-[10px] text-muted">{metric.label}</span>
            <span className="text-base font-semibold tracking-tight">
              {metric.value}
            </span>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-accent" style={{ width: metric.width }} />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Design({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <Frame title={t.design}>
      <div className="relative h-full overflow-hidden rounded-lg border border-white/8 bg-white/3 p-3">
        <div className="h-3 w-20 rounded bg-white/15" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-16 rounded-md border border-dashed border-white/20 bg-black/30" />
          <div className="h-16 rounded-md bg-accent/25" />
        </div>
        <div className="mt-2 h-6 w-full rounded bg-white/10" />
        <div className="absolute left-8 top-8 size-7 rounded-full border-2 border-accent" />
        <div className="absolute bottom-4 right-4 rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-white">
          Ship
        </div>
        <div className="absolute left-14 top-14 h-px w-16 rotate-12 bg-accent" />
      </div>
    </Frame>
  );
}

function Products({ locale }: { locale: Locale }) {
  const t = labels[locale];
  const apps = [
    { name: t.web, active: false },
    { name: t.mobile, active: true },
    { name: t.portal, active: false },
  ];

  return (
    <Frame title={t.products}>
      <div className="grid h-full grid-cols-3 gap-2">
        {apps.map((app) => (
          <div
            key={app.name}
            className={`flex flex-col rounded-lg border p-2 ${
              app.active
                ? "border-accent/40 bg-accent/15"
                : "border-white/8 bg-white/3"
            }`}
          >
            <div
              className={`mb-2 size-7 rounded-md ${
                app.active ? "bg-accent/50" : "bg-white/10"
              }`}
            />
            <span
              className={`mt-auto text-[11px] ${
                app.active ? "font-medium text-foreground" : "text-muted"
              }`}
            >
              {app.name}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function SaasSurface({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <Frame title={t.saas}>
      <div className="flex h-full gap-2">
        <div className="flex w-16 flex-col gap-1.5 rounded-lg border border-white/8 bg-white/3 p-2">
          <div className="h-2 w-10 rounded bg-accent/60" />
          <div className="h-2 w-8 rounded bg-white/15" />
          <div className="h-2 w-9 rounded bg-white/15" />
          <span className="mt-auto text-[9px] text-muted">{t.admin}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="rounded-md border border-white/8 bg-black/40 px-2 py-1.5 text-[10px] text-muted">
            {t.search}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>{t.customers}</span>
            <span>{t.history}</span>
          </div>
          <div className="space-y-1">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="flex items-center gap-2 rounded-md border border-white/8 bg-white/3 px-2 py-1.5"
              >
                <span className="size-2 rounded-full bg-accent/70" />
                <span className="h-1.5 flex-1 rounded bg-white/15" />
                <span className="h-1.5 w-8 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function Agents({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <Frame title={t.agent}>
      <ol className="space-y-2 font-mono text-[11px] text-muted">
        <li className="text-foreground">{t.toolSearch}</li>
        <li>{t.toolApi}</li>
        <li>{t.toolWrite}</li>
        <li className="text-accent">{t.done}</li>
      </ol>
    </Frame>
  );
}

function Pipeline({ locale }: { locale: Locale }) {
  const t = labels[locale];
  const stages = [t.build, t.test, t.deploy];
  return (
    <Frame title={t.pipeline}>
      <div className="flex h-full flex-col justify-center gap-3">
        <div className="flex items-center gap-2">
          {stages.map((stage, i) => (
            <div key={stage} className="flex flex-1 items-center gap-2">
              <div className="flex-1 rounded-lg border border-accent/30 bg-accent/15 px-2 py-2 text-center text-[11px] font-medium">
                {stage}
              </div>
              {i < stages.length - 1 ? (
                <span className="text-muted">→</span>
              ) : null}
            </div>
          ))}
        </div>
        <pre className="font-mono text-[10px] leading-4 text-muted">
          {`$ deploy --env prod
> healthy · 3/3 checks`}
        </pre>
      </div>
    </Frame>
  );
}

function Codebase({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <Frame title={t.codebase}>
      <div className="grid h-full grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/8 bg-white/3 p-2">
          <p className="mb-2 text-[9px] uppercase tracking-wider text-muted">
            {t.before}
          </p>
          <pre className="font-mono text-[10px] leading-4 text-muted">
            {`retry()
  .catch(fail)`}
          </pre>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/10 p-2">
          <p className="mb-2 text-[9px] uppercase tracking-wider text-accent">
            {t.after}
          </p>
          <pre className="font-mono text-[10px] leading-4 text-foreground">
            {`retry()
  .recover()`}
          </pre>
        </div>
      </div>
    </Frame>
  );
}

function Booking({ locale }: { locale: Locale }) {
  const t = labels[locale];
  return (
    <Frame title={t.booking}>
      <div className="flex h-full flex-col justify-between rounded-lg border border-white/8 bg-white/3 p-3">
        <div className="flex items-center gap-2">
          {["A", "B", "C"].map((person) => (
            <span
              key={person}
              className="flex size-7 items-center justify-center rounded-full border border-white/15 bg-black/40 text-[10px] font-medium"
            >
              {person}
            </span>
          ))}
          <span className="ml-1 text-[11px] text-muted">{t.team}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/15 px-3 py-2">
          <span className="text-[12px] font-medium">{t.slot}</span>
          <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
            {t.book}
          </span>
        </div>
      </div>
    </Frame>
  );
}

const visuals = [
  Dashboard,
  Design,
  Products,
  SaasSurface,
  Agents,
  Pipeline,
  Codebase,
  Booking,
] as const;

export default function WorkVisual({
  index,
  locale,
}: {
  index: number;
  locale: Locale;
}) {
  const Visual = visuals[index] ?? visuals[0];
  return <Visual locale={locale} />;
}
