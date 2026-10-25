import type { BrandGuidelines } from "../types";

const img = (baseName: string, alt: string) => ({ baseName, alt });

export const opsisBrand: BrandGuidelines = {
  slug: "opsis",
  name: "Opsis Partners",
  heroTitle: "Opsis Partners Guidelines",
  heroSubtitle:
    "An operations partner for founders and growing businesses.",
  metaTitle: "Opsis Partners — Stackwise Technologies",
  metaDescription:
    "The visual identity, typography and tone of voice of Opsis Partners.",
  footerCredit:
    "Live brand system developed by Stackwise Technologies for remarkable clients.",
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
      "Opsis Partners takes care of the operational work behind a growing business. Invoices, suppliers, deadlines and recurring processes have someone responsible for keeping them moving. Founders gain the time and attention to build, with a clear view of what has been done and what needs a decision. The symbol is built around the letter O, formed by a series of connected nodes. It represents Opsis as the point where different operational areas, people and processes are brought together into one organised system. Deep green, warm brown and paper tones give the identity a settled, tactile quality. Exposure brings warmth to the name and headlines. The restrained layouts leave room for the message and make the work feel considered.",
    heroImage: img(
      "opsis-introduction",
      "Opsis Partners light lockup on a textured brown field",
    ),
  },
  marks: {
    logotypeScale: {
      title: "Logotype scale",
      body:
        "The lockup brings the connected-node symbol and the Opsis Partners name together as one signature. Preserve their proportions and spacing at every size. Check the lettering and the gaps between the nodes at the intended viewing size. Where the full name becomes difficult to read, use the symbol on its own and give it enough room to remain distinct.",
      sizes: [72, 60, 48, 38, 30, 24, 18],
      heroImage: img(
        "opsis-introduction",
        "Opsis Partners light lockup on a textured brown field",
      ),
    },
    colorVersions: {
      title: "Color versions",
      blackOnLight:
        "Use the Black lockup on Paper, White, and other light backgrounds. This is the primary version for light layouts and monochrome production.",
      whiteOnDark:
        "Use the White lockup on Forest, Earth, Black, and other dark backgrounds. Keep each lockup in one color so the symbol and name read together, preserve the supplied proportions and clear space, and use the symbol on its own for small avatars and icons.",
      blackLogotype: "exports/logotype/opsis-logotype-black.svg",
      whiteLogotype: "exports/logotype/opsis-logotype-white.svg",
    },
  },
  colors: {
    palette: {
      title: "Core palette",
      body:
        "Forest is the main brand color. It gives the identity its depth across campaign panels, notebooks and fabric. Earth adds warmth through brown surfaces and material details. Paper provides a soft, open field for type and information. Black and White support contrast, legibility and practical reproduction.",
      swatches: [
        {
          name: "Forest",
          hex: "#131D18",
          rgb: "19, 29, 24",
          cmyk: "34, 0, 17, 89",
        },
        {
          name: "Earth",
          hex: "#2C1E19",
          rgb: "44, 30, 25",
          cmyk: "0, 32, 43, 83",
        },
        {
          name: "Paper",
          hex: "#DDDAD5",
          rgb: "221, 218, 213",
          cmyk: "0, 1, 4, 13",
        },
        {
          name: "Black",
          hex: "#000000",
          rgb: "0, 0, 0",
          cmyk: "0, 0, 0, 100",
        },
        {
          name: "White",
          hex: "#FFFFFF",
          rgb: "255, 255, 255",
          cmyk: "0, 0, 0, 0",
        },
      ],
    },
    proportions: {
      title: "Color proportions",
      body:
        "Give Forest the largest share of the identity, with Paper opening up space for reading and Earth adding warmth. Black and White support the smaller details, from practical information to a clear signature on varied surfaces.",
      bars: [
        { name: "Forest", value: 40 },
        { name: "Paper", value: 25 },
        { name: "Earth", value: 25 },
        { name: "Black", value: 5 },
        { name: "White", value: 5 },
      ],
    },
    accessibility: {
      title: "Readable combinations",
      rows: [
        {
          foreground: "#131D18",
          background: "#DDDAD5",
          foregroundName: "Forest",
          backgroundName: "Paper",
          ratio: "12.4",
          level: "AAA",
          foregroundP3: "color(display-p3 0.0745 0.1137 0.0941)",
          backgroundP3: "color(display-p3 0.8667 0.8549 0.8353)",
        },
        {
          foreground: "#DDDAD5",
          background: "#131D18",
          foregroundName: "Paper",
          backgroundName: "Forest",
          ratio: "12.4",
          level: "AAA",
          foregroundP3: "color(display-p3 0.8667 0.8549 0.8353)",
          backgroundP3: "color(display-p3 0.0745 0.1137 0.0941)",
        },
        {
          foreground: "#2C1E19",
          background: "#DDDAD5",
          foregroundName: "Earth",
          backgroundName: "Paper",
          ratio: "11.5",
          level: "AAA",
          foregroundP3: "color(display-p3 0.1725 0.1176 0.098)",
          backgroundP3: "color(display-p3 0.8667 0.8549 0.8353)",
        },
        {
          foreground: "#DDDAD5",
          background: "#2C1E19",
          foregroundName: "Paper",
          backgroundName: "Earth",
          ratio: "11.5",
          level: "AAA",
          foregroundP3: "color(display-p3 0.8667 0.8549 0.8353)",
          backgroundP3: "color(display-p3 0.1725 0.1176 0.098)",
        },
        {
          foreground: "#FFFFFF",
          background: "#131D18",
          foregroundName: "White",
          backgroundName: "Forest",
          ratio: "17.3",
          level: "AAA",
          foregroundP3: "color(display-p3 1 1 1)",
          backgroundP3: "color(display-p3 0.0745 0.1137 0.0941)",
        },
        {
          foreground: "#000000",
          background: "#FFFFFF",
          foregroundName: "Black",
          backgroundName: "White",
          ratio: "21.0",
          level: "AAA",
          foregroundP3: "color(display-p3 0 0 0)",
          backgroundP3: "color(display-p3 1 1 1)",
        },
        {
          foreground: "#131D18",
          background: "#2C1E19",
          foregroundName: "Forest",
          backgroundName: "Earth",
          ratio: "1.1",
          level: "Fail",
          foregroundP3: "color(display-p3 0.0745 0.1137 0.0941)",
          backgroundP3: "color(display-p3 0.1725 0.1176 0.098)",
        },
        {
          foreground: "#FFFFFF",
          background: "#DDDAD5",
          foregroundName: "White",
          backgroundName: "Paper",
          ratio: "1.4",
          level: "Fail",
          foregroundP3: "color(display-p3 1 1 1)",
          backgroundP3: "color(display-p3 0.8667 0.8549 0.8353)",
        },
      ],
    },
  },
  typography: {
    typeSystem: {
      title: "Type system",
      exposure:
        "Exposure brings an editorial quality to the identity, balancing expressive curves with a composed presence. Use the static Exposure 0 face, matching the headlines on the Opsis website. Let its character carry a concise thought, with enough space around the words to appreciate their shape.",
      geist:
        "Geist is the working typeface for correspondence, schedules and information that needs to be scanned. Regular supports sustained reading; Medium picks out names, dates and decisions. Keep paragraphs compact and align related details consistently, using its even proportions to make a dense page feel approachable and organised.",
      fontDownloadLabel: "Exposure 0",
      fontDownloadPath: "preview-fonts/Exposure-0.ttf",
    },
    typeScale: {
      title: "Type scale",
      intro:
        "A measured progression from statement to supporting detail keeps each page easy to follow, with proportion and contrast doing the work.",
      baseDefault: 15,
      ratioDefault: 1.25,
      rows: [
        {
          level: "Display",
          meta: "Exposure 0 · 400 · 42.8px · 2.675rem",
          sample: "Good things take coordination.",
          sampleStyle: {
            "--sample-font-family": "var(--font-opsis-exposure)",
            "--sample-font-size": "42.8px",
            "--sample-font-weight": "400",
            "--sample-line-height": "1.3",
          },
        },
        {
          level: "Heading 1",
          meta: "Exposure 0 · 400 · 34.2px · 2.138rem",
          sample: "A little foresight goes a long way.",
          sampleStyle: {
            "--sample-font-family": "var(--font-opsis-exposure)",
            "--sample-font-size": "34.2px",
            "--sample-font-weight": "400",
            "--sample-line-height": "1.3",
          },
        },
        {
          level: "Heading 2",
          meta: "Exposure 0 · 400 · 23.4px · 1.463rem",
          sample: "Small details make a lasting difference.",
          sampleStyle: {
            "--sample-font-family": "var(--font-opsis-exposure)",
            "--sample-font-size": "23.4px",
            "--sample-font-weight": "400",
            "--sample-line-height": "1.35",
          },
        },
        {
          level: "Heading 3",
          meta: "Geist · 500 · 18.8px · 1.175rem",
          sample: "The right people at the right moment",
          sampleStyle: {
            "--sample-font-family": "var(--font-geist-sans)",
            "--sample-font-size": "18.8px",
            "--sample-font-weight": "500",
            "--sample-line-height": "1.3",
          },
        },
        {
          level: "Body",
          meta: "Geist · 400 · 15px · 0.938rem",
          sample:
            "One point of contact connects your team with the people and resources they need, from the first request to the final confirmation.",
          sampleStyle: {
            "--sample-font-family": "var(--font-geist-sans)",
            "--sample-font-size": "15px",
            "--sample-font-weight": "400",
            "--sample-line-height": "1.55",
          },
        },
        {
          level: "Caption",
          meta: "Geist · 400 · 12px · 0.75rem",
          sample: "Renewal confirmed through September with no further action needed.",
          sampleStyle: {
            "--sample-font-family": "var(--font-geist-sans)",
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
      "Opsis sounds like someone who knows the business and follows through. Use plain language, specific actions and a measured tone. A founder should be able to understand the position quickly and know whether anything needs their attention.",
    messages: [
      { label: "Signature", text: "Handled." },
      { label: "Short headline", text: "The details have an owner." },
      {
        label: "Headline",
        text: "Good follow-through means you don't have to ask twice.",
      },
      {
        label: "Brand statement",
        text:
          "Opsis takes responsibility for the work between a decision and a result.",
      },
      {
        label: "Introduction",
        text:
          "From invoices and supplier requests to recurring deadlines, Opsis keeps track of who needs what and sees each task through, so founders can stop being the link between every moving part.",
      },
    ],
    principles: [
      {
        title: "Make ownership clear",
        description: "Name the work and who is handling it.",
        pairs: [
          {
            say: "We follow up on unpaid invoices.",
            avoid: "End-to-end operational solutions.",
          },
          {
            say: "We will arrange the renewal.",
            avoid: "Please delegate the next steps.",
          },
          {
            say: "The supplier review is complete.",
            avoid: "We are working on various things.",
          },
        ],
      },
      {
        title: "Give the useful detail",
        description:
          "State the position, the next step and any decision needed.",
        pairs: [
          {
            say: "Two invoices are awaiting payment.",
            avoid: "Everything is under control.",
          },
          {
            say: "Please approve the quote by Friday.",
            avoid: "Please review at your convenience.",
          },
          {
            say: "We will check again on Thursday.",
            avoid: "We will follow up shortly.",
          },
        ],
      },
      {
        title: "Respect the founder's attention",
        description:
          "Offer a recommendation and make it easy to respond.",
        pairs: [
          {
            say: "We recommend the current provider.",
            avoid: "Please advise on all of the above.",
          },
          {
            say: "The lower quote saves £200 a month.",
            avoid: "This option adds significant value.",
          },
          {
            say: "Tell us what takes up your week.",
            avoid: "Ready to supercharge your journey?",
          },
        ],
      },
    ],
  },
  applications: {
    social: {
      title: "Social media",
      body:
        "Use the approved LinkedIn header with one of the profile-picture variants. Forest is the default profile field; Paper, Earth, Black and White are approved alternatives when the surrounding page needs a different contrast.",
      linkedinHeader: img(
        "opsis-linkedin-header",
        "Opsis Partners LinkedIn header",
      ),
      profileColors: ["Forest", "Earth", "Paper", "Black", "White"],
      defaultProfileColor: "Forest",
    },
    brandInUse: {
      title: "Brand in use",
      body:
        "The identity should feel composed wherever people encounter it. Give each layout a clear point of entry, then let the message, image and signature follow a deliberate order. Generous space and a restrained palette make the communication easy to take in. The scale can change across formats, while the relationship between the elements stays familiar.",
      images: [
        img("opsis-tram", "Opsis Partners campaign on a Geneva tram"),
        img("opsis-stationery", "Embossed Forest notebook and Earth business cards"),
      ],
    },
    material: {
      title: "A material identity",
      body:
        "Material gives Opsis a sense of care and permanence. Warm surfaces, natural grain and directional light bring depth to the palette and make simple compositions feel distinctive. Choose textures that support the message and leave enough quiet space for type to remain clear. Consistency comes from the color, proportions and placement of the identity, allowing each surface to retain its own character.",
      images: [
        img(
          "opsis-posters",
          "Opsis posters with a wax seal, a television and a cross section of timber",
        ),
        img(
          "opsis-materials",
          "Forest leather and an Opsis sign casting its name onto stone",
        ),
      ],
    },
    recognition: {
      title: "A consistent presence",
      body:
        "Recognition depends on a few elements used with confidence. Keep the lockup intact, give it room and choose a contrast that holds as the viewing distance or setting changes. Let the surrounding field do its part. A simple composition allows the name and symbol to remain familiar across physical spaces and everyday communication.",
      image: img(
        "opsis-flag",
        "Paper Opsis Partners lockup on a Forest flag",
      ),
    },
  },
  exports: {
    title: "Export assets",
    groups: [
      {
        title: "Isotype",
        assets: [
          { label: "Forest", path: "exports/isotype/opsis-isotype-green.svg", variant: "isotype" },
          { label: "Earth", path: "exports/isotype/opsis-isotype-brown.svg", variant: "isotype" },
          { label: "Paper", path: "exports/isotype/opsis-isotype-paper.svg", variant: "isotype" },
          { label: "Black", path: "exports/isotype/opsis-isotype-black.svg", variant: "isotype" },
          { label: "White", path: "exports/isotype/opsis-isotype-white.svg", variant: "isotype" },
        ],
      },
      {
        title: "Logotype",
        assets: [
          { label: "Forest", path: "exports/logotype/opsis-logotype-green.svg", variant: "logotype" },
          { label: "Earth", path: "exports/logotype/opsis-logotype-brown.svg", variant: "logotype" },
          { label: "Paper", path: "exports/logotype/opsis-logotype-paper.svg", variant: "logotype" },
          { label: "Black", path: "exports/logotype/opsis-logotype-black.svg", variant: "logotype" },
          { label: "White", path: "exports/logotype/opsis-logotype-white.svg", variant: "logotype" },
        ],
      },
      {
        title: "Profile pictures",
        assets: [
          { label: "Forest", path: "exports/profile-pictures/opsis-pfp-on-green.svg", variant: "pfp" },
          { label: "Earth", path: "exports/profile-pictures/opsis-pfp-on-brown.svg", variant: "pfp" },
          { label: "Paper", path: "exports/profile-pictures/opsis-pfp-on-paper.svg", variant: "pfp" },
          { label: "Black", path: "exports/profile-pictures/opsis-pfp-on-black.svg", variant: "pfp" },
          { label: "White", path: "exports/profile-pictures/opsis-pfp-on-white.svg", variant: "pfp" },
        ],
      },
      {
        title: "App icons",
        assets: [
          { label: "Favicon SVG", path: "exports/app-icons/svg/opsis-favicon.svg", variant: "appIcon" },
          { label: "Favicon PNG", path: "exports/app-icons/png/opsis-favicon-32.png", variant: "appIcon" },
          { label: "Favicon ICO", path: "exports/app-icons/ico/favicon.ico", variant: "appIcon" },
          { label: "Apple icon", path: "exports/app-icons/png/opsis-apple-touch.png", variant: "appIcon" },
          { label: "PWA icon", path: "exports/app-icons/png/opsis-icon-192.png", variant: "appIcon" },
          { label: "PWA icon large", path: "exports/app-icons/png/opsis-icon-512.png", variant: "appIcon" },
        ],
      },
      {
        title: "Social media",
        assets: [
          {
            label: "LinkedIn personal · 3000×750",
            path: "exports/applications/opsis-linkedin-header-personal.png",
            variant: "banner",
            previewId: "044b4bf96039d0c0a819",
            previewAspect: "4 / 1",
            previewAlt: "LinkedIn personal banner with vintage TV and tagline",
          },
          {
            label: "LinkedIn company · 3046×516",
            path: "exports/applications/opsis-linkedin-header.png",
            variant: "banner",
            previewId: "6333851358cf66290da7",
            previewAspect: "3046 / 516",
            previewAlt: "LinkedIn company banner with vintage TV and tagline",
          },
        ],
      },
      {
        title: "Applications",
        assets: [
          {
            label: "Introduction",
            path: "exports/applications/opsis-introduction.png",
            variant: "application",
            previewId: "a4d14e1ed75cdf980cce",
            previewAspect: "16 / 9",
            previewAlt: "Opsis Partners light lockup on a textured brown field",
          },
          {
            label: "In the city",
            path: "exports/applications/opsis-tram.png",
            variant: "application",
            previewId: "d63bb013657ed89ccfb2",
            previewAspect: "16 / 9",
            previewAlt: "Tram wrap with Opsis Partners campaign creative",
          },
          {
            label: "Stationery",
            path: "exports/applications/opsis-stationery.png",
            variant: "application",
            previewId: "823d144bf9338ce3f809",
            previewAspect: "16 / 9",
            previewAlt: "Business cards and folder with Opsis Partners branding",
          },
          {
            label: "Campaigns",
            path: "exports/applications/opsis-posters.png",
            variant: "application",
            previewId: "3ebe7e302100bb897430",
            previewAspect: "16 / 9",
            previewAlt: "Street posters for Opsis Partners campaigns",
          },
          {
            label: "Materials and light",
            path: "exports/applications/opsis-materials.png",
            variant: "application",
            previewId: "584f6ff1b6f060abc6be",
            previewAspect: "16 / 9",
            previewAlt: "Brand materials under natural light",
          },
          {
            label: "In motion",
            path: "exports/applications/opsis-flag.png",
            variant: "application",
            previewId: "b888a89d234f43a543ed",
            previewAspect: "16 / 9",
            previewAlt: "Opsis Partners lockup on a Forest flag",
          },
        ],
      },
      {
        title: "Typography",
        assets: [
          { label: "Exposure 0", path: "preview-fonts/Exposure-0.ttf", variant: "mark" },
          { label: "Geist", path: "preview-fonts/Exposure-0.ttf", variant: "mark" },
        ],
      },
    ],
  },
};
