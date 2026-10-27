import type { BrandGuidelines } from "../types";

const img = (baseName: string, alt: string) => ({ baseName, alt });

export const aetheriBrand: BrandGuidelines = {
  slug: "aetheri",
  name: "Aetheri Medical",
  heroTitle: "Aetheri Medical Guidelines",
  heroSubtitle: "Smarter healthcare across clinics.",
  metaTitle: "Aetheri Medical — Stackwise Technologies",
  metaDescription:
    "The visual identity, typography and tone of voice of Aetheri Medical.",
  footerCredit:
    "Live brand system developed by Stackwise Technologies for remarkable clients.",
  theme: {
    stylesheet: "brand-fonts.css",
    displayFontVar: "--font-aetheri-jomhuria",
    uiFontVar: "--font-aetheri-inter",
    typographyExportDisplayName: "Jomhuria",
    typographyExportUiName: "Inter",
  },
  nav: [
    { id: "foundation", label: "Foundation", href: "#foundation" },
    { id: "marks", label: "Marks", href: "#marks" },
    { id: "color-palette", label: "Color palette", href: "#color-palette" },
    { id: "typography", label: "Typography", href: "#typography" },
    { id: "tone-of-voice", label: "Tone of voice", href: "#tone-of-voice" },
    { id: "applications", label: "Applications", href: "#applications" },
    { id: "exports", label: "Exports", href: "#exports" },
  ],
  scrollSpy: [
    { navId: "foundation", sectionIds: ["foundation", "brand-context"] },
    { navId: "marks", sectionIds: ["marks", "mark-colors"] },
    {
      navId: "color-palette",
      sectionIds: ["color-palette", "color-proportions", "color-accessibility"],
    },
    { navId: "typography", sectionIds: ["typography", "type-scale"] },
    { navId: "tone-of-voice", sectionIds: ["tone-of-voice"] },
    {
      navId: "applications",
      sectionIds: [
        "applications",
        "campaign-applications",
        "stationery",
        "recognition",
      ],
    },
    { navId: "exports", sectionIds: ["exports"] },
  ],
  introduction: {
    title: "Introduction",
    body:
      "Aetheri Medical is a healthcare management system for clinics that need schedules, tasks and handoffs in one place. The symbol pairs a centred circle with mirrored wings in Aether and Vital blue-green, suggesting balanced coverage across sites and teams. Jomhuria gives the name a tall, confident presence; Inter carries the interface, forms and long-form guidance. Aether and Vital lead the palette, with Mist, White and Black for fields, contrast and print.",
    heroImage: img(
      "aetheri-introduction",
      "Aetheri Medical lockup on a light clinical field",
    ),
  },
  marks: {
    logotypeScale: {
      title: "Logotype scale",
      body:
        "Use the icon with “Aetheri Medical” as the primary lockup. Keep the gap between symbol and wordmark consistent at every size. For campaign lines such as “Smarter healthcare across clinics”, use the extended lockup only where space allows. When the name would crowd the layout, use the isotype alone and preserve clear space around the wings.",
      sizes: [72, 60, 48, 38, 30, 24, 18],
      heroImage: img(
        "aetheri-introduction",
        "Aetheri Medical lockup on a light clinical field",
      ),
    },
    colorVersions: {
      title: "Color versions",
      blackOnLight:
        "Use the Aether lockup on White, Mist and other light backgrounds. This is the default for product UI, stationery and light photography.",
      whiteOnDark:
        "Use the White lockup on Aether, Vital, Black and photography with deep tones. Keep the lockup in a single colour so the symbol and name read as one unit.",
      blackLogotype: "exports/logotype/aetheri-logotype-aether.svg",
      whiteLogotype: "exports/logotype/aetheri-logotype-white.svg",
    },
  },
  colors: {
    palette: {
      title: "Core palette",
      body:
        "Aether is the primary brand colour for the mark, links and key actions. Vital adds a secondary accent for success states and highlights in the wings. Mist opens space for backgrounds and tables. White and Black support contrast, type and practical reproduction.",
      swatches: [
        {
          name: "Aether",
          hex: "#167AEA",
          rgb: "22, 122, 234",
          cmyk: "91, 48, 0, 8",
        },
        {
          name: "Vital",
          hex: "#53D5B9",
          rgb: "83, 213, 185",
          cmyk: "61, 0, 35, 0",
        },
        {
          name: "Mist",
          hex: "#E8F3FE",
          rgb: "232, 243, 254",
          cmyk: "9, 4, 0, 0",
        },
        {
          name: "White",
          hex: "#FFFFFF",
          rgb: "255, 255, 255",
          cmyk: "0, 0, 0, 0",
        },
        {
          name: "Black",
          hex: "#000000",
          rgb: "0, 0, 0",
          cmyk: "0, 0, 0, 100",
        },
      ],
    },
    proportions: {
      title: "Color proportions",
      body:
        "Lead with Aether across product chrome and campaign fields. Mist and White should carry most reading surfaces. Use Vital for emphasis, not large fields. Reserve Black for type, icons and fine detail.",
      bars: [
        { name: "Aether", value: 40 },
        { name: "Mist", value: 25 },
        { name: "White", value: 20 },
        { name: "Vital", value: 10 },
        { name: "Black", value: 5 },
      ],
    },
    accessibility: {
      title: "Readable combinations",
      rows: [
        {
          foreground: "#000000",
          background: "#FFFFFF",
          foregroundName: "Black",
          backgroundName: "White",
          ratio: "21.0",
          level: "AAA",
        },
        {
          foreground: "#000000",
          background: "#E8F3FE",
          foregroundName: "Black",
          backgroundName: "Mist",
          ratio: "18.2",
          level: "AAA",
        },
        {
          foreground: "#FFFFFF",
          background: "#167AEA",
          foregroundName: "White",
          backgroundName: "Aether",
          ratio: "4.6",
          level: "AA",
        },
        {
          foreground: "#167AEA",
          background: "#FFFFFF",
          foregroundName: "Aether",
          backgroundName: "White",
          ratio: "4.6",
          level: "AA",
        },
        {
          foreground: "#FFFFFF",
          background: "#000000",
          foregroundName: "White",
          backgroundName: "Black",
          ratio: "21.0",
          level: "AAA",
        },
        {
          foreground: "#53D5B9",
          background: "#FFFFFF",
          foregroundName: "Vital",
          backgroundName: "White",
          ratio: "1.6",
          level: "Fail",
        },
        {
          foreground: "#FFFFFF",
          background: "#53D5B9",
          foregroundName: "White",
          backgroundName: "Vital",
          ratio: "1.6",
          level: "Fail",
        },
      ],
    },
  },
  typography: {
    typeSystem: {
      title: "Type system",
      exposure:
        "Jomhuria carries the Aetheri name and short headlines. Its height draws the eye without shouting; use it for hero lines and campaign statements, not dense clinical tables.",
      geist:
        "Inter is the working typeface for navigation, forms, schedules and body copy. Regular supports sustained reading; Medium marks labels, names and decisions. Keep line lengths comfortable and align related data in columns.",
      fontDownloadLabel: "Jomhuria",
      fontDownloadPath: "preview-fonts/Jomhuria-Regular.ttf",
      displayPreviewLink: "https://fonts.google.com/specimen/Jomhuria",
      uiPreviewLink: "https://fonts.google.com/specimen/Inter",
      displayPreviewPlaceholder: "Jomhuria: Care, coordinated.",
      uiPreviewPlaceholder: "Inter: Every handoff has a name.",
    },
    typeScale: {
      title: "Type scale",
      intro:
        "A clear step from display to caption keeps clinic staff oriented: one voice for statements, another for the work itself.",
      baseDefault: 15,
      ratioDefault: 1.25,
      rows: [
        {
          level: "Display",
          meta: "Jomhuria · 400 · 56px · 3.5rem",
          sample: "Smarter healthcare across clinics.",
          sampleStyle: {
            "--sample-font-family": "var(--font-aetheri-jomhuria)",
            "--sample-font-size": "56px",
            "--sample-font-weight": "400",
            "--sample-line-height": "1.1",
          },
        },
        {
          level: "Heading 1",
          meta: "Inter · 600 · 32px · 2rem",
          sample: "Today’s appointments and open tasks",
          sampleStyle: {
            "--sample-font-family": "var(--font-aetheri-inter)",
            "--sample-font-size": "32px",
            "--sample-font-weight": "600",
            "--sample-line-height": "1.25",
          },
        },
        {
          level: "Heading 2",
          meta: "Inter · 600 · 24px · 1.5rem",
          sample: "Handoffs between sites stay visible",
          sampleStyle: {
            "--sample-font-family": "var(--font-aetheri-inter)",
            "--sample-font-size": "24px",
            "--sample-font-weight": "600",
            "--sample-line-height": "1.3",
          },
        },
        {
          level: "Heading 3",
          meta: "Inter · 500 · 18px · 1.125rem",
          sample: "Assign owner before end of shift",
          sampleStyle: {
            "--sample-font-family": "var(--font-aetheri-inter)",
            "--sample-font-size": "18px",
            "--sample-font-weight": "500",
            "--sample-line-height": "1.35",
          },
        },
        {
          level: "Body",
          meta: "Inter · 400 · 15px · 0.938rem",
          sample:
            "Clinic leads see which rooms are booked, which tasks are overdue and who last updated each record, without opening three different tools.",
          sampleStyle: {
            "--sample-font-family": "var(--font-aetheri-inter)",
            "--sample-font-size": "15px",
            "--sample-font-weight": "400",
            "--sample-line-height": "1.55",
          },
        },
        {
          level: "Caption",
          meta: "Inter · 400 · 12px · 0.75rem",
          sample: "Updated 4 minutes ago by the front desk.",
          sampleStyle: {
            "--sample-font-family": "var(--font-aetheri-inter)",
            "--sample-font-size": "12px",
            "--sample-font-weight": "400",
            "--sample-line-height": "1.45",
          },
        },
      ],
    },
  },
  tone: {
    title: "Tone of voice",
    intro:
      "Aetheri sounds like a calm colleague on a busy ward: plain language, named actions and no hype. Staff should know what changed, who owns the next step and whether they need to respond.",
    messages: [
      { label: "Signature", text: "Care, coordinated." },
      { label: "Short headline", text: "Smarter healthcare across clinics." },
      {
        label: "Headline",
        text: "One place for schedules, tasks and handoffs.",
      },
      {
        label: "Brand statement",
        text:
          "Aetheri keeps clinic operations visible so teams spend less time chasing updates.",
      },
      {
        label: "Introduction",
        text:
          "From multi-site schedules to task ownership and handoffs, Aetheri gives clinic leads a single view of what is booked, what is late and who last touched each record.",
      },
    ],
    principles: [
      {
        title: "Name the action",
        description: "Say what happened and what to do next.",
        pairs: [
          {
            say: "Dr. Okonkwo’s slot moved to 14:30.",
            avoid: "Schedule optimisation completed.",
          },
          {
            say: "Assign a nurse to room 4 before 09:00.",
            avoid: "Please action the workflow.",
          },
          {
            say: "The lab results are ready to review.",
            avoid: "Exciting new insights await.",
          },
        ],
      },
      {
        title: "Respect the shift",
        description: "Short sentences; lead with the fact that matters now.",
        pairs: [
          {
            say: "Two tasks are overdue at Main Street.",
            avoid: "We are driving operational excellence.",
          },
          {
            say: "No open handoffs for your site.",
            avoid: "All systems are go.",
          },
          {
            say: "Call the patient before closing the ticket.",
            avoid: "Leverage proactive outreach.",
          },
        ],
      },
      {
        title: "Stay accountable",
        description: "Show who updated a record and when.",
        pairs: [
          {
            say: "Updated by Priya at 08:12.",
            avoid: "Recently modified.",
          },
          {
            say: "Reception owns this follow-up.",
            avoid: "The team is on it.",
          },
          {
            say: "You can revert to the previous version.",
            avoid: "Undo powered by AI magic.",
          },
        ],
      },
    ],
  },
  applications: {
    social: {
      title: "Social media",
      body:
        "Use the LinkedIn header with an approved profile-picture background. Aether is the default avatar field; Vital, Mist, Black and White are approved when the surrounding page needs different contrast.",
      linkedinHeader: img(
        "aetheri-linkedin-header",
        "Aetheri Medical LinkedIn header",
      ),
      linkedinHeaderDownloadPath:
        "exports/applications/aetheri-linkedin-header.png",
      profileColors: ["Aether", "Vital", "Mist", "Black", "White"],
      defaultProfileColor: "Aether",
      profileAssets: {
        Aether: {
          hex: "#167AEA",
          pfpSvg: "exports/profile-pictures/aetheri-pfp-on-aether.svg",
        },
        Vital: {
          hex: "#53D5B9",
          pfpSvg: "exports/profile-pictures/aetheri-pfp-on-vital.svg",
        },
        Mist: {
          hex: "#E8F3FE",
          pfpSvg: "exports/profile-pictures/aetheri-pfp-on-mist.svg",
        },
        Black: {
          hex: "#000000",
          pfpSvg: "exports/profile-pictures/aetheri-pfp-on-black.svg",
        },
        White: {
          hex: "#FFFFFF",
          pfpSvg: "exports/profile-pictures/aetheri-pfp-on-white.svg",
        },
      },
    },
    brandInUse: {
      title: "Brand in use",
      body:
        "The identity should feel calm in clinical settings. Give layouts a clear entry point—logo or headline first—then supporting photography or UI. Generous Mist and White space keeps dense information readable.",
      images: [
        img(
          "aetheri-environment",
          "Aetheri Medical in a clinic environment",
        ),
        img(
          "aetheri-stationery",
          "Aetheri Medical stationery and print",
        ),
      ],
    },
    material: {
      title: "A material identity",
      body:
        "Physical touchpoints—badges, folders, wall vinyl—should use the same Aether and Vital proportions as the screen. Prefer matte finishes and soft light; avoid glossy stock that fights the blues.",
      images: [
        img("aetheri-posters", "Aetheri Medical posters in situ"),
        img("aetheri-materials", "Aetheri Medical branded materials"),
      ],
    },
    recognition: {
      title: "A consistent presence",
      body:
        "Recognition comes from the winged symbol and the Aetheri Medical name used with confidence. Keep the lockup intact, allow clear space equal to the height of the circle, and choose Aether or White versions that hold at a distance.",
      image: img(
        "aetheri-flag",
        "Aetheri Medical signage or flag",
      ),
    },
  },
  exports: {
    title: "Export assets",
    groups: [
      {
        title: "Isotype",
        assets: [
          {
            label: "Color",
            path: "exports/isotype/aetheri-isotype-color.svg",
            variant: "isotype",
          },
          {
            label: "Aether",
            path: "exports/isotype/aetheri-isotype-aether.svg",
            variant: "isotype",
          },
          {
            label: "Vital",
            path: "exports/isotype/aetheri-isotype-vital.svg",
            variant: "isotype",
          },
          {
            label: "Black",
            path: "exports/isotype/aetheri-isotype-black.svg",
            variant: "isotype",
          },
          {
            label: "White",
            path: "exports/isotype/aetheri-isotype-white.svg",
            variant: "isotype",
          },
        ],
      },
      {
        title: "Logotype",
        assets: [
          {
            label: "Aether",
            path: "exports/logotype/aetheri-logotype-aether.svg",
            variant: "logotype",
          },
          {
            label: "Campaign",
            path: "exports/logotype/aetheri-logotype-campaign.svg",
            variant: "logotype",
          },
          {
            label: "Black",
            path: "exports/logotype/aetheri-logotype-black.svg",
            variant: "logotype",
          },
          {
            label: "White",
            path: "exports/logotype/aetheri-logotype-white.svg",
            variant: "logotype",
          },
        ],
      },
      {
        title: "Profile pictures",
        assets: [
          {
            label: "Aether",
            path: "exports/profile-pictures/aetheri-pfp-on-aether.svg",
            variant: "pfp",
          },
          {
            label: "Vital",
            path: "exports/profile-pictures/aetheri-pfp-on-vital.svg",
            variant: "pfp",
          },
          {
            label: "Mist",
            path: "exports/profile-pictures/aetheri-pfp-on-mist.svg",
            variant: "pfp",
          },
          {
            label: "Black",
            path: "exports/profile-pictures/aetheri-pfp-on-black.svg",
            variant: "pfp",
          },
          {
            label: "White",
            path: "exports/profile-pictures/aetheri-pfp-on-white.svg",
            variant: "pfp",
          },
        ],
      },
      {
        title: "App icons",
        assets: [
          {
            label: "Favicon SVG",
            path: "exports/app-icons/svg/aetheri-favicon.svg",
            variant: "appIcon",
          },
        ],
      },
      {
        title: "Social media",
        assets: [
          {
            label: "LinkedIn company · 3046×516",
            path: "exports/applications/aetheri-linkedin-header.png",
            variant: "banner",
            previewAspect: "3046 / 516",
            previewAlt: "Aetheri Medical LinkedIn header",
          },
        ],
      },
      {
        title: "Applications",
        assets: [
          {
            label: "Introduction",
            path: "exports/applications/aetheri-introduction.png",
            variant: "application",
            previewAspect: "16 / 9",
            previewAlt: "Aetheri Medical lockup on a light clinical field",
          },
          {
            label: "In the clinic",
            path: "exports/applications/aetheri-environment.png",
            variant: "application",
            previewAspect: "16 / 9",
            previewAlt: "Aetheri Medical in a clinic environment",
          },
          {
            label: "Stationery",
            path: "exports/applications/aetheri-stationery.png",
            variant: "application",
            previewAspect: "16 / 9",
            previewAlt: "Aetheri Medical stationery",
          },
          {
            label: "Campaigns",
            path: "exports/applications/aetheri-posters.png",
            variant: "application",
            previewAspect: "16 / 9",
            previewAlt: "Aetheri Medical posters",
          },
          {
            label: "Materials",
            path: "exports/applications/aetheri-materials.png",
            variant: "application",
            previewAspect: "16 / 9",
            previewAlt: "Aetheri Medical branded materials",
          },
          {
            label: "Signage",
            path: "exports/applications/aetheri-flag.png",
            variant: "application",
            previewAspect: "16 / 9",
            previewAlt: "Aetheri Medical signage",
          },
        ],
      },
      {
        title: "Typography",
        assets: [
          {
            label: "Jomhuria",
            path: "preview-fonts/Jomhuria-Regular.ttf",
            variant: "mark",
          },
          {
            label: "Inter",
            path: "preview-fonts/Inter-Regular.ttf",
            variant: "mark",
          },
        ],
      },
    ],
  },
};
