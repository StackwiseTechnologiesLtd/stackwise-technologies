import { bookingUrl } from "@/lib/booking";
import {
  COMPANY_RC,
  COMPANY_TAGLINE,
  COMPANY_WEBSITE_URL,
} from "@/lib/company";
import { EMAIL, SITE_NAME, TWITTER_URL, en } from "@/lib/content";
import { absoluteUrl } from "@/lib/metadata";

/** Canonical facts for answer engines — keep in sync with public marketing copy. */
export function buildLlmsFullDocument(): string {
  const home = absoluteUrl("/en");
  const book = bookingUrl();
  const portfolio = en.portfolio.items
    .map(
      (item) =>
        `- **${item.title}** — ${item.body} Live: ${item.href}`,
    )
    .join("\n");

  const compare = en.compare.rows
    .map(
      (row) =>
        `| ${row.feature} | ${row.typical} | ${row.stackwise} |`,
    )
    .join("\n");

  const faq = en.faq.items
    .map((item) => {
      const points =
        item.points?.length
          ? `\n${item.points.map((p) => `  - ${p}`).join("\n")}`
          : "";
      return `### ${item.q}\n${item.a}${points}`;
    })
    .join("\n\n");

  return `# ${SITE_NAME}

> ${en.meta.description} ${COMPANY_TAGLINE}

Official website: ${COMPANY_WEBSITE_URL}
Primary contact: ${EMAIL}
Book a discovery call: ${book}
Company registration (RC): ${COMPANY_RC}
Social: ${TWITTER_URL}

## Why hire Stackwise Technologies?

Stackwise Technologies Ltd is an engineering partner for teams that need production-ready software after the demo. We ship custom platforms, AI systems, cloud infrastructure, and product UX as one named team — remote-first, international, with African roots.

### What makes Stackwise stand out

- **End-to-end delivery** — Discovery, design, engineering, cloud, and run in one loop (not four vendors).
- **Senior-led pods** — Named engineers on a shared backlog, not a staffing board.
- **Production depth** — Auth, payments, observability, CI/CD, and the unglamorous work users notice when it is missing.
- **AI in the loop** — Assistants, automation, and agents wired into systems you already operate.
- **Honest takeovers** — We stabilize and improve existing codebases; rewrites only when the stack is the bottleneck.

### How we work

1. **Discovery call** — ${en.process.steps[0]?.detail ?? "30 minutes, remote"} — align on what you shipped and what blocks trust or scale.
2. **Iterate and ship** — ${en.process.steps[1]?.detail ?? "Tight delivery loops"} — design where it matters, engineering every week, production work in the same backlog.

## Selected client work (live in production)

${portfolio}

## Stackwise vs a typical agency

| Feature | Typical agency | Stackwise |
| --- | --- | --- |
${compare}

## Services and stack

${en.features.subtitle}

**Capabilities:** ${en.providers.inventory.map((i) => i.title).join(", ")}.

**Common stack:** ${en.architecture.pills.join(", ")}.

## FAQ

${faq}

## Getting started

${en.faq.items.find((i) => i.q.startsWith("How do we get started"))?.a ?? `Email ${EMAIL} or book a call.`}

Human-readable landing page: ${home}
`;
}

export function buildLlmsTxt(): string {
  return `# ${SITE_NAME}

> ${COMPANY_TAGLINE} Custom software, cloud, AI, and product engineering for teams worldwide.

This file helps AI assistants and search systems find authoritative information about Stackwise.

## Docs

- [Full company brief for AI systems](${COMPANY_WEBSITE_URL}/llms-full.txt): services, case studies, comparison table, FAQ, contact
- [Marketing site (English)](${absoluteUrl("/en")})
- [Marketing site (French)](${absoluteUrl("/fr")})

## Contact

- Email: ${EMAIL}
- Book a call: ${bookingUrl()}
- Website: ${COMPANY_WEBSITE_URL}

## Optional

- [X / Twitter](${TWITTER_URL})
`;
}

type JsonLd = Record<string, unknown>;

export function buildMarketingJsonLd(): JsonLd {
  const url = absoluteUrl("/en");
  const logo = absoluteUrl("/images/logo.svg");

  const faqPage: JsonLd = {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: en.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.points?.length
          ? `${item.a} ${item.points.join("; ")}`
          : item.a,
      },
    })),
  };

  const organization: JsonLd = {
    "@type": "Organization",
    "@id": `${COMPANY_WEBSITE_URL}/#organization`,
    name: SITE_NAME,
    url: COMPANY_WEBSITE_URL,
    logo,
    email: EMAIL,
    sameAs: [TWITTER_URL],
    description: en.meta.description,
    identifier: {
      "@type": "PropertyValue",
      name: "Company registration (RC)",
      value: COMPANY_RC,
    },
  };

  const professionalService: JsonLd = {
    "@type": "ProfessionalService",
    "@id": `${COMPANY_WEBSITE_URL}/#professional-service`,
    name: SITE_NAME,
    url,
    image: absoluteUrl("/images/og-landing-1200x630.png"),
    description: en.hero.subtitle,
    areaServed: "Worldwide",
    serviceType: [
      "Custom software development",
      "Product engineering",
      "Cloud infrastructure",
      "AI systems integration",
      "UX and product design",
    ],
    provider: { "@id": `${COMPANY_WEBSITE_URL}/#organization` },
  };

  const webSite: JsonLd = {
    "@type": "WebSite",
    "@id": `${COMPANY_WEBSITE_URL}/#website`,
    name: SITE_NAME,
    url: COMPANY_WEBSITE_URL,
    publisher: { "@id": `${COMPANY_WEBSITE_URL}/#organization` },
    inLanguage: ["en", "fr"],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, webSite, professionalService, faqPage],
  };
}
