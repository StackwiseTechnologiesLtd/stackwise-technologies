"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { BrandGuidelines, BrandImageSet } from "@/lib/branding/types";
import { brandAssetUrl } from "@/lib/branding/asset-url";
import { BrandResponsiveImage } from "./brand-media";
import { CopyButton } from "./CopyButton";
import {
  IconClipboardCopy,
  IconDownload,
  IconMoon,
  IconSun,
} from "./brand-icons";

const PFP_BY_COLOR: Record<string, string> = {
  Forest: "exports/profile-pictures/opsis-pfp-on-green.svg",
  Earth: "exports/profile-pictures/opsis-pfp-on-brown.svg",
  Paper: "exports/profile-pictures/opsis-pfp-on-paper.svg",
  Black: "exports/profile-pictures/opsis-pfp-on-black.svg",
  White: "exports/profile-pictures/opsis-pfp-on-white.svg",
};

const THEME_KEY = "brand-guidelines-theme";

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="Guidelines_header__eKhdt">
      <div className="Guidelines_headerMain__ftdWL">
        <h2 className="Guidelines_title__hPRGY">{title}</h2>
      </div>
      {action ? (
        <div className="Guidelines_headerAction__l4m_r">{action}</div>
      ) : null}
    </div>
  );
}

function SwatchValueRow({
  label,
  value,
  copyLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      className={`Guidelines_swatchValueRow__uqpXK${copied ? " Guidelines_swatchValueRowCopied___Z11X" : ""}`}
      aria-label={copyLabel}
      onClick={() => void onCopy()}
    >
      <span className="Guidelines_swatchValueLabel__0BtPE">{label}</span>
      <span className="Guidelines_swatchValueText__HioaT">{value}</span>
      <span className="Guidelines_swatchValueIcon__H4Qn7" aria-hidden />
    </button>
  );
}

function ImageCarousel({ images }: { images: BrandImageSet[] }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + count) % count);
  };

  return (
    <div className="Guidelines_imageCarouselFrame__RYvlu">
      <div className="Guidelines_imageCarouselViewport___q9Ts">
        {images.map((img, i) => (
          <div
            key={img.baseName}
            className={`Guidelines_imageCarouselSlide__uaG7I${i === index ? " Guidelines_imageCarouselSlideActive__mVOGP" : ""}`}
            aria-hidden={i !== index}
          >
            <BrandResponsiveImage
              baseName={img.baseName}
              alt={img.alt}
              className="Guidelines_imageFill__leSLX"
            />
          </div>
        ))}
      </div>
      {count > 1 ? (
        <>
          <button
            type="button"
            className="Guidelines_imageCarouselButton__axhbB Guidelines_imageCarouselButtonPrevious__uRocR"
            aria-label="Previous image"
            onClick={() => go(-1)}
          />
          <button
            type="button"
            className="Guidelines_imageCarouselButton__axhbB Guidelines_imageCarouselButtonNext___yC51"
            aria-label="Next image"
            onClick={() => go(1)}
          />
        </>
      ) : null}
    </div>
  );
}

export function BrandGuidelinesPage({ brand }: { brand: BrandGuidelines }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.getAttribute("data-theme") === "dark";
  });
  const [activeNavId, setActiveNavId] = useState("foundation");
  const [navBarY, setNavBarY] = useState(0);
  const [profileColor, setProfileColor] = useState(
    brand.applications.social.defaultProfileColor,
  );
  const [figmaOpen, setFigmaOpen] = useState(false);
  const navListRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const toggleTheme = useCallback(() => {
    document.documentElement.classList.add("theme-switching");
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-switching");
    }, 300);
  }, [dark]);

  useEffect(() => {
    const sectionIds = brand.scrollSpy.flatMap((g) => g.sectionIds);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const id = visible[0].target.id;
        const match = brand.scrollSpy.find((g) => g.sectionIds.includes(id));
        if (match) setActiveNavId(match.navId);
      },
      {
        rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue("--scroll-spy-offset") || "160px"} 0px -40% 0px`,
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [brand.scrollSpy]);

  useEffect(() => {
    const el = itemRefs.current[activeNavId];
    const list = navListRef.current;
    if (!el || !list) return;
    setNavBarY(el.offsetTop);
  }, [activeNavId, sidebarOpen]);

  const paletteCopyText = useMemo(
    () =>
      brand.colors.palette.swatches
        .map((s) => `${s.name}\nHEX ${s.hex}\nRGB ${s.rgb}\nCMYK ${s.cmyk}`)
        .join("\n\n"),
    [brand.colors.palette.swatches],
  );

  const figmaCopyText = useMemo(
    () => JSON.stringify(brand.colors.palette.swatches, null, 2),
    [brand.colors.palette.swatches],
  );

  const closeSidebar = () => setSidebarOpen(false);

  const onNavClick = (href: string) => {
    closeSidebar();
    if (href.startsWith("#")) {
      const id = href.slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="PageShell_page__1Lyq5">
      <div className="PageShell_container__OwJca">
      <header
        className={`PageShell_mobileTopbar__M_q_O${sidebarOpen ? " PageShell_mobileTopbarOpen__UiTQc" : ""}`}
      >
        <a
          href="#foundation"
          className="PageShell_topbarBrand__vqxX0"
          aria-label={`${brand.name} home`}
          onClick={(e) => {
            e.preventDefault();
            onNavClick("#foundation");
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandAssetUrl("exports/logotype/opsis-logotype-black.svg")}
            alt=""
            className="PageShell_topbarLogo__7jA_m PageShell_topbarLogoLight__0O_iT"
            style={{ height: 22 }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandAssetUrl("exports/logotype/opsis-logotype-white.svg")}
            alt=""
            className="PageShell_topbarLogo__7jA_m PageShell_topbarLogoDark__Ot_mL"
            style={{ height: 22 }}
          />
        </a>
        <button
          type="button"
          className={`PageShell_menuButton__pMVk9${sidebarOpen ? " PageShell_menuButtonOpen__hX1qt" : ""}`}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-nav"
          aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setSidebarOpen((o) => !o)}
        >
          <span className="PageShell_menuGlyph__gw4sz" aria-hidden>
            <span className="PageShell_menuLine__Lh6Yn" />
            <span className="PageShell_menuLine__Lh6Yn" />
            <span className="PageShell_menuLine__Lh6Yn" />
          </span>
        </button>
      </header>

      <button
        type="button"
        className={`PageShell_backdrop__Wh8h8${sidebarOpen ? " PageShell_backdropVisible__HJJxe" : ""}`}
        aria-hidden={!sidebarOpen}
        aria-label="Close navigation overlay"
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={closeSidebar}
      />

      <aside
        id="sidebar-nav"
        className={`Sidebar_sidebar__5oZEx Sidebar_sidebarEntering__vUKmS${sidebarOpen ? " Sidebar_sidebarOpen__EaqAw" : ""}`}
        aria-label="Brand guidelines navigation"
      >
        <div className="Sidebar_sidebarInner__v0gP8">
          <div className="Sidebar_topGroup__L91JV">
            <nav aria-label="Main navigation">
              <ul className="Sidebar_navList__J1mmG" ref={navListRef}>
                <span
                  aria-hidden
                  className={`Sidebar_navBar__mzkBz Sidebar_navBarVisible__Kfeyz`}
                  style={{ transform: `translate3d(0, ${navBarY}px, 0)` }}
                />
                {brand.nav.map((item) => (
                  <li
                    key={item.id}
                    data-nav-id={item.id}
                    ref={(el) => {
                      itemRefs.current[item.id] = el;
                    }}
                    className={`Sidebar_navItem__NB3MD${activeNavId === item.id ? " Sidebar_navItemActive__Q4zh_" : ""}`}
                  >
                    <a
                      href={item.href}
                      className="Sidebar_navLink__YWfYH"
                      aria-current={activeNavId === item.id ? "true" : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavClick(item.href);
                      }}
                    >
                      <span className="Sidebar_navLabel__c33cJ">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="Sidebar_bottomGroup__ofADe">
            <div className="Sidebar_sidebarExports__y7_FU">
              <a
                href="#exports"
                className="Sidebar_exportButton__At7NM"
                onClick={(e) => {
                  e.preventDefault();
                  onNavClick("#exports");
                }}
              >
                <IconDownload className="Sidebar_exportIcon__9N_qx" />
                Export assets
              </a>
              <button
                type="button"
                className="Sidebar_exportButton__At7NM"
                aria-haspopup="dialog"
                onClick={() => setFigmaOpen(true)}
              >
                <IconClipboardCopy className="Sidebar_exportIcon__9N_qx" />
                <span>Copy for Figma</span>
              </button>
              <dialog
                open={figmaOpen}
                className="FigmaExportButton_dialog__1kXN8"
                aria-labelledby="figma-export-title"
              >
                <div className="FigmaExportButton_header__aKO7L">
                  <span className="FigmaExportButton_eyebrow__FEqss">
                    {brand.name} / Figma
                  </span>
                  <button
                    type="button"
                    className="FigmaExportButton_close__b__XV"
                    aria-label="Close Figma export"
                    onClick={() => setFigmaOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <h2 id="figma-export-title">Your brand, ready to paste.</h2>
                <p className="FigmaExportButton_description__vyneu">
                  Color swatches and vector assets, organized in one board.
                </p>
                <div className="FigmaExportButton_actions__GyPUM">
                  <button
                    type="button"
                    className="FigmaExportButton_primary__Rp9df"
                    onClick={() => void navigator.clipboard.writeText(figmaCopyText)}
                  >
                    Copy brand kit JSON
                  </button>
                </div>
              </dialog>
            </div>
            <button
              type="button"
              className="Sidebar_themeToggleButton__5_nBJ"
              aria-pressed={dark}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
            >
              {dark ? (
                <IconSun className="Sidebar_themeToggleIcon__G9TQV" />
              ) : (
                <IconMoon className="Sidebar_themeToggleIcon__G9TQV" />
              )}
              {dark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      </aside>

      <div className="PageShell_main__m0tu4">
        <div className="PageShell_mainContent__kutnG">
          <div className="PageShell_stream__AkLz3" lang="en">
            <div id="foundation" className="PageShell_heroWrap___6Z67">
              <header className="HeroBanner_hero__br1UD">
                <h1 className="HeroBanner_title__81Y9b">{brand.heroTitle}</h1>
                <p className="HeroBanner_subtitle__NpSbC">{brand.heroSubtitle}</p>
              </header>
            </div>

            <section id="brand-context" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.introduction.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">{brand.introduction.body}</p>
              </div>
              <div className="Guidelines_frame__9X4Dv Guidelines_frameWithDownload__IUkzI">
                <BrandResponsiveImage
                  baseName={brand.introduction.heroImage.baseName}
                  alt={brand.introduction.heroImage.alt}
                  className="Guidelines_imageFill__leSLX"
                  priority
                />
              </div>
            </section>

            <section id="marks" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.marks.logotypeScale.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">
                  {brand.marks.logotypeScale.body}
                </p>
              </div>
              <div
                className="Guidelines_logotypeScaleFrame__YW05P"
                aria-label="Opsis Partners logotype at web scale sizes"
              >
                <div className="Guidelines_logotypeScaleViewport__dtD04">
                  <ul className="Guidelines_logotypeScaleList__pbZd5">
                    {brand.marks.logotypeScale.sizes.map((px) => (
                      <li key={px} className="Guidelines_logotypeScaleRow__gY6ve">
                        <span className="Guidelines_logotypeScaleLabel__Yaz2s">
                          {px}
                          <span className="Guidelines_logotypeScaleLabelUnit__oos_2">
                            px
                          </span>
                        </span>
                        <div className="Guidelines_logotypeScaleRowScroller__zFkji">
                          <div className="Guidelines_logotypeScaleLogoCell__P_7X7">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={brandAssetUrl(
                                "exports/logotype/opsis-logotype-black.svg",
                              )}
                              alt={`Opsis Partners logotype at ${px} pixels height`}
                              className="Guidelines_logotypeScaleLogo__8sR11"
                              style={{ height: px }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="mark-colors" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.marks.colorVersions.title} />
              <div className="Guidelines_bodyGridTwo__igR1j">
                <div className="Guidelines_body__k1Zwo">
                  <p className="Guidelines_bodyText__C2R9D">
                    {brand.marks.colorVersions.blackOnLight}
                  </p>
                </div>
                <div className="Guidelines_body__k1Zwo">
                  <p className="Guidelines_bodyText__C2R9D">
                    {brand.marks.colorVersions.whiteOnDark}
                  </p>
                </div>
              </div>
              <div className="Guidelines_gridTwo__igR1j">
                <div className="Guidelines_tileLight___lU6r Guidelines_tileWide__RO1QA">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brandAssetUrl(brand.marks.colorVersions.blackLogotype)}
                    alt="Opsis Partners Black logotype on a light surface"
                    className="Guidelines_logoImageWide__S_DzT"
                  />
                </div>
                <div className="Guidelines_tile__3aEpo Guidelines_tileWide__RO1QA">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brandAssetUrl(brand.marks.colorVersions.whiteLogotype)}
                    alt="Opsis Partners White logotype on a dark surface"
                    className="Guidelines_logoImageWide__S_DzT Guidelines_logotypeScaleLogoDark__c9QtG"
                  />
                </div>
              </div>
            </section>

            <section id="color-palette" className="Guidelines_section__GgFag">
              <SectionHeader
                title={brand.colors.palette.title}
                action={
                  <CopyButton
                    text={paletteCopyText}
                    label="Copy Core palette tokens"
                  />
                }
              />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">{brand.colors.palette.body}</p>
              </div>
              <div className="Guidelines_colorPaletteFrame__9TB_G">
                <ul className="Guidelines_swatchGrid__G1Rjv">
                  {brand.colors.palette.swatches.map((swatch) => (
                    <li key={swatch.name}>
                      <article
                        className="Guidelines_swatchCard__Zx1vV"
                        style={{ "--swatch-color": swatch.hex } as CSSProperties}
                      >
                        <div
                          className="Guidelines_swatchName__fs2bk"
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {swatch.name}
                        </div>
                        <div className="Guidelines_swatchValues__UaRjv">
                          <SwatchValueRow
                            label="HEX"
                            value={swatch.hex}
                            copyLabel={`Copy HEX: ${swatch.hex}`}
                          />
                          <SwatchValueRow
                            label="RGB"
                            value={swatch.rgb}
                            copyLabel={`Copy RGB: ${swatch.rgb}`}
                          />
                          <SwatchValueRow
                            label="CMYK"
                            value={swatch.cmyk}
                            copyLabel={`Copy CMYK: ${swatch.cmyk}`}
                          />
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="color-proportions" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.colors.proportions.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">
                  {brand.colors.proportions.body}
                </p>
              </div>
              <div className="Guidelines_proportionsFrame__3B5OW">
                <div className="Guidelines_proportionsBar__iS_pA">
                  {brand.colors.proportions.bars.map((bar) => (
                    <div
                      key={bar.name}
                      className="Guidelines_proportionsBarSegment__Gprle"
                      style={{ flexGrow: bar.value }}
                    >
                      <span className="Guidelines_proportionsBarName__1IzZY">
                        {bar.name}
                      </span>
                      <span className="Guidelines_proportionsBarValue__Qfcig">
                        {bar.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="color-accessibility" className="Guidelines_section__GgFag">
              <SectionHeader
                title={brand.colors.accessibility.title}
                action={
                  <CopyButton
                    text={brand.colors.accessibility.rows
                      .map(
                        (r) =>
                          `${r.foregroundName} on ${r.backgroundName}: ${r.ratio}:1 (${r.level})`,
                      )
                      .join("\n")}
                    label="Copy Readable combinations"
                  />
                }
              />
              <div className="Guidelines_frame__9X4Dv Guidelines_frameBorderless__9sdyQ Guidelines_accessibilityFrame__HwI2y">
                <ul className="Guidelines_contrastList__6H_wS">
                  {brand.colors.accessibility.rows.map((row) => (
                    <li key={`${row.foregroundName}-${row.backgroundName}`} className="Guidelines_contrastRow__h6A5M">
                      <div
                        className="Guidelines_contrastRowSample__HFqjo"
                        style={
                          {
                            "--brand-background-srgb": row.background,
                            "--brand-foreground-srgb": row.foreground,
                            "--brand-background-p3": row.backgroundP3,
                            "--brand-foreground-p3": row.foregroundP3,
                          } as CSSProperties
                        }
                        aria-hidden
                      >
                        Aa
                      </div>
                      <span className="Guidelines_contrastRowPairing__ZWsCx">
                        {row.foregroundName} on {row.backgroundName}
                      </span>
                      <span
                        className="Guidelines_contrastRowRatio__d1mdI"
                        title="WCAG contrast for the sRGB HEX colors shown"
                        aria-label={`sRGB contrast ${row.ratio} to 1`}
                      >
                        {row.ratio}:1
                      </span>
                      <span
                        className={`Guidelines_contrastBadge__pMM9I ${
                          row.level === "Fail"
                            ? "Guidelines_contrastBadgeFail__6gvsI"
                            : "Guidelines_contrastBadgeAaa__OntRz"
                        }`}
                      >
                        {row.level}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="typography" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.typography.typeSystem.title} />
              <div className="Guidelines_bodyGridTwo__igR1j">
                <div className="Guidelines_body__k1Zwo">
                  <p className="Guidelines_bodyText__C2R9D">
                    {brand.typography.typeSystem.exposure}
                  </p>
                </div>
                <div className="Guidelines_body__k1Zwo">
                  <p className="Guidelines_bodyText__C2R9D">
                    {brand.typography.typeSystem.geist}
                  </p>
                </div>
              </div>
              <a
                href={brandAssetUrl(brand.typography.typeSystem.fontDownloadPath)}
                download
                className="Guidelines_fontDownloadLink__pq6u7"
              >
                <span className="Guidelines_fontDownloadLabel__LG7B3">
                  {brand.typography.typeSystem.fontDownloadLabel}
                </span>
                <IconDownload className="Guidelines_fontDownloadIcon__NH02f" />
              </a>
            </section>

            <section id="type-scale" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.typography.typeScale.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">
                  {brand.typography.typeScale.intro}
                </p>
              </div>
              <div className="TypeScaleGenerator_generator__m3oVZ">
                <ul className="TypeScaleGenerator_scale__Co_6Y">
                  {brand.typography.typeScale.rows.map((row) => (
                    <li key={row.level} className="TypeScaleGenerator_scaleRow__XdIZj">
                      <div className="TypeScaleGenerator_scaleMeta__sfEq3">
                        <span className="TypeScaleGenerator_scaleLevel__3mp0_">
                          {row.level}
                        </span>
                        <span className="TypeScaleGenerator_scaleSize__qtWzB">
                          {row.meta}
                        </span>
                      </div>
                      <textarea
                        rows={1}
                        defaultValue={row.sample}
                        spellCheck={false}
                        aria-label={`${row.level} sample text · type to preview`}
                        className="TypeScaleGenerator_scaleSample__zX7kq"
                        style={row.sampleStyle as CSSProperties}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="tone-of-voice" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.tone.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">{brand.tone.intro}</p>
              </div>
              <div className="VerbalIdentityPreview_preview__gJaEr">
                <ul className="VerbalIdentityPreview_principles__pLN1a">
                  {brand.tone.principles.map((p) => (
                    <li key={p.title} className="VerbalIdentityPreview_principle__yFU3X">
                      <h3 className="VerbalIdentityPreview_principleTitle__XKdwO">
                        {p.title}
                      </h3>
                      <p className="VerbalIdentityPreview_description___Cl5I">
                        {p.description}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="VerbalIdentityPreview_messaging__klIpZ">
                  <table className="VerbalIdentityPreview_table__NAOsX">
                    <tbody>
                      {brand.tone.pairs.map((pair) => (
                        <tr key={pair.say} className="VerbalIdentityPreview_tableRow__8TgqP">
                          <td className="VerbalIdentityPreview_tableCell__aLOqg VerbalIdentityPreview_sayCell__X9I79">
                            {pair.say}
                          </td>
                          <td className="VerbalIdentityPreview_tableCell__aLOqg VerbalIdentityPreview_avoidCell__5_Kuz">
                            {pair.avoid}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section id="applications" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.applications.social.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">
                  {brand.applications.social.body}
                </p>
              </div>
              <div className="Guidelines_socialMediaFrame__qjU65">
                <div className="Guidelines_socialProfileMockup__EsDWT">
                  <div className="Guidelines_socialProfileHeaderMedia___I9jB">
                    <BrandResponsiveImage
                      baseName={brand.applications.social.linkedinHeader.baseName}
                      alt={brand.applications.social.linkedinHeader.alt}
                      className="Guidelines_socialProfileBannerImage__JT9xy"
                    />
                  </div>
                  <div className="Guidelines_socialProfileBlock__NDNnZ">
                    <div className="Guidelines_socialProfileAvatarWrap__f9xk8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brandAssetUrl(PFP_BY_COLOR[profileColor] ?? PFP_BY_COLOR.Forest)}
                        alt={`Opsis Partners profile picture on ${profileColor}`}
                        className="Guidelines_socialProfileAvatarImage__IkUDP"
                      />
                    </div>
                    <div className="Guidelines_socialProfileColorPicker__OpWQD">
                      {brand.applications.social.profileColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`Guidelines_socialProfileColorTab__2D3oU${
                            profileColor === color
                              ? " Guidelines_socialProfileColorTabActive__4DQCC"
                              : ""
                          }`}
                          onClick={() => setProfileColor(color)}
                        >
                          <span className="Guidelines_socialProfileColorLabel__IHxqO">
                            {color}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="campaign-applications" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.applications.brandInUse.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">
                  {brand.applications.brandInUse.body}
                </p>
              </div>
              <ImageCarousel images={brand.applications.brandInUse.images} />
            </section>

            <section id="stationery" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.applications.material.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">
                  {brand.applications.material.body}
                </p>
              </div>
              <ImageCarousel images={brand.applications.material.images} />
            </section>

            <section id="recognition" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.applications.recognition.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">
                  {brand.applications.recognition.body}
                </p>
              </div>
              <div className="Guidelines_frame__9X4Dv">
                <BrandResponsiveImage
                  baseName={brand.applications.recognition.image.baseName}
                  alt={brand.applications.recognition.image.alt}
                  className="Guidelines_imageFill__leSLX"
                />
              </div>
            </section>

            <section id="exports" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.exports.title} />
              {brand.exports.groups.map((group) => (
                <div key={group.title} className="Guidelines_exportGroup__iBFD_">
                  <h3 className="Guidelines_exportGroupTitle__ycfL_">{group.title}</h3>
                  <ul
                    className={
                      group.title === "App icons"
                        ? "Guidelines_exportsAppIconsGrid__Ccdfr"
                        : group.title === "Applications"
                          ? "Guidelines_exportsGridThreeCol__ZHvC9"
                          : "Guidelines_exportsGrid__E8mCy"
                    }
                  >
                    {group.assets.map((asset) => (
                      <li key={asset.path} className="Guidelines_exportCard__pkq7T">
                        <div
                          className={`Guidelines_exportPreview__GxNYZ${
                            asset.variant === "pfp"
                              ? " Guidelines_exportPreviewPfp__E7Y3Q"
                              : asset.variant === "appIcon"
                                ? " Guidelines_exportPreviewAppIcon__Ohe0_"
                                : asset.variant === "banner"
                                  ? " Guidelines_exportPreviewBannerLinkedin__f26bM"
                                  : asset.variant === "application"
                                    ? " Guidelines_exportPreviewWide__zi5k4"
                                    : " Guidelines_exportPreviewLogotype__nghS9"
                          }`}
                        >
                          {asset.path.endsWith(".svg") ||
                          asset.path.endsWith(".png") ||
                          asset.path.endsWith(".ico") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={brandAssetUrl(asset.path)}
                              alt=""
                              className="Guidelines_exportImage__1FBec"
                            />
                          ) : null}
                        </div>
                        <span className="Guidelines_exportLabel__j59dY">{asset.label}</span>
                        <div className="Guidelines_exportActionsRow__6kZ7n">
                          <a
                            href={brandAssetUrl(asset.path)}
                            download
                            className="Guidelines_exportActionButton__hSwNa"
                            aria-label={`Download ${asset.label}`}
                          >
                            <IconDownload className="Guidelines_exportActionIcon__DUect" />
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </div>

          <footer className="PageShell_mainFooter__miTAm">
            <p className="PageShell_mainFooterText__uNa6N">{brand.footerCredit}</p>
            <p className="PageShell_mainFooterDisclaimer__l6_T_">
              Guidelines are confidential to the brand owner.
            </p>
          </footer>
        </div>
      </div>
      </div>
    </div>
  );
}
