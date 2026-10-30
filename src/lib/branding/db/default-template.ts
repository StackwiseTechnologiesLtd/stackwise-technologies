import type { BrandGuidelines } from "../types";

/** Opsis-shaped shell for a new DB-backed brand; fill copy and upload assets in admin. */
export function createBrandGuidelinesTemplate(slug: string, name: string): BrandGuidelines {
  const prefix = slug;
  const img = (baseName: string, alt: string) => ({ baseName, alt });

  return {
    slug,
    name,
    storage: "database",
    heroTitle: `${name} Guidelines`,
    heroSubtitle: "",
    metaTitle: `${name} — Stackwise Technologies`,
    metaDescription: `The visual identity, typography and tone of voice of ${name}.`,
    footerCredit:
      "Live brand system developed by Stackwise Technologies for remarkable clients.",
    theme: {
      stylesheet: "brand-fonts.css",
      displayFontVar: "--font-brand-display",
      uiFontVar: "--font-geist-sans",
      typographyExportDisplayName: "Display",
      typographyExportUiName: "UI",
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
      body: "",
      heroImage: img(`${prefix}-introduction`, `${name} introduction hero`),
    },
    marks: {
      logotypeScale: {
        title: "Logotype scale",
        body: "",
        sizes: [72, 60, 48, 38, 30, 24, 18],
        heroImage: img(`${prefix}-introduction`, `${name} introduction hero`),
      },
      colorVersions: {
        title: "Color versions",
        blackOnLight: "",
        whiteOnDark: "",
        blackLogotype: `exports/logotype/${prefix}-logotype-primary.svg`,
        whiteLogotype: `exports/logotype/${prefix}-logotype-white.svg`,
      },
    },
    colors: {
      palette: {
        title: "Core palette",
        body: "",
        swatches: [
          { name: "Primary", hex: "#167AEA", rgb: "22, 122, 234", cmyk: "91, 48, 0, 8" },
          { name: "Secondary", hex: "#53D5B9", rgb: "83, 213, 185", cmyk: "61, 0, 35, 0" },
          { name: "Mist", hex: "#E8F3FE", rgb: "232, 243, 254", cmyk: "9, 4, 0, 0" },
          { name: "White", hex: "#FFFFFF", rgb: "255, 255, 255", cmyk: "0, 0, 0, 0" },
          { name: "Black", hex: "#000000", rgb: "0, 0, 0", cmyk: "0, 0, 0, 100" },
        ],
      },
      proportions: {
        title: "Color proportions",
        body: "",
        bars: [
          { name: "Primary", value: 40 },
          { name: "Mist", value: 25 },
          { name: "White", value: 20 },
          { name: "Secondary", value: 10 },
          { name: "Black", value: 5 },
        ],
      },
      accessibility: {
        title: "Readable combinations",
        rows: [],
      },
    },
    typography: {
      typeSystem: {
        title: "Type system",
        exposure: "",
        geist: "",
        fontDownloadLabel: "Display",
        fontDownloadPath: "preview-fonts/display.ttf",
      },
      typeScale: {
        title: "Type scale",
        intro: "",
        baseDefault: 15,
        ratioDefault: 1.25,
        rows: [],
      },
    },
    tone: {
      title: "Tone of voice",
      intro: "",
      messages: [
        { label: "Signature", text: "" },
        { label: "Short headline", text: "" },
        { label: "Headline", text: "" },
        { label: "Brand statement", text: "" },
        { label: "Introduction", text: "" },
      ],
      principles: [],
    },
    applications: {
      social: {
        title: "Social media",
        body: "",
        linkedinHeader: img(`${prefix}-linkedin-header`, `${name} LinkedIn header`),
        linkedinHeaderDownloadPath: `exports/applications/${prefix}-linkedin-header.png`,
        profileColors: ["Primary", "Secondary", "Mist", "Black", "White"],
        defaultProfileColor: "Primary",
        profileAssets: {},
      },
      brandInUse: {
        title: "Brand in use",
        body: "",
        images: [
          img(`${prefix}-environment`, `${name} in context`),
          img(`${prefix}-stationery`, `${name} stationery`),
        ],
      },
      material: {
        title: "A material identity",
        body: "",
        images: [
          img(`${prefix}-posters`, `${name} posters`),
          img(`${prefix}-materials`, `${name} materials`),
        ],
      },
      recognition: {
        title: "A consistent presence",
        body: "",
        image: img(`${prefix}-flag`, `${name} signage`),
      },
    },
    exports: {
      title: "Export assets",
      groups: [],
    },
  };
}
