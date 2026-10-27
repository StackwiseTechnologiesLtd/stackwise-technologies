"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  brandAssetUrl,
  brandPreviewSrcSet,
  brandPreviewUrl,
} from "@/lib/branding/asset-url";
import type { BrandExportAsset, BrandTypeScaleRow } from "@/lib/branding/types";
import { IconDownload } from "./brand-icons";
import { BrandResponsiveImage } from "./brand-media";
import {
  AssetActionBar,
  type AssetFormatOption,
} from "./asset-action-bar";

export type { AssetActionBarProps, AssetFormatOption } from "./asset-action-bar";
export { AssetActionBar };

export function BrandImageFrame({
  brandSlug,
  baseName,
  alt,
  downloadBasePath,
  formats = [
    { value: "png", label: "PNG" },
    { value: "avif", label: "AVIF" },
  ],
  priority,
}: {
  brandSlug: string;
  baseName: string;
  alt: string;
  downloadBasePath: string;
  formats?: AssetFormatOption[];
  priority?: boolean;
}) {
  return (
    <div className="Guidelines_imageStack__0wBWj">
      <div className="Guidelines_frame__9X4Dv Guidelines_frameWithDownload__IUkzI">
        <AssetActionBar
          brandSlug={brandSlug}
          ariaLabel={`Choose format for ${baseName}`}
          downloadPath={downloadBasePath}
          formats={formats}
        />
        <BrandResponsiveImage
          brandSlug={brandSlug}
          baseName={baseName}
          alt={alt}
          priority={priority}
        />
      </div>
    </div>
  );
}

const SCALE_RATIOS = [
  { label: "Minor second", value: 1.067 },
  { label: "Major second", value: 1.125 },
  { label: "Major third", value: 1.25 },
  { label: "Perfect fourth", value: 1.333 },
  { label: "Augmented fourth", value: 1.414 },
  { label: "Perfect fifth", value: 1.5 },
  { label: "Golden ratio", value: 1.618 },
];

export function TypeScalePanel({
  baseDefault,
  ratioDefault,
  rows,
}: {
  baseDefault: number;
  ratioDefault: number;
  rows: BrandTypeScaleRow[];
}) {
  const ratioIndexDefault = Math.max(
    0,
    SCALE_RATIOS.findIndex((r) => Math.abs(r.value - ratioDefault) < 0.01),
  );
  const [base, setBase] = useState(baseDefault);
  const [ratioIndex, setRatioIndex] = useState(ratioIndexDefault);

  const ratio = SCALE_RATIOS[ratioIndex]?.value ?? ratioDefault;
  const baseProgress = ((base - 11) / (23 - 11)) * 100;
  const ratioProgress = (ratioIndex / (SCALE_RATIOS.length - 1)) * 100;

  const scaledRows = useMemo(() => {
    const refBase = baseDefault;
    const refRatio = ratioDefault;
    return rows.map((row, i) => {
      const refSize = parseFloat(row.sampleStyle["--sample-font-size"] ?? "15");
      const stepsFromBody = Math.log(refSize / refBase) / Math.log(refRatio);
      const nextSize = base * Math.pow(ratio, stepsFromBody);
      return {
        ...row,
        meta: row.meta.replace(/[\d.]+px/, `${nextSize.toFixed(1)}px`),
        sizePx: nextSize,
      };
    });
  }, [base, ratio, rows, baseDefault, ratioDefault]);

  return (
    <>
      <div className="TypeScaleGenerator_panel__99sKs">
        <label className="TypeScaleGenerator_row__iQfh_">
          <span className="TypeScaleGenerator_rowLabel__QNDBx">Base</span>
          <span className="TypeScaleGenerator_sliderWrap___GLm7">
            <input
              type="range"
              min={11}
              max={23}
              step={0.5}
              aria-label="Base font size in pixels"
              className="TypeScaleGenerator_slider___Aby2"
              style={{ "--progress": `${baseProgress}%` } as CSSProperties}
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
            />
          </span>
          <span className="TypeScaleGenerator_rowValue__zS29z">
            <input
              type="number"
              min={11}
              max={23}
              step={0.5}
              aria-label="Base font size value"
              className="TypeScaleGenerator_rowValueInput__Xx1Ld"
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
            />
            <span className="TypeScaleGenerator_rowValueUnit__aCy8m">px</span>
          </span>
        </label>
        <label className="TypeScaleGenerator_row__iQfh_">
          <span className="TypeScaleGenerator_rowLabel__QNDBx">Ratio</span>
          <span className="TypeScaleGenerator_sliderWrap___GLm7">
            <span className="TypeScaleGenerator_ticks__486HS" aria-hidden>
              {SCALE_RATIOS.map((_, i) => (
                <span
                  key={i}
                  className={`TypeScaleGenerator_tick__9JSBn${i <= ratioIndex ? " TypeScaleGenerator_tickActive__56aaI" : ""}`}
                />
              ))}
            </span>
            <input
              type="range"
              min={0}
              max={SCALE_RATIOS.length - 1}
              step={1}
              aria-label="Modular scale ratio"
              aria-valuetext={`${SCALE_RATIOS[ratioIndex]?.label}, ${ratio}`}
              className="TypeScaleGenerator_slider___Aby2"
              style={{ "--progress": `${ratioProgress}%` } as CSSProperties}
              value={ratioIndex}
              onChange={(e) => setRatioIndex(Number(e.target.value))}
            />
          </span>
          <span className="TypeScaleGenerator_rowValue__zS29z">
            <span className="TypeScaleGenerator_rowValueNote__DR1d6">
              {SCALE_RATIOS[ratioIndex]?.label}
            </span>
            <input
              type="number"
              min={1}
              max={2}
              step={0.001}
              aria-label="Modular scale ratio value"
              className="TypeScaleGenerator_rowValueInput__Xx1Ld"
              value={ratio}
              readOnly
            />
          </span>
        </label>
      </div>
      <div className="TypeScaleGenerator_generator__m3oVZ">
        <ul className="TypeScaleGenerator_scale__Co_6Y">
          {scaledRows.map((row) => (
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
                style={
                  {
                    ...row.sampleStyle,
                    "--sample-font-size": `${row.sizePx}px`,
                  } as CSSProperties
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function TypographyPreviewStack({
  exposure,
  geist,
  displayFontVar,
  uiFontVar,
  displayPreviewLink = "https://www.205.tf/exposure",
  uiPreviewLink = "https://vercel.com/font",
  displayPreviewLabel = "display",
  uiPreviewLabel = "UI",
  displayPreviewPlaceholder = "Exposure: Quietly in control.",
  uiPreviewPlaceholder = "Geist: Every detail has its place.",
}: {
  exposure: string;
  geist: string;
  displayFontVar: string;
  uiFontVar: string;
  displayPreviewLink?: string;
  uiPreviewLink?: string;
  displayPreviewLabel?: string;
  uiPreviewLabel?: string;
  displayPreviewPlaceholder?: string;
  uiPreviewPlaceholder?: string;
}) {
  return (
    <div className="TypographyPreview_stack__ksyDu">
      <div className="TypographyPreview_group__iqW9q">
        <div className="TypographyPreview_groupActions__sXwcX">
          <a
            href={displayPreviewLink}
            target="_blank"
            rel="noreferrer"
            className="Guidelines_downloadIconButton__HyeQt"
            aria-label={`Explore ${displayPreviewLabel} typeface`}
          >
            <IconDownload className="Guidelines_downloadIconButtonIcon__oRZTC" />
            <span className="sr-only">Explore {displayPreviewLabel} typeface</span>
          </a>
        </div>
        <div className="TypographyPreview_field__yKgIa">
          <textarea
            className="TypographyPreview_input__6Nc_r"
            aria-label={`${displayPreviewLabel} preview · type to try the typeface`}
            placeholder={displayPreviewPlaceholder}
            rows={1}
            spellCheck={false}
            defaultValue={displayPreviewPlaceholder}
            style={
              {
                "--preview-font-family": `var(${displayFontVar})`,
                "--preview-font-size": "36px",
                "--preview-font-weight": "400",
                "--preview-line-height": "1.3",
                "--preview-letter-spacing": "-0.02em",
              } as CSSProperties
            }
          />
        </div>
        <p className="Guidelines_bodyText__C2R9D TypographyPreview_description__IqE3N">
          {exposure}
        </p>
      </div>
      <div className="TypographyPreview_group__iqW9q">
        <div className="TypographyPreview_groupActions__sXwcX">
          <a
            href={uiPreviewLink}
            target="_blank"
            rel="noreferrer"
            className="Guidelines_downloadIconButton__HyeQt"
            aria-label={`Explore ${uiPreviewLabel} typeface`}
          >
            <IconDownload className="Guidelines_downloadIconButtonIcon__oRZTC" />
            <span className="sr-only">Explore {uiPreviewLabel} typeface</span>
          </a>
        </div>
        <div className="TypographyPreview_field__yKgIa">
          <textarea
            className="TypographyPreview_input__6Nc_r"
            aria-label={`${uiPreviewLabel} preview · type to try the typeface`}
            placeholder={uiPreviewPlaceholder}
            rows={1}
            spellCheck={false}
            defaultValue={uiPreviewPlaceholder}
            style={
              {
                "--preview-font-family": `var(${uiFontVar})`,
                "--preview-font-size": "22px",
                "--preview-font-weight": "400",
                "--preview-line-height": "1.35",
              } as CSSProperties
            }
          />
        </div>
        <p className="Guidelines_bodyText__C2R9D TypographyPreview_description__IqE3N">
          {geist}
        </p>
      </div>
    </div>
  );
}

function exportPreviewClasses(asset: BrandExportAsset): string {
  const base = "Guidelines_exportPreview__GxNYZ";
  if (asset.variant === "pfp") return `${base} Guidelines_exportPreviewPfp__E7Y3Q`;
  if (asset.variant === "appIcon")
    return `${base} Guidelines_exportPreviewAppIcon__Ohe0_`;
  if (asset.variant === "banner" || asset.variant === "application")
    return `${base} Guidelines_exportPreviewWide__zi5k4 Guidelines_exportPreviewLight__1696S`;
  if (asset.label === "White" || asset.label === "Black")
    return `${base} Guidelines_exportPreviewDark__33d8C`;
  return `${base} Guidelines_exportPreviewLight__1696S`;
}

function exportImageClass(asset: BrandExportAsset): string {
  if (asset.variant === "pfp") return "Guidelines_exportImagePfp__m_usS";
  if (asset.variant === "appIcon") return "Guidelines_exportImageAppIcon__dkVgO";
  if (asset.variant === "banner" || asset.variant === "application")
    return "Guidelines_exportImageWallpaper__ilb06";
  if (asset.variant === "isotype") return "Guidelines_exportImageMark__hVOI7";
  return "Guidelines_exportImage__1FBec";
}

export function ExportAssetCard({
  brandSlug,
  asset,
}: {
  brandSlug: string;
  asset: BrandExportAsset;
}) {
  const formats =
    asset.path.endsWith(".svg")
      ? [
          { value: "svg", label: "SVG" },
          { value: "png", label: "PNG" },
        ]
      : asset.path.endsWith(".ico")
        ? [{ value: "ico", label: "ICO" }]
        : [
            { value: "png", label: "PNG" },
            { value: "avif", label: "AVIF" },
          ];

  const previewStyle =
    asset.previewAspect != null
      ? ({ "--export-preview-aspect": asset.previewAspect } as CSSProperties)
      : undefined;

  const imageSrc = asset.previewId
    ? brandPreviewUrl(brandSlug, asset.previewId, 800)
    : brandAssetUrl(brandSlug, asset.path);

  return (
    <div className="Guidelines_exportPicker__79uD1">
      <div className="Guidelines_exportCard__pkq7T">
        <div className={exportPreviewClasses(asset)} style={previewStyle}>
          <AssetActionBar
            brandSlug={brandSlug}
            ariaLabel={`Choose format for ${asset.label}`}
            downloadPath={asset.path}
            formats={formats}
            onDark={asset.label === "White"}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            srcSet={
              asset.previewId ? brandPreviewSrcSet(brandSlug, asset.previewId) : undefined
            }
            sizes={
              asset.previewId
                ? "(max-width: 699px) calc(100vw - 48px), (max-width: 1079px) 45vw, 440px"
                : undefined
            }
            alt={asset.previewAlt ?? ""}
            className={exportImageClass(asset)}
            decoding="async"
            loading="lazy"
          />
        </div>
        <span className="Guidelines_exportLabel__j59dY">{asset.label}</span>
      </div>
    </div>
  );
}

export function ExportTypographyRow({
  name,
  sampleStyle,
}: {
  name: string;
  sampleStyle: CSSProperties;
}) {
  return (
    <div className="Guidelines_exportTypographyItem__mv_qO">
      <div className="Guidelines_exportTypographyItemMain__MzWCO">
        <span
          className="Guidelines_exportTypeSampleCompact__J1cue"
          style={sampleStyle}
        >
          Aa
        </span>
        <span className="Guidelines_exportTypographyLabel__JMKq_">{name}</span>
      </div>
    </div>
  );
}

export function VerbalIdentityTables({
  messages,
  principles,
  displayFontVar,
}: {
  messages: { label: string; text: string }[];
  principles: {
    title: string;
    description: string;
    pairs: { say: string; avoid: string }[];
  }[];
  displayFontVar: string;
}) {
  return (
    <div className="VerbalIdentityPreview_preview__gJaEr">
      <section className="VerbalIdentityPreview_messaging__klIpZ">
        <ol className="VerbalIdentityPreview_messages__RhFpR">
          {messages.map((m) => (
            <li key={m.label} className="VerbalIdentityPreview_message__vq4NU">
              <span
                className="TypeScaleGenerator_scaleLevel__3mp0_ VerbalIdentityPreview_tableLabel__A93VI"
              >
                {m.label}
              </span>
              <p
                className="VerbalIdentityPreview_messageText__JXjre"
                style={{ fontFamily: `var(${displayFontVar})` }}
              >
                {m.text}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <ol className="VerbalIdentityPreview_principles__pLN1a">
        {principles.map((p) => (
          <li key={p.title} className="VerbalIdentityPreview_principle__yFU3X">
            <h3 className="VerbalIdentityPreview_principleTitle__XKdwO">
              {p.title}
            </h3>
            <p
              className="Guidelines_bodyText__C2R9D VerbalIdentityPreview_description___Cl5I"
            >
              {p.description}
            </p>
            <div
              className="VerbalIdentityPreview_table__NAOsX"
              role="table"
              aria-label={`${p.title} examples`}
            >
              <div className="VerbalIdentityPreview_tableHeader__prqaz" role="row">
                <div role="columnheader">
                  <span
                    className="TypeScaleGenerator_scaleLevel__3mp0_ VerbalIdentityPreview_tableLabel__A93VI"
                  >
                    Say
                  </span>
                </div>
                <div
                  className="VerbalIdentityPreview_cellRight__mWeBD"
                  role="columnheader"
                >
                  <span
                    className="TypeScaleGenerator_scaleLevel__3mp0_ VerbalIdentityPreview_tableLabel__A93VI"
                  >
                    Avoid
                  </span>
                </div>
              </div>
              {p.pairs.map((pair) => (
                <div
                  key={pair.say}
                  className="VerbalIdentityPreview_tableRow__8TgqP"
                  role="row"
                >
                  <div
                    className="Guidelines_bodyText__C2R9D VerbalIdentityPreview_tableCell__aLOqg VerbalIdentityPreview_sayCell__X9I79"
                    role="cell"
                  >
                    {pair.say}
                  </div>
                  <div
                    className="Guidelines_bodyText__C2R9D VerbalIdentityPreview_tableCell__aLOqg VerbalIdentityPreview_cellRight__mWeBD VerbalIdentityPreview_avoidCell__5_Kuz"
                    role="cell"
                  >
                    {pair.avoid}
                  </div>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function LogotypeScaleBlock({
  brandSlug,
  blackLogotype,
  whiteLogotype,
  sizes,
  body,
}: {
  brandSlug: string;
  blackLogotype: string;
  whiteLogotype: string;
  sizes: number[];
  body: string;
}) {
  return (
    <>
      <div
        className="Guidelines_logotypeScaleFrame__YW05P"
        aria-label="Opsis Partners logotype at web scale sizes"
      >
        <div className="Guidelines_logotypeScaleViewport__dtD04">
          <ul
            className="Guidelines_logotypeScaleList__pbZd5"
            role="img"
            aria-label="Opsis Partners logotype at web scale sizes"
          >
            {sizes.map((px) => (
              <li key={px} className="Guidelines_logotypeScaleRow__gY6ve">
                <div className="Guidelines_logotypeScaleRowScroller__zFkji">
                  <p className="Guidelines_logotypeScaleLabel__Yaz2s">
                    {px}
                    <span className="Guidelines_logotypeScaleLabelUnit__oos_2">
                      px
                    </span>
                  </p>
                  <div className="Guidelines_logotypeScaleLogoCell__P_7X7">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brandAssetUrl(brandSlug, blackLogotype)}
                      alt={`Opsis Partners logotype at ${px} pixels height`}
                      className="Guidelines_logotypeScaleLogo__8sR11"
                      style={{ height: px }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brandAssetUrl(brandSlug, whiteLogotype)}
                      alt=""
                      aria-hidden
                      className="Guidelines_logotypeScaleLogo__8sR11 Guidelines_logotypeScaleLogoDark__c9QtG"
                      style={{ height: px }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div
            className="Guidelines_logotypeScaleSeparators__0DpFd"
            aria-hidden
          >
            {sizes.slice(0, -1).map((px) => (
              <span
                key={px}
                className="Guidelines_logotypeScaleSeparatorRow__yMPab"
                style={{ "--logotype-scale-size": `${px}px` } as CSSProperties}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="Guidelines_body__k1Zwo">
        <p className="Guidelines_bodyText__C2R9D">{body}</p>
      </div>
    </>
  );
}

export function ColorVersionsFrame({
  brandSlug,
  blackOnLight,
  whiteOnDark,
  blackLogotype,
  whiteLogotype,
}: {
  brandSlug: string;
  blackOnLight: string;
  whiteOnDark: string;
  blackLogotype: string;
  whiteLogotype: string;
}) {
  return (
    <div
      className="Guidelines_frame__9X4Dv Guidelines_frameBorderless__9sdyQ Guidelines_colorUsageFrame__bUIoL"
    >
      <div className="Guidelines_gridTwo__igR1j">
        <div className="Guidelines_gridPair__GfyUS">
          <div className="Guidelines_tile__3aEpo Guidelines_tileLight___lU6r">
            <AssetActionBar
              brandSlug={brandSlug}
              ariaLabel="Choose format for opsis-logotype-black.png"
              downloadPath={blackLogotype.replace(/\.svg$/, ".png")}
              formats={[
                { value: "png", label: "PNG" },
                { value: "svg", label: "SVG" },
              ]}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandAssetUrl(brandSlug, blackLogotype)}
              alt="Opsis Partners Black logotype on a light surface"
              className="Guidelines_logoImage__l1lfd Guidelines_logoImageWide__S_DzT"
              style={{
                aspectRatio: "400 / 300",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
          </div>
          <p className="Guidelines_bodyText__C2R9D Guidelines_colorUsageCaption__gNqd_">
            {blackOnLight}
          </p>
        </div>
        <div className="Guidelines_gridPair__GfyUS">
          <div className="Guidelines_tile__3aEpo">
            <AssetActionBar
              brandSlug={brandSlug}
              ariaLabel="Choose format for opsis-logotype-white.png"
              downloadPath={whiteLogotype.replace(/\.svg$/, ".png")}
              formats={[
                { value: "png", label: "PNG" },
                { value: "svg", label: "SVG" },
              ]}
              onDark
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandAssetUrl(brandSlug, whiteLogotype)}
              alt="Opsis Partners White logotype on a dark surface"
              className="Guidelines_logoImage__l1lfd Guidelines_logoImageWide__S_DzT Guidelines_logotypeScaleLogoDark__c9QtG"
              style={{
                aspectRatio: "400 / 300",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
          </div>
          <p className="Guidelines_bodyText__C2R9D Guidelines_colorUsageCaption__gNqd_">
            {whiteOnDark}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SectionArticle({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <article id={id} className="Guidelines_section__GgFag">
      {children}
    </article>
  );
}
