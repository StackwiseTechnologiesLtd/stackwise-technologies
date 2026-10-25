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
};

export type BrandExportGroup = {
  title: string;
  assets: BrandExportAsset[];
};

export type BrandImageSet = {
  baseName: string;
  alt: string;
};

export type BrandGuidelines = {
  slug: string;
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  metaTitle: string;
  metaDescription: string;
  footerCredit: string;
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
    principles: BrandVerbalPrinciple[];
    pairs: BrandSayAvoidPair[];
  };
  applications: {
    social: {
      title: string;
      body: string;
      linkedinHeader: BrandImageSet;
      profileColors: string[];
      defaultProfileColor: string;
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
