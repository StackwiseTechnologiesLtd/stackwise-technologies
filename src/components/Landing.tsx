import type { ReactNode } from "react";
import CopyCommand from "@/components/CopyCommand";
import FaqList from "@/components/FaqList";
import HeroMock from "@/components/HeroMock";
import ProviderTabs from "@/components/ProviderTabs";
import WorkVisual from "@/components/WorkVisual";
import {
  CALENDLY_URL,
  EMAIL,
  type Locale,
  type SiteCopy,
} from "@/lib/content";

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm text-muted">{children}</p>;
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(226,75,92,0.28)] transition-colors hover:bg-accent-hover"
    >
      {children}
    </a>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-[#141414] px-5 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-white/8"
    >
      {children}
    </a>
  );
}

function HeroInstall({ copy }: { copy: SiteCopy["hero"] }) {
  return (
    <div className="mt-8 space-y-3 text-center">
      <p className="text-sm text-muted">{copy.installLabel}</p>
      <CopyCommand
        value={EMAIL}
        copyLabel={copy.copyLabel}
        copiedLabel={copy.copiedLabel}
      />
      <p className="text-sm text-muted">
        {copy.enterpriseBefore}{" "}
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline decoration-white/20 underline-offset-4 hover:decoration-accent"
        >
          {copy.enterpriseLink}
        </a>
      </p>
    </div>
  );
}

function Hero({ locale, copy }: { locale: Locale; copy: SiteCopy }) {
  return (
    <section id="home" className="relative scroll-mt-24 px-4 pb-8 pt-16 sm:pt-24">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mb-5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          {copy.hero.eyebrow}
          <span className="inline-block size-1.5 rounded-full bg-accent" />
        </p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl">
          {copy.hero.titleLead}{" "}
          <span className="text-gradient-accent">{copy.hero.titleAccent}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/90 sm:text-xl">
          {copy.hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryButton href={CALENDLY_URL}>{copy.hero.primaryCta}</PrimaryButton>
          <SecondaryButton href={`mailto:${EMAIL}`}>
            {copy.hero.secondaryCta}
          </SecondaryButton>
        </div>
        <p className="mt-5 text-sm text-yellow-200/90">
          <span className="mr-1">✦</span>
          {copy.hero.offer}
        </p>
        <p className="mt-2 text-sm text-muted">{copy.hero.requirement}</p>
        <HeroInstall copy={copy.hero} />
      </div>
      <HeroMock locale={locale} copy={copy.hero} />
    </section>
  );
}

function Features({ copy }: { copy: SiteCopy["features"] }) {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <SectionLabel>{copy.label}</SectionLabel>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        {copy.title}
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">{copy.subtitle}</p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid gap-px bg-white/8 md:grid-cols-2">
          <article className="bg-black p-6 sm:p-8 md:col-span-2 md:row-span-2">
            <p className="text-sm text-muted">{copy.featuredKicker}</p>
            <p className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
              {copy.featuredValue}
              <span className="text-accent">.</span>
            </p>
            <p className="mt-2 font-mono text-sm text-accent">{copy.featuredHint}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {copy.featuredBody}
            </p>
          </article>
          {copy.cards.map((card) => (
            <article key={card.kicker} className="bg-black p-6 sm:p-8">
              <p className="text-sm text-muted">{card.kicker}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {card.value}
              </p>
              <p className="mt-1 font-mono text-xs text-accent">{card.hint}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Work({
  locale,
  copy,
}: {
  locale: Locale;
  copy: SiteCopy["work"];
}) {
  return (
    <section id="work" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <SectionLabel>{copy.label}</SectionLabel>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        {copy.title}
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">{copy.subtitle}</p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {copy.items.map((item, index) => (
          <article
            key={item.title}
            className="overflow-hidden rounded-2xl border border-white/10 bg-panel transition-colors hover:bg-panel-hover"
          >
            <WorkVisual index={index} locale={locale} />
            <div className="border-t border-white/8 p-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
                {item.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                {item.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Providers({ copy }: { copy: SiteCopy["providers"] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {copy.kicker}
      </p>
      <SectionLabel>{copy.label}</SectionLabel>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        {copy.title}
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">{copy.subtitle}</p>
      <p className="mt-3 max-w-2xl text-sm text-muted">{copy.aside}</p>
      <ProviderTabs key={copy.tabs.map((tab) => tab.label).join("-")} copy={copy} />
      <p className="mt-4 text-xs text-muted">{copy.note}</p>

      <div className="mt-14 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {copy.inventoryLabel}
          </h3>
          <p className="mt-1 text-sm text-muted">{copy.inventoryCount}</p>
        </div>
      </div>
      <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {copy.inventory.map((item) => (
          <li key={item.title} className="border-t border-white/8 pt-3">
            <p className="font-medium tracking-tight">{item.title}</p>
            <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CompareTable({
  id,
  copy,
}: {
  id?: string;
  copy: SiteCopy["compare"] | SiteCopy["cost"];
}) {
  const isCompare = "rows" in copy && "feature" in copy.rows[0];
  return (
    <section
      id={id}
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6"
    >
      <SectionLabel>{copy.label}</SectionLabel>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        {copy.title}
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">{copy.subtitle}</p>
      <p className="mt-3 text-sm text-muted">{copy.scroll}</p>
      <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-xl border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-muted">
              {copy.columns.map((column) => (
                <th key={column} className="px-5 py-4 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isCompare
              ? (copy as SiteCopy["compare"]).rows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-white/8 last:border-0"
                  >
                    <td className="px-5 py-4 font-medium">{row.feature}</td>
                    <td className="px-5 py-4 text-muted">{row.typical}</td>
                    <td className="px-5 py-4 text-accent">{row.stackwise}</td>
                  </tr>
                ))
              : (copy as SiteCopy["cost"]).rows.map((row) => (
                  <tr
                    key={row.need}
                    className="border-b border-white/8 last:border-0"
                  >
                    <td className="px-5 py-4 font-medium">{row.need}</td>
                    <td className="px-5 py-4 text-muted">{row.scattered}</td>
                    <td className="px-5 py-4 text-accent">{row.stackwise}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">{copy.footnote}</p>
    </section>
  );
}

function Architecture({ copy }: { copy: SiteCopy["architecture"] }) {
  return (
    <section id="process" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <SectionLabel>{copy.label}</SectionLabel>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        {copy.title}
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">{copy.subtitle}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {copy.pills.map((pill) => (
          <span
            key={pill}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted"
          >
            {pill}
          </span>
        ))}
      </div>
      <div className="mt-12 grid gap-10 md:grid-cols-3">
        {copy.steps.map((step) => (
          <article key={step.n}>
            <p className="font-mono text-sm text-muted">{step.n}</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {step.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Faq({ copy }: { copy: SiteCopy["faq"] }) {
  return (
    <section id="faq" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <h2 className="mb-8 text-3xl font-semibold tracking-tight sm:text-5xl">
        {copy.title}
      </h2>
      <FaqList items={copy.items} />
    </section>
  );
}

function Cta({ copy }: { copy: SiteCopy }) {
  return (
    <section className="px-4 pb-28 pt-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm text-muted">{copy.cta.kicker}</p>
        <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          {copy.cta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted sm:text-lg">
          {copy.cta.subtitle}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryButton href={CALENDLY_URL}>
            {copy.hero.primaryCta}
          </PrimaryButton>
          <SecondaryButton href={`mailto:${EMAIL}`}>
            {copy.hero.secondaryCta}
          </SecondaryButton>
        </div>
        <p className="mt-5 text-sm text-yellow-200/90">
          <span className="mr-1">✦</span>
          {copy.cta.offer}
        </p>
        <p className="mt-2 text-sm text-muted">{copy.cta.requirement}</p>
        <div className="mt-8">
          <HeroInstall copy={copy.hero} />
        </div>
      </div>
    </section>
  );
}

export default function Landing({
  locale,
  copy,
}: {
  locale: Locale;
  copy: SiteCopy;
}) {
  return (
    <main>
      <Hero locale={locale} copy={copy} />
      <Features copy={copy.features} />
      <Work locale={locale} copy={copy.work} />
      <Providers copy={copy.providers} />
      <CompareTable id="compare" copy={copy.compare} />
      <CompareTable copy={copy.cost} />
      <Architecture copy={copy.architecture} />
      <Faq copy={copy.faq} />
      <Cta copy={copy} />
    </main>
  );
}
