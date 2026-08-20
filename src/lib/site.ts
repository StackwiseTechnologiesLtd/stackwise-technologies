export const CALENDLY_URL =
  "https://calendly.com/stackwisetechnologies-info/30min";
export const EMAIL = "info@stackwisetechnologies.com";
export const TWITTER_URL = "https://x.com/StackwiseTech";
export const SITE_NAME = "Stackwise Technologies Limited";

export const navLinks = [
  { href: "#work", label: "Work" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#process", label: "Process" },
  { href: "#faq", label: "FAQ" },
] as const;

export const stats = [
  {
    kicker: "Delivery",
    value: "End-to-end",
    label: "From discovery to production, one team owns the outcome.",
  },
  {
    kicker: "Engineering",
    value: "Custom-built",
    label: "Platforms, APIs, and products — not a theme with a logo on it.",
  },
  {
    kicker: "Staffing",
    value: "Senior-led",
    label: "Engineers who ship, not a bench of unused hours.",
  },
  {
    kicker: "Model",
    value: "One partner",
    label: "We embed with your business. No bait-and-switch outsourcing.",
  },
] as const;

export const launcherItems = [
  "Custom software",
  "Dedicated engineering team",
  "AI agents & automation",
  "Cloud infrastructure",
  "Web & mobile products",
] as const;

export const workItems = [
  {
    title: "Custom software that fits the work",
    body: "Secure, scalable web platforms, internal systems, and enterprise apps designed around your actual workflows — not a generic CRM with extra fields.",
  },
  {
    title: "Dedicated teams, already in sync",
    body: "Extend your bench with engineers, designers, and AI specialists who join as part of the product, not a ticket queue on another continent.",
  },
  {
    title: "AI that finishes the job",
    body: "Assistants, workflow automation, and operational tooling that cut manual work. We wire models into the systems you already run.",
  },
  {
    title: "Cloud, APIs, and infrastructure",
    body: "Backends, REST and GraphQL APIs, and DevOps pipelines that stay up, scale with demand, and do not become a second product to maintain.",
  },
  {
    title: "Web and mobile products people use",
    body: "SaaS, dashboards, customer portals, and native-feeling mobile apps — modern stacks, clean interfaces, and performance that holds up.",
  },
  {
    title: "Data you can actually decide on",
    body: "Reporting dashboards, analytics platforms, and intelligence layers that turn operational data into something a team can act on this week.",
  },
  {
    title: "Design that ships with the code",
    body: "UI and UX sit in the same loop as engineering. Interfaces are designed to be built, not handed off as a graveyard of Figma frames.",
  },
  {
    title: "Technical consulting when you need a call",
    body: "Architecture reviews, build-vs-buy, and a clear execution plan — useful before you hire a team or after a codebase has grown teeth.",
  },
] as const;

export const capabilities = [
  { title: "Web platforms", detail: "SaaS, portals, dashboards" },
  { title: "Mobile apps", detail: "iOS, Android, and cross-platform" },
  { title: "AI assistants", detail: "Agents, RAG, and copilots" },
  { title: "Automation", detail: "Workflows that replace busywork" },
  { title: "REST & GraphQL", detail: "APIs that other systems trust" },
  { title: "Cloud architecture", detail: "AWS, GCP, and multi-region" },
  { title: "DevOps & CI", detail: "Pipelines, containers, Kubernetes" },
  { title: "Data platforms", detail: "Warehouses, ETL, and BI" },
  { title: "Internal tools", detail: "Ops systems your team lives in" },
  { title: "UI / UX", detail: "Product design with the build" },
  { title: "Security basics", detail: "Auth, secrets, and least privilege" },
  { title: "Observability", detail: "Logs, metrics, and alerting" },
  { title: "Next.js & React", detail: "The stack we ship on most" },
  { title: "Node, Python, Go", detail: "Backends that match the job" },
  { title: "Postgres & Redis", detail: "Data stores that stay fast" },
  { title: "Open source", detail: "Tools we use and give back" },
] as const;

export const compareRows = [
  {
    need: "Product engineering",
    scattered: "A design shop, then a dev shop",
    stackwise: "Included",
  },
  {
    need: "AI & automation",
    scattered: "A specialist on a side contract",
    stackwise: "Included",
  },
  {
    need: "Cloud & DevOps",
    scattered: "Whoever is left holding prod",
    stackwise: "Included",
  },
  {
    need: "Ongoing support",
    scattered: "A new retainer every quarter",
    stackwise: "Included",
  },
] as const;

export const processSteps = [
  {
    n: "01",
    title: "Discovery & strategy",
    body: "We map the business, the workflows, and the constraints. You leave with an architecture and a plan — not a slide that says “agile.”",
  },
  {
    n: "02",
    title: "Design & systems",
    body: "Interfaces and backends are designed together: performance, security, and the next two years of growth, not just the launch screenshot.",
  },
  {
    n: "03",
    title: "Build, test, ship",
    body: "Iterative delivery, automated tests, and a production path you can see. Feedback lands in the product, not in a status email.",
  },
  {
    n: "04",
    title: "Run & keep going",
    body: "We deploy, watch it, and keep improving as the business moves. The relationship does not end at the launch party.",
  },
] as const;

export const faqs = [
  {
    q: "What does Stackwise actually build?",
    a: "Custom software: web platforms, mobile apps, APIs, cloud infrastructure, and AI-powered automation. We are a technology partner, not a staffing board — we take problems from idea through production.",
  },
  {
    q: "How do you work with an existing team?",
    a: "We can own a product end-to-end or embed as a dedicated pod alongside your engineers. Either way you get a named team, a shared backlog, and the same quality bar we use on our own work.",
  },
  {
    q: "Where is the company based?",
    a: "We are an international engineering company with African roots, working with startups, SMEs, and enterprise teams worldwide. Collaboration is remote-first; timezone overlap is part of how we staff a project.",
  },
  {
    q: "Can we start with a small engagement?",
    a: "Yes. A discovery sprint or architecture review is a common first step. If it is a fit, we scale into a build. If it is not, you still leave with a clearer picture than you arrived with.",
  },
  {
    q: "Do you take over existing codebases?",
    a: "Often. We audit what you have, stabilize what is on fire, and then improve it in place — or plan a migration when the current stack is the bottleneck. We do not insist on a rewrite for its own sake.",
  },
  {
    q: "How do we get started?",
    a: "Book a 30-minute call or email info@stackwisetechnologies.com with what you are trying to ship. We will tell you quickly whether we are the right partner and what a first engagement would look like.",
  },
] as const;

export const stackPills = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Python",
  "Go",
  "PostgreSQL",
  "AWS",
] as const;
