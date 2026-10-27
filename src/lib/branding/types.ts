export type BrandColorSwatch = {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
};

export type BrandContrastRow = {
  foreground: string;
  background: string;
  foregroundName: string;
  backgroundName: string;
  ratio: string;
  level: "AAA" | "AA" | "Fail";
  foregroundP3?: string;
  backgroundP3?: string;
};

export type BrandProportionBar = {
  name: string;
  value: number;
};

export type BrandTypeScaleRow = {
  level: string;
  meta: string;
  sample: string;
  sampleStyle: Record<string, string>;
};

export type BrandVerbalPrinciple = {
  title: string;
  description: string;
};

export type BrandSayAvoidPair = {
  say: string;
  avoid: string;
};

export type BrandNavItem = {
  id: string;
  label: string;
  href: string;
};

export type BrandExportAsset = {
  label: string;
  path: string;
  variant?: "mark" | "logotype" | "isotype" | "pfp" | "appIcon" | "banner" | "application";
  /** Kargul preview webp id under `previews/<id>-{400,800,1600}.webp` */
  previewId?: string;
  /** CSS value for `--export-preview-aspect`, e.g. `4 / 1` */
  previewAspect?: string;
  previewAlt?: string;
};

export type BrandExportGroup = {
  title: string;
  assets: BrandExportAsset[];
};

export type BrandImageSet = {
  baseName: string;
  alt: string;
};

export type BrandProfileColorAsset = {
  hex: string;
  pfpSvg: string;
  pfpPng?: string;
};

export type BrandThemeFonts = {
  /** Path under `/branding/<slug>/`, e.g. `brand-fonts.css` */
  stylesheet: string;
  displayFontVar: string;
  uiFontVar: string;
  typographyExportDisplayName: string;
  typographyExportUiName: string;
};

export type BrandGuidelines = {
  slug: string;
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  metaTitle: string;
  metaDescription: string;
  footerCredit: string;
  theme: BrandThemeFonts;
  nav: BrandNavItem[];
  scrollSpy: { navId: string; sectionIds: string[] }[];
  introduction: {
    title: string;
    body: string;
    heroImage: BrandImageSet;
  };
  marks: {
    logotypeScale: {
      title: string;
      body: string;
      sizes: number[];
      heroImage: BrandImageSet;
    };
    colorVersions: {
      title: string;
      blackOnLight: string;
      whiteOnDark: string;
      blackLogotype: string;
      whiteLogotype: string;
    };
  };
  colors: {
    palette: {
      title: string;
      body: string;
      swatches: BrandColorSwatch[];
    };
    proportions: {
      title: string;
      body: string;
      bars: BrandProportionBar[];
    };
    accessibility: {
      title: string;
      rows: BrandContrastRow[];
    };
  };
  typography: {
    typeSystem: {
      title: string;
      exposure: string;
      geist: string;
      fontDownloadLabel: string;
      fontDownloadPath: string;
      displayPreviewLink?: string;
      uiPreviewLink?: string;
      displayPreviewPlaceholder?: string;
      uiPreviewPlaceholder?: string;
    };
    typeScale: {
      title: string;
      intro: string;
      baseDefault: number;
      ratioDefault: number;
      rows: BrandTypeScaleRow[];
    };
  };
  tone: {
    title: string;
    intro: string;
    messages: { label: string; text: string }[];
    principles: (BrandVerbalPrinciple & { pairs: BrandSayAvoidPair[] })[];
  };
  applications: {
    social: {
      title: string;
      body: string;
      linkedinHeader: BrandImageSet;
      linkedinHeaderDownloadPath: string;
      profileColors: string[];
      defaultProfileColor: string;
      profileAssets: Record<string, BrandProfileColorAsset>;
    };
    brandInUse: {
      title: string;
      body: string;
      images: BrandImageSet[];
    };
    material: {
      title: string;
      body: string;
      images: BrandImageSet[];
    };
    recognition: {
      title: string;
      body: string;
      image: BrandImageSet;
    };
  };
  exports: {
    title: string;
    groups: BrandExportGroup[];
  };
};
