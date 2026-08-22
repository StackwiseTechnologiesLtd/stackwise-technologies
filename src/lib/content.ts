export const CALENDLY_URL =
  "https://calendly.com/stackwisetechnologies-info/30min";
export const EMAIL = "info@stackwisetechnologies.com";
export const TWITTER_URL = "https://x.com/StackwiseTech";
export const SITE_NAME = "Stackwise Technologies Limited";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type FaqItem = {
  q: string;
  a: string;
  points?: string[];
};

export type SiteCopy = {
  meta: { title: string; description: string };
  nav: {
    links: { href: string; label: string }[];
    book: string;
    email: string;
    twitter: string;
    openMenu: string;
    closeMenu: string;
    language: string;
  };
  hero: {
    brand: string;
    headline: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    offer: string;
    requirement: string;
    installLabel: string;
    enterpriseBefore: string;
    enterpriseLink: string;
    searchPlaceholder: string;
    mockTitle: string;
    pinnedLabel: string;
    copyLabel: string;
    copiedLabel: string;
    callouts: { title: string; body: string }[];
  };
  features: {
    label: string;
    title: string;
    subtitle: string;
    featuredKicker: string;
    featuredValue: string;
    featuredHint: string;
    featuredBody: string;
    cards: { kicker: string; value: string; hint: string; body: string }[];
  };
  work: {
    label: string;
    title: string;
    subtitle: string;
    items: { title: string; body: string }[];
  };
  providers: {
    kicker: string;
    label: string;
    title: string;
    subtitle: string;
    aside: string;
    usage: string;
    note: string;
    tabs: { id: string; label: string }[];
    inventoryLabel: string;
    inventoryCount: string;
    inventory: { title: string; detail: string }[];
  };
  compare: {
    label: string;
    title: string;
    subtitle: string;
    scroll: string;
    columns: [string, string, string];
    rows: {
      feature: string;
      typical: string;
      stackwise: string;
    }[];
    footnote: string;
  };
  cost: {
    label: string;
    title: string;
    subtitle: string;
    scroll: string;
    columns: [string, string, string];
    rows: { need: string; scattered: string; stackwise: string }[];
    footnote: string;
  };
  architecture: {
    label: string;
    title: string;
    subtitle: string;
    pills: string[];
    steps: { n: string; title: string; body: string }[];
  };
  faq: {
    title: string;
    items: FaqItem[];
  };
  cta: {
    kicker: string;
    title: string;
    subtitle: string;
    offer: string;
    requirement: string;
    installLabel: string;
    enterpriseBefore: string;
    enterpriseLink: string;
  };
  footer: {
    tagline: string;
    work: string;
    faq: string;
    twitter: string;
  };
};

export const en: SiteCopy = {
  meta: {
    title: "Stackwise Technologies Limited",
    description:
      "Engineering scalable software for modern businesses. Custom platforms, AI systems, cloud infrastructure, and dedicated product teams.",
  },
  nav: {
    links: [
      { href: "#work", label: "See it work" },
      { href: "#features", label: "Features" },
      { href: "#compare", label: "Compare" },
      { href: "#faq", label: "FAQ" },
    ],
    book: "Call us",
    email: "Email us",
    twitter: "Follow Stackwise on X",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "English",
  },
  hero: {
    brand: "Stackwise Technologies",
    headline: "Engineering software at the speed of your business.",
    subtitle:
      "Custom platforms, AI systems, cloud infrastructure, dedicated teams, and the unglamorous work that keeps a company shipping — one engineering partner.",
    primaryCta: "Book a call",
    secondaryCta: "Email us",
    offer: "International team · African roots · Built for scale",
    requirement: "Remote-first · worldwide",
    installLabel: "Or reach us by email",
    enterpriseBefore: "Enterprise?",
    enterpriseLink: "Book a call with the team",
    searchPlaceholder: "Search apps, systems, and capabilities…",
    mockTitle: "stackwise — delivery",
    pinnedLabel: "Pinned",
    copyLabel: "Copy",
    copiedLabel: "Copied",
    callouts: [
      {
        title: "AI in the loop",
        body: "Assistants and automation wired into the systems you already run.",
      },
      {
        title: "Product + platform",
        body: "SaaS, portals, and APIs designed to ship together — not thrown over a wall.",
      },
      {
        title: "Cloud that stays up",
        body: "Pipelines, observability, and the boring reliability work after launch.",
      },
      {
        title: "A named team",
        body: "Senior engineers on a shared backlog — not a staffing board.",
      },
    ],
  },
  features: {
    label: "Feature set",
    title: "Built as a real product team.",
    subtitle:
      "Custom software, dedicated engineers, and AI systems — the tools you actually ship with, without the agency theatre.",
    featuredKicker: "Delivery model",
    featuredValue: "End-to-end",
    featuredHint: "idea → production",
    featuredBody:
      "One team owns discovery, design, build, and run. You are not coordinating four vendors to get a single product out the door.",
    cards: [
      {
        kicker: "Engineering",
        value: "Custom-built",
        hint: "No templates",
        body: "Platforms and APIs designed around your workflows — not a theme with a logo on it.",
      },
      {
        kicker: "Staffing",
        value: "Senior-led",
        hint: "Lean teams",
        body: "Engineers who ship, not a bench of unused hours billed as “capacity.”",
      },
      {
        kicker: "On the metal",
        value: "Full stack",
        hint: "Product + infra",
        body: "Web, mobile, APIs, cloud, and automation in the same delivery loop.",
      },
      {
        kicker: "Relationship",
        value: "100%",
        hint: "Partner",
        body: "We embed with your business. No bait-and-switch outsourcing.",
      },
    ],
  },
  work: {
    label: "In practice",
    title: "See what we actually ship.",
    subtitle:
      "Every one of these is work we do today. No waitlist, no slideware — product, platform, and the systems that keep a company moving.",
    items: [
      {
        title: "Your systems at a glance",
        body: "Dashboards, ops consoles, and internal tools that show what is actually running — not a graveyard of exported CSVs.",
      },
      {
        title: "Design it, then mark it up",
        body: "UI and UX sit in the same loop as engineering. Interfaces are designed to be built, annotated, and shipped.",
      },
      {
        title: "Switch products without the hunt",
        body: "Web apps, mobile, and portals that feel like one system. Users land where they meant to, without a training manual.",
      },
      {
        title: "A real product surface",
        body: "SaaS, customer portals, and admin — full products with history, search, and the unglamorous flows in between.",
      },
      {
        title: "Agents that finish the job",
        body: "AI assistants and automation that choose tools, work across your stack, and write the result where you asked.",
      },
      {
        title: "Run the stack from one team",
        body: "APIs, cloud, and DevOps pipelines that stay up. Shell-level work without hunting a separate vendor.",
      },
      {
        title: "Fix it where you work",
        body: "We improve what you already have in place — stabilize, refactor, or migrate when the current stack is the bottleneck.",
      },
      {
        title: "Reach us without a new process",
        body: "A named team, a shared backlog, and a 30-minute call to start. Bind us to the work, not to a 40-page SOW.",
      },
    ],
  },
  providers: {
    kicker: "Cloud · Product · On-device",
    label: "The stack",
    title: "Use the stack that fits the problem.",
    subtitle:
      "React and Next.js, Node, Python, Go, Postgres, AWS, and the AI providers your product actually needs.",
    aside:
      "Or keep it boring: proven tools, production defaults, no fashion projects.",
    usage:
      "The same team carries the stack across product, platform, AI, and cloud — not a specialist parachuted in for one sprint.",
    note: "We pick the language and cloud that match the job. Availability depends on your constraints, not our slide deck.",
    tabs: [
      { id: "product", label: "Product" },
      { id: "platform", label: "Platform" },
      { id: "ai", label: "AI" },
      { id: "cloud", label: "Cloud" },
    ],
    inventoryLabel: "Full inventory",
    inventoryCount: "24 capabilities",
    inventory: [
      { title: "Web platforms", detail: "SaaS, portals, dashboards" },
      { title: "Mobile apps", detail: "iOS, Android, cross-platform" },
      { title: "AI assistants", detail: "Agents, RAG, and copilots" },
      { title: "Automation", detail: "Workflows that replace busywork" },
      { title: "REST & GraphQL", detail: "APIs other systems trust" },
      { title: "Cloud architecture", detail: "AWS, GCP, multi-region" },
      { title: "DevOps & CI", detail: "Pipelines, containers, K8s" },
      { title: "Data platforms", detail: "Warehouses, ETL, and BI" },
      { title: "Internal tools", detail: "Ops systems your team lives in" },
      { title: "UI / UX", detail: "Product design with the build" },
      {
        title: "Auth & security",
        detail: "Identity, secrets, least privilege",
      },
      { title: "Observability", detail: "Logs, metrics, and alerting" },
      { title: "Next.js & React", detail: "The stack we ship on most" },
      { title: "Node, Python, Go", detail: "Backends that match the job" },
      { title: "Postgres & Redis", detail: "Data stores that stay fast" },
      { title: "Open source", detail: "Tools we use and give back" },
      { title: "Integrations", detail: "Payments, CRM, third-party APIs" },
      { title: "Search", detail: "From Postgres FTS to dedicated indexes" },
      { title: "Realtime", detail: "Sockets, jobs, and live views" },
      { title: "File & media", detail: "Uploads, image pipelines, CDN" },
      { title: "Billing", detail: "Subscriptions, invoicing, usage" },
      { title: "Admin consoles", detail: "The screens operators actually use" },
      { title: "Migrations", detail: "Move off the stack that is on fire" },
      {
        title: "Technical advising",
        detail: "Build vs buy, architecture reviews",
      },
    ],
  },
  compare: {
    label: "Side by side",
    title: "Stackwise vs a typical agency.",
    subtitle: "Same essentials. Fewer handoffs and less overhead.",
    scroll: "Scroll to compare →",
    columns: ["Feature", "Typical agency", "Stackwise"],
    rows: [
      {
        feature: "Custom software",
        typical: "Often a theme",
        stackwise: "Built for the work",
      },
      {
        feature: "Dedicated team",
        typical: "Staffing board",
        stackwise: "Named pod",
      },
      {
        feature: "AI & automation",
        typical: "A side contract",
        stackwise: "In the same loop",
      },
      {
        feature: "Cloud & DevOps",
        typical: "Whoever holds prod",
        stackwise: "Included",
      },
      {
        feature: "Design with engineering",
        typical: "Thrown over the wall",
        stackwise: "Same sprint",
      },
      {
        feature: "Ongoing support",
        typical: "New retainer",
        stackwise: "Included",
      },
      {
        feature: "Architecture you keep",
        typical: "Black box",
        stackwise: "Yours",
      },
      {
        feature: "Rewrite pressure",
        typical: "Common",
        stackwise: "Only if needed",
      },
      {
        feature: "Built with",
        typical: "Whatever is free",
        stackwise: "Next.js, Node, Python, Go",
      },
      {
        feature: "Engagement",
        typical: "SOW theatre",
        stackwise: "Partner",
      },
    ],
    footnote:
      "Comparisons are against the default freelance-and-agency mix we replace. Your mileage depends on the team you already have.",
  },
  cost: {
    label: "Cost comparison",
    title: "Four vendors. One partner.",
    subtitle: "Replace three retainers and another one-off build.",
    scroll: "Scroll to compare →",
    columns: ["What you need", "Piecing it together", "Stackwise"],
    rows: [
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
    ],
    footnote:
      "You still pay for the work. You stop paying to coordinate four companies that do not share a backlog.",
  },
  architecture: {
    label: "Architecture",
    title: "Not a factory wearing a product coat.",
    subtitle:
      "Discovery, systems, and delivery in one loop — with the people who will still be here after launch.",
    pills: ["Next.js", "TypeScript", "Node", "Python", "Go", "Postgres", "AWS"],
    steps: [
      {
        n: "01",
        title: "Discovery first",
        body: "We map the business, the workflows, and the constraints. You leave with an architecture and a plan — not a slide that says “agile.”",
      },
      {
        n: "02",
        title: "Systems with the UI",
        body: "Interfaces and backends are designed together: performance, security, and the next two years of growth, not just the launch screenshot.",
      },
      {
        n: "03",
        title: "Ship and keep going",
        body: "Iterative delivery, tests, production, and the unglamorous work of keeping it running as the business moves.",
      },
    ],
  },
  faq: {
    title: "FAQ",
    items: [
      {
        q: "What does Stackwise actually build?",
        a: "Custom software, end to end. Typical first engagements include:",
        points: [
          "Web platforms, SaaS, and customer portals",
          "Mobile apps and internal ops tools",
          "APIs, cloud infrastructure, and DevOps",
          "AI assistants, automation, and data dashboards",
          "Taking over an existing codebase that is on fire",
        ],
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
    ],
  },
  cta: {
    kicker: "Ready when you are",
    title: "Let’s build with Stackwise.",
    subtitle:
      "The engineering partner for people who live in products, pipelines, and production.",
    offer: "International team · African roots · Built for scale",
    requirement: "Remote-first · worldwide",
    installLabel: "Or reach us by email",
    enterpriseBefore: "Enterprise?",
    enterpriseLink: "Book a call with the team",
  },
  footer: {
    tagline: "Stackwise Technologies Ltd ",
    work: "Work",
    faq: "FAQ",
    twitter: "X",
  },
};

export const fr: SiteCopy = {
  meta: {
    title: "Stackwise Technologies Limited",
    description:
      "Des logiciels évolutifs pour les entreprises modernes. Plateformes sur mesure, systèmes d’IA, infrastructure cloud et équipes produit dédiées.",
  },
  nav: {
    links: [
      { href: "#work", label: "Voir en action" },
      { href: "#features", label: "Fonctionnalités" },
      { href: "#compare", label: "Comparer" },
      { href: "#faq", label: "FAQ" },
    ],
    book: "Appelez-nous",
    email: "Nous écrire",
    twitter: "Suivre Stackwise sur X",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    language: "Français",
  },
  hero: {
    brand: "Stackwise Technologies",
    headline: "Des logiciels à la vitesse de votre métier.",
    subtitle:
      "Plateformes sur mesure, systèmes d’IA, infrastructure cloud, équipes dédiées et le travail peu glamour qui fait livrer une entreprise — un seul partenaire ingénierie.",
    primaryCta: "Réserver un appel",
    secondaryCta: "Nous écrire",
    offer: "Équipe internationale · Racines africaines · Pensé pour evoluer",
    requirement: "Remote-first · mondial",
    installLabel: "Ou contactez-nous par e-mail",
    enterpriseBefore: "Pour votre entreprise ?",
    enterpriseLink: "Réserver un appel avec l’équipe",
    searchPlaceholder: "Rechercher apps, systèmes et capacités…",
    mockTitle: "stackwise — livraison",
    pinnedLabel: "Épinglé",
    copyLabel: "Copier",
    copiedLabel: "Copié",
    callouts: [
      {
        title: "IA dans la boucle",
        body: "Assistants et automatisation branchés sur les systèmes que vous avez déjà.",
      },
      {
        title: "Produit + plateforme",
        body: "SaaS, portails et API conçus pour livrer ensemble — pas jetés par-dessus le mur.",
      },
      {
        title: "Un cloud qui tient",
        body: "Pipelines, observabilité et le travail de fiabilité après le lancement.",
      },
      {
        title: "Une équipe nommée",
        body: "Des seniors sur un backlog partagé — pas un tableau de staffing.",
      },
    ],
  },
  features: {
    label: "Ensemble de fonctionnalités",
    title: "Construits comme une vraie équipe produit.",
    subtitle:
      "Logiciels sur mesure, ingénieurs dédiés et systèmes d’IA — les outils avec lesquels vous livrez vraiment, sans le théâtre d’agence.",
    featuredKicker: "Modèle de livraison",
    featuredValue: "De bout en bout",
    featuredHint: "idée → production",
    featuredBody:
      "Une seule équipe porte la découverte, le design, la construction et l’exploitation. Vous ne coordonnez pas quatre prestataires pour sortir un produit.",
    cards: [
      {
        kicker: "Ingénierie",
        value: "Sur mesure",
        hint: "Sans templates",
        body: "Plateformes et API conçues autour de vos flux — pas un thème avec un logo dessus.",
      },
      {
        kicker: "Équipe",
        value: "Pilotée par des seniors",
        hint: "Équipes lean",
        body: "Des ingénieurs qui livrent, pas un banc d’heures inutilisées facturées comme « capacité ».",
      },
      {
        kicker: "Sur le métal",
        value: "Full stack",
        hint: "Produit + infra",
        body: "Web, mobile, API, cloud et automatisation dans la même boucle de livraison.",
      },
      {
        kicker: "Relation",
        value: "100 %",
        hint: "Partenaire",
        body: "Nous nous intégrons à votre métier. Pas d’externalisation bâton-et-carotte.",
      },
    ],
  },
  work: {
    label: "En pratique",
    title: "Découvrez ce que nous livrons vraiment.",
    subtitle:
      "Chacun de ces sujets est du travail que nous faisons aujourd’hui. Pas de liste d’attente, pas de slides — produit, plateforme et les systèmes qui font avancer une entreprise.",
    items: [
      {
        title: "Vos systèmes en un coup d’œil",
        body: "Tableaux de bord, consoles d’ops et outils internes qui montrent ce qui tourne vraiment — pas un cimetière de CSV exportés.",
      },
      {
        title: "Concevoir, puis annoter",
        body: "UI et UX dans la même boucle que l’ingénierie. Les interfaces sont conçues pour être construites, annotées et livrées.",
      },
      {
        title: "Changer de produit sans chercher",
        body: "Apps web, mobile et portails qui se sentent comme un seul système. Les utilisateurs arrivent où ils voulaient, sans manuel de formation.",
      },
      {
        title: "Une vraie surface produit",
        body: "SaaS, portails clients et admin — des produits complets avec historique, recherche et les flux peu glamour entre les deux.",
      },
      {
        title: "Des agents qui vont au bout",
        body: "Assistants IA et automatisation qui choisissent des outils, travaillent dans votre stack et déposent le résultat où vous l’avez demandé.",
      },
      {
        title: "Faire tourner la stack avec une équipe",
        body: "API, cloud et pipelines DevOps qui tiennent. Du travail au niveau shell sans chasser un autre prestataire.",
      },
      {
        title: "Corriger là où vous travaillez",
        body: "Nous améliorons ce que vous avez déjà — stabiliser, refactorer ou migrer quand la stack actuelle est le goulot.",
      },
      {
        title: "Nous joindre sans nouveau process",
        body: "Une équipe nommée, un backlog partagé, et un appel de 30 minutes pour commencer. Liez-nous au travail, pas à un SOW de 40 pages.",
      },
    ],
  },
  providers: {
    kicker: "Cloud · Produit · Sur l’appareil",
    label: "La stack",
    title: "Utilisez la stack adaptée au problème.",
    subtitle:
      "React et Next.js, Node, Python, Go, Postgres, AWS, et les fournisseurs d’IA dont votre produit a vraiment besoin.",
    aside:
      "Ou restez raisonnables : outils éprouvés, défauts de production, pas de projets de mode.",
    usage:
      "La même équipe porte la stack sur le produit, la plateforme, l’IA et le cloud — pas un spécialiste parachuté pour un sprint.",
    note: "Nous choisissons le langage et le cloud qui correspondent au travail. La disponibilité dépend de vos contraintes, pas de notre slide deck.",
    tabs: [
      { id: "product", label: "Produit" },
      { id: "platform", label: "Plateforme" },
      { id: "ai", label: "IA" },
      { id: "cloud", label: "Cloud" },
    ],
    inventoryLabel: "Inventaire complet",
    inventoryCount: "24 capacités",
    inventory: [
      { title: "Plateformes web", detail: "SaaS, portails, tableaux de bord" },
      { title: "Apps mobiles", detail: "iOS, Android, cross-platform" },
      { title: "Assistants IA", detail: "Agents, RAG et copilotes" },
      {
        title: "Automatisation",
        detail: "Des flux qui remplacent le busywork",
      },
      {
        title: "REST & GraphQL",
        detail: "Des API auxquelles on fait confiance",
      },
      { title: "Architecture cloud", detail: "AWS, GCP, multi-région" },
      { title: "DevOps & CI", detail: "Pipelines, conteneurs, K8s" },
      { title: "Plateformes data", detail: "Entrepôts, ETL et BI" },
      { title: "Outils internes", detail: "Les systèmes où vit votre équipe" },
      { title: "UI / UX", detail: "Design produit avec le build" },
      {
        title: "Auth & sécurité",
        detail: "Identité, secrets, moindre privilège",
      },
      { title: "Observabilité", detail: "Logs, métriques et alertes" },
      { title: "Next.js & React", detail: "La stack que nous livrons le plus" },
      { title: "Node, Python, Go", detail: "Des backends adaptés au job" },
      { title: "Postgres & Redis", detail: "Des stores qui restent rapides" },
      {
        title: "Open source",
        detail: "Des outils que nous utilisons et rendons",
      },
      { title: "Intégrations", detail: "Paiements, CRM, API tierces" },
      { title: "Recherche", detail: "De Postgres FTS aux index dédiés" },
      { title: "Temps réel", detail: "Sockets, jobs et vues live" },
      { title: "Fichiers & médias", detail: "Uploads, pipelines image, CDN" },
      { title: "Facturation", detail: "Abonnements, factures, usage" },
      {
        title: "Consoles admin",
        detail: "Les écrans que les ops utilisent vraiment",
      },
      { title: "Migrations", detail: "Quitter la stack qui brûle" },
      {
        title: "Conseil technique",
        detail: "Build vs buy, revues d’architecture",
      },
    ],
  },
  compare: {
    label: "Côte à côte",
    title: "Stackwise face à une agence typique.",
    subtitle: "Les mêmes essentiels. Moins de handoffs et de surcharge.",
    scroll: "Faire défiler pour comparer →",
    columns: ["Fonctionnalité", "Agence typique", "Stackwise"],
    rows: [
      {
        feature: "Logiciel sur mesure",
        typical: "Souvent un thème",
        stackwise: "Conçu pour le travail",
      },
      {
        feature: "Équipe dédiée",
        typical: "Tableau de staffing",
        stackwise: "Pod nommé",
      },
      {
        feature: "IA & automatisation",
        typical: "Un contrat à part",
        stackwise: "Dans la même boucle",
      },
      {
        feature: "Cloud & DevOps",
        typical: "Qui tient la prod",
        stackwise: "Inclus",
      },
      {
        feature: "Design avec l’ingénierie",
        typical: "Jeté par-dessus le mur",
        stackwise: "Même sprint",
      },
      {
        feature: "Support continu",
        typical: "Nouveau retainer",
        stackwise: "Inclus",
      },
      {
        feature: "Architecture que vous gardez",
        typical: "Boîte noire",
        stackwise: "La vôtre",
      },
      {
        feature: "Pression de rewrite",
        typical: "Fréquente",
        stackwise: "Seulement si besoin",
      },
      {
        feature: "Construit avec",
        typical: "Ce qui est gratuit",
        stackwise: "Next.js, Node, Python, Go",
      },
      {
        feature: "Engagement",
        typical: "Théâtre de SOW",
        stackwise: "Partenaire",
      },
    ],
    footnote:
      "Les comparaisons portent sur le mélange freelance-et-agence que nous remplaçons. Votre résultat dépend de l’équipe que vous avez déjà.",
  },
  cost: {
    label: "Comparaison des coûts",
    title: "Quatre prestataires. Un partenaire.",
    subtitle: "Remplacez trois retainers et un autre build ponctuel.",
    scroll: "Faire défiler pour comparer →",
    columns: ["Ce dont vous avez besoin", "En le bricolant", "Stackwise"],
    rows: [
      {
        need: "Ingénierie produit",
        scattered: "Une agence design, puis une agence dev",
        stackwise: "Inclus",
      },
      {
        need: "IA & automatisation",
        scattered: "Un spécialiste en contrat parallèle",
        stackwise: "Inclus",
      },
      {
        need: "Cloud & DevOps",
        scattered: "Celui qui reste avec la prod",
        stackwise: "Inclus",
      },
      {
        need: "Support continu",
        scattered: "Un nouveau retainer chaque trimestre",
        stackwise: "Inclus",
      },
    ],
    footnote:
      "Vous payez toujours le travail. Vous arrêtez de payer pour coordonner quatre sociétés qui ne partagent pas un backlog.",
  },
  architecture: {
    label: "Architecture",
    title: "Pas une usine déguisée en produit.",
    subtitle:
      "Découverte, systèmes et livraison dans une seule boucle — avec les gens qui seront encore là après le lancement.",
    pills: ["Next.js", "TypeScript", "Node", "Python", "Go", "Postgres", "AWS"],
    steps: [
      {
        n: "01",
        title: "La découverte d’abord",
        body: "Nous cartographions le métier, les flux et les contraintes. Vous repartez avec une architecture et un plan — pas une slide qui dit « agile ».",
      },
      {
        n: "02",
        title: "Les systèmes avec l’UI",
        body: "Interfaces et backends conçus ensemble : performance, sécurité et les deux prochaines années de croissance, pas seulement la capture du lancement.",
      },
      {
        n: "03",
        title: "Livrer et continuer",
        body: "Livraison itérative, tests, production, et le travail peu glamour de le faire tenir pendant que le métier avance.",
      },
    ],
  },
  faq: {
    title: "FAQ",
    items: [
      {
        q: "Que construit réellement Stackwise ?",
        a: "Du logiciel sur mesure, de bout en bout. Les premiers engagements typiques incluent :",
        points: [
          "Plateformes web, SaaS et portails clients",
          "Apps mobiles et outils d’ops internes",
          "API, infrastructure cloud et DevOps",
          "Assistants IA, automatisation et tableaux de bord data",
          "Reprendre une codebase existante qui brûle",
        ],
      },
      {
        q: "Comment travaillez-vous avec une équipe existante ?",
        a: "Nous pouvons porter un produit de bout en bout ou nous intégrer comme un pod dédié aux côtés de vos ingénieurs. Dans les deux cas, vous avez une équipe nommée, un backlog partagé et le même niveau d’exigence que sur notre propre travail.",
      },
      {
        q: "Où est basée l’entreprise ?",
        a: "Nous sommes une entreprise d’ingénierie internationale aux racines africaines, qui travaille avec des startups, PME et équipes enterprise dans le monde entier. La collaboration est remote-first ; le chevauchement des fuseaux fait partie de la façon dont nous staffons un projet.",
      },
      {
        q: "Peut-on commencer par un petit engagement ?",
        a: "Oui. Un sprint de découverte ou une revue d’architecture est un premier pas courant. Si c’est un fit, nous passons au build. Sinon, vous repartez quand même avec une vision plus claire qu’à l’arrivée.",
      },
      {
        q: "Reprenez-vous des codebases existantes ?",
        a: "Souvent. Nous auditons ce que vous avez, stabilisons ce qui brûle, puis améliorons sur place — ou planifions une migration quand la stack actuelle est le goulot. Nous n’insistons pas sur un rewrite pour le plaisir.",
      },
      {
        q: "Comment démarrer ?",
        a: "Réservez un appel de 30 minutes ou écrivez à info@stackwisetechnologies.com avec ce que vous voulez livrer. Nous vous dirons rapidement si nous sommes le bon partenaire et à quoi ressemblerait un premier engagement.",
      },
    ],
  },
  cta: {
    kicker: "Quand vous êtes prêts",
    title: "Lancez vous avec Stackwise.",
    subtitle:
      "Le partenaire en ingénierie pour le developement de produits. Nous travaillons avec ceux qui gères les produits, les pipelines et la production.",
    offer: "Équipe internationale · Racines africaines · Pensé pour evoluer",
    requirement: "Remote-first · mondial",
    installLabel: "Ou contactez-nous par e-mail",
    enterpriseBefore: "Pour votre entreprise ?",
    enterpriseLink: "Réserver un appel avec l’équipe",
  },
  footer: {
    tagline: "Stackwise Technologies Ltd ",
    work: "Travail",
    faq: "FAQ",
    twitter: "X",
  },
};

export const catalogs: Record<Locale, SiteCopy> = { en, fr };

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getCopy(locale: Locale): SiteCopy {
  return catalogs[locale];
}

export function launcherItemsFor(locale: Locale): string[] {
  return getCopy(locale)
    .work.items.slice(0, 5)
    .map((item) => item.title);
}
