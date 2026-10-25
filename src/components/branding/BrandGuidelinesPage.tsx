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
import { proportionSegmentStyle } from "@/lib/branding/proportion-segment-style";
import { BrandResponsiveImage } from "./brand-media";
import { ColorPaletteGrid } from "./color-palette-grid";
import {
  BrandImageFrame,
  ColorVersionsFrame,
  ExportAssetCard,
  ExportTypographyRow,
  LogotypeScaleBlock,
  SectionArticle,
  TypeScalePanel,
  TypographyPreviewStack,
  VerbalIdentityTables,
} from "./brand-ui-parts";
import { CopyButton } from "./CopyButton";
import {
  IconClipboardCopy,
  IconDownload,
  IconMoon,
  IconPalette,
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
              lightbox={false}
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
    if (typeof document === "undefined") return true;
    const theme = document.documentElement.getAttribute("data-theme");
    return theme !== "light";
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
    document.documentElement.style.colorScheme = next ? "dark" : "light";
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
                <div className="FigmaExportButton_steps__ObkwE">
                  <div>
                    <span>01</span>
                    <p>Copy the brand kit</p>
                  </div>
                  <div>
                    <span>02</span>
                    <p>
                      Open a Figma design file and paste <kbd>⌘ / Ctrl V</kbd>
                    </p>
                  </div>
                </div>
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

            <SectionArticle id="brand-context">
              <SectionHeader title={brand.introduction.title} />
              <BrandImageFrame
                baseName={brand.introduction.heroImage.baseName}
                alt={brand.introduction.heroImage.alt}
                downloadBasePath="exports/applications/opsis-introduction.png"
                priority
              />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">{brand.introduction.body}</p>
              </div>
            </SectionArticle>

            <SectionArticle id="marks">
              <SectionHeader title={brand.marks.logotypeScale.title} />
              <LogotypeScaleBlock
                sizes={brand.marks.logotypeScale.sizes}
                body={brand.marks.logotypeScale.body}
              />
            </SectionArticle>

            <SectionArticle id="mark-colors">
              <SectionHeader title={brand.marks.colorVersions.title} />
              <ColorVersionsFrame
                blackOnLight={brand.marks.colorVersions.blackOnLight}
                whiteOnDark={brand.marks.colorVersions.whiteOnDark}
                blackLogotype={brand.marks.colorVersions.blackLogotype}
                whiteLogotype={brand.marks.colorVersions.whiteLogotype}
              />
            </SectionArticle>

            <SectionArticle id="color-palette">
              <SectionHeader
                title={brand.colors.palette.title}
                action={
                  <div className="Guidelines_headerActionGroup__JwdAG">
                    <CopyButton
                      text={paletteCopyText}
                      label="Copy Core palette tokens"
                      className="Guidelines_downloadIconButton__HyeQt"
                      iconClassName="Guidelines_downloadIconButtonIcon__oRZTC"
                    />
                    <button
                      type="button"
                      className="Guidelines_downloadIconButton__HyeQt"
                      aria-label="Copy palette for Figma"
                      onClick={() =>
                        void navigator.clipboard.writeText(figmaCopyText)
                      }
                    >
                      <IconPalette className="Guidelines_downloadIconButtonIcon__oRZTC" />
                    </button>
                  </div>
                }
              />
              <ColorPaletteGrid swatches={brand.colors.palette.swatches} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">{brand.colors.palette.body}</p>
              </div>
            </SectionArticle>

            <section id="color-proportions" className="Guidelines_section__GgFag">
              <SectionHeader title={brand.colors.proportions.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">
                  {brand.colors.proportions.body}
                </p>
              </div>
              <div className="Guidelines_proportionsFrame__3B5OW">
                <div className="Guidelines_proportionsBar__iS_pA">
                  {brand.colors.proportions.bars.map((bar) => {
                    const swatch = brand.colors.palette.swatches.find(
                      (s) => s.name === bar.name,
                    );
                    const hex = swatch?.hex ?? "#131D18";
                    return (
                      <div
                        key={bar.name}
                        className="Guidelines_proportionsBarSegment__Gprle"
                        style={proportionSegmentStyle(bar.name, bar.value, hex)}
                      >
                        <p className="Guidelines_proportionsBarName__1IzZY">
                          {bar.name}
                        </p>
                        <p className="Guidelines_proportionsBarValue__Qfcig">
                          {bar.value}%
                        </p>
                      </div>
                    );
                  })}
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

            <SectionArticle id="typography">
              <SectionHeader title={brand.typography.typeSystem.title} />
              <TypographyPreviewStack
                exposure={brand.typography.typeSystem.exposure}
                geist={brand.typography.typeSystem.geist}
              />
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
            </SectionArticle>

            <SectionArticle id="type-scale">
              <SectionHeader title={brand.typography.typeScale.title} />
              <div className="Guidelines_body__k1Zwo">
                <p className="Guidelines_bodyText__C2R9D">
                  {brand.typography.typeScale.intro}
                </p>
              </div>
              <TypeScalePanel
                baseDefault={brand.typography.typeScale.baseDefault}
                ratioDefault={brand.typography.typeScale.ratioDefault}
                rows={brand.typography.typeScale.rows}
              />
            </SectionArticle>

            <SectionArticle id="tone-of-voice">
              <SectionHeader
                title={brand.tone.title}
                action={
                  <CopyButton
                    text={brand.tone.messages
                      .map((m) => `${m.label}\n${m.text}`)
                      .join("\n\n")}
                    label="Copy Tone of voice"
                  />
                }
              />
              <div className="Guidelines_body__k1Zwo Guidelines_verbalIdentityBody__R09AK">
                <p className="Guidelines_bodyText__C2R9D">{brand.tone.intro}</p>
              </div>
              <VerbalIdentityTables
                messages={brand.tone.messages}
                principles={brand.tone.principles}
              />
            </SectionArticle>

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
                      aspectRatio="3046 / 516"
                      width={3046}
                      height={516}
                      lightbox={false}
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
                  priority
                />
              </div>
            </section>

            <SectionArticle id="exports">
              <SectionHeader title={brand.exports.title} />
              {brand.exports.groups.map((group) => (
                <div key={group.title} className="Guidelines_exportGroup__iBFD_">
                  <h3 className="Guidelines_exportGroupTitle__ycfL_">{group.title}</h3>
                  {group.title === "Typography" ? (
                    <div className="Guidelines_exportsWallpaperGrid__LO_F5">
                      <ExportTypographyRow
                        name="Exposure 0"
                        sampleStyle={{
                          fontFamily: "var(--font-opsis-exposure)",
                          fontSize: "48px",
                        }}
                      />
                      <ExportTypographyRow
                        name="Geist"
                        sampleStyle={{
                          fontFamily: "var(--font-geist-sans)",
                          fontSize: "48px",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={
                        group.title === "App icons"
                          ? "Guidelines_exportsAppIconsGrid__Ccdfr"
                          : group.title === "Applications"
                            ? "Guidelines_exportsGridThreeCol__ZHvC9"
                            : "Guidelines_exportsGrid__E8mCy"
                      }
                      style={
                        group.title === "Isotype" ||
                        group.title === "Logotype" ||
                        group.title === "Profile pictures"
                          ? ({ "--export-columns": 5 } as CSSProperties)
                          : undefined
                      }
                    >
                      {group.assets.map((asset) => (
                        <ExportAssetCard key={asset.path} asset={asset} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </SectionArticle>
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
