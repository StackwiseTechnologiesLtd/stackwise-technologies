import type { ReactNode } from "react";
import FaqList from "@/components/FaqList";
import HeroMock from "@/components/HeroMock";
import {
  CALENDLY_URL,
  capabilities,
  compareRows,
  EMAIL,
  processSteps,
  stackPills,
  stats,
  workItems,
} from "@/lib/site";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-sm text-muted">{children}</p>
  );
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

function Hero() {
  return (
    <section id="home" className="relative scroll-mt-24 px-4 pb-8 pt-16 sm:pt-24">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mb-5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          Engineering partner
          <span className="inline-block size-1.5 rounded-full bg-accent" />
        </p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl">
          Stackwise<span className="text-gradient-accent">.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/90 sm:text-xl">
          Engineering scalable software for modern businesses.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryButton href={CALENDLY_URL}>Book a call</PrimaryButton>
          <SecondaryButton href={`mailto:${EMAIL}`}>Email us</SecondaryButton>
        </div>
        <p className="mt-5 text-sm text-muted">
          <span className="mr-1 text-yellow-300">✦</span>
          International team · African roots · Built for scale
        </p>
      </div>
      <HeroMock />
    </section>
  );
}

function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionLabel>What we bring</SectionLabel>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        A technology partner, not a ticket mill.
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">
        Custom software, dedicated teams, and AI systems — engineered to last,
        delivered without the agency theatre.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid gap-px bg-white/8 md:grid-cols-2">
          {stats.map((stat, i) => (
            <article
              key={stat.kicker}
              className={`bg-black p-6 sm:p-8 ${i === 0 ? "md:col-span-2" : ""}`}
            >
              <p className="text-sm text-muted">{stat.kicker}</p>
              {i === 0 ? (
                <p className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
                  {stat.value}
                  <span className="text-accent">.</span>
                </p>
              ) : (
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              )}
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                {stat.label}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Work() {
  return (
    <section id="work" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <SectionLabel>In practice</SectionLabel>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        See what we actually ship.
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">
        Every one of these is work we do today — product, platform, and the
        unglamorous systems that keep a company moving.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {workItems.map((item, index) => (
          <article
            key={item.title}
            className="overflow-hidden rounded-2xl border border-white/10 bg-panel transition-colors hover:bg-panel-hover"
          >
            <div className="flex h-28 items-end border-b border-white/8 bg-[radial-gradient(ellipse_at_top_right,rgba(226,75,92,0.18),transparent_55%)] px-6 py-4">
              <span className="font-mono text-xs text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="p-6 sm:p-7">
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

function Capabilities() {
  return (
    <section id="capabilities" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Full inventory</SectionLabel>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {capabilities.length} capabilities
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted">
          Frontend through infrastructure. We pick the stack that fits the
          problem — then we stay on it.
        </p>
      </div>
      <ul className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {capabilities.map((cap) => (
          <li key={cap.title} className="border-t border-white/8 pt-3">
            <p className="font-medium tracking-tight">{cap.title}</p>
            <p className="mt-0.5 text-sm text-muted">{cap.detail}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap gap-2">
        {stackPills.map((pill) => (
          <span
            key={pill}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted"
          >
            {pill}
          </span>
        ))}
      </div>
    </section>
  );
}

function Compare() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionLabel>Side by side</SectionLabel>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        Four vendors. One partner.
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">
        Same essentials. Fewer handoffs and less overhead.
      </p>
      <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-xl border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-muted">
              <th className="px-5 py-4 font-medium">What you need</th>
              <th className="px-5 py-4 font-medium">Piecing it together</th>
              <th className="px-5 py-4 font-medium">Stackwise</th>
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row) => (
              <tr key={row.need} className="border-b border-white/8 last:border-0">
                <td className="px-5 py-4 font-medium">{row.need}</td>
                <td className="px-5 py-4 text-muted">{row.scattered}</td>
                <td className="px-5 py-4 text-accent">{row.stackwise}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section id="process" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <SectionLabel>How we work</SectionLabel>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        Not a factory wearing a product coat.
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">
        Discovery, design, build, and run — in one loop, with the people who
        will still be here after launch.
      </p>
      <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        {processSteps.map((step) => (
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

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <h2 className="mb-8 text-3xl font-semibold tracking-tight sm:text-5xl">
        FAQ
      </h2>
      <FaqList />
    </section>
  );
}

function Cta() {
  return (
    <section className="px-4 pb-28 pt-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm text-muted">Ready when you are</p>
        <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Let&apos;s build.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted sm:text-lg">
          Partner with Stackwise to design, ship, and scale software that
          actually matches how your business works.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryButton href={CALENDLY_URL}>Book a call</PrimaryButton>
          <SecondaryButton href={`mailto:${EMAIL}`}>Email us</SecondaryButton>
        </div>
        <p className="mt-5 text-sm text-muted">{EMAIL}</p>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <main>
      <Hero />
      <Stats />
      <Work />
      <Capabilities />
      <Compare />
      <Process />
      <Faq />
      <Cta />
    </main>
  );
}
