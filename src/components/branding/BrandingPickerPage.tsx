import Link from "next/link";
import type { BrandGuidelines } from "@/lib/branding/types";
import type { BrandingViewer } from "@/lib/branding-portal/access";
import { brandAssetUrl, brandStorageOf } from "@/lib/branding/asset-url";
import "@/styles/brand-guidelines/branding-picker.css";

type BrandingPickerPageProps = {
  brands: BrandGuidelines[];
  viewer: BrandingViewer;
};

function previewImageProps(brand: BrandGuidelines) {
  const base = brand.introduction.heroImage.baseName;
  const slug = brand.slug;
  const storage = brandStorageOf(brand);
  return {
    src: brandAssetUrl(slug, `${base}.avif`, storage),
    srcSet: [
      `${brandAssetUrl(slug, `${base}-800.avif`, storage)} 800w`,
      `${brandAssetUrl(slug, `${base}-1600.avif`, storage)} 1600w`,
      `${brandAssetUrl(slug, `${base}.avif`, storage)} 3200w`,
    ].join(", "),
    sizes: "(max-width: 719px) 100vw, 58vw",
  };
}

export function BrandingPickerPage({ brands, viewer }: BrandingPickerPageProps) {
  const isAdmin = viewer.mode === "admin";
  const visibleBrands =
    viewer.mode === "portal"
      ? brands.filter((b) => b.slug === viewer.brandSlug)
      : brands;

  return (
    <main className="branding-picker">
      <div className="branding-picker__shell">
        <header className="branding-picker__header">
          <p className="branding-picker__eyebrow">Stackwise Technologies</p>
          <h1 className="branding-picker__title">
            {isAdmin ? "Brand guidelines preview" : "Your brand guidelines"}
          </h1>
          <p className="branding-picker__lead">
            {isAdmin
              ? "Choose a client system to open. You are signed in as admin — no separate portal login required."
              : "Open your project guidelines and export assets."}
          </p>
          <p className="branding-picker__meta">
            {isAdmin ? (
              <>
                Signed in as {viewer.email} ·{" "}
                <Link href="/admin/brand-portal">Manage customer access</Link>
              </>
            ) : (
              <>Signed in as {viewer.email}</>
            )}
          </p>
        </header>

        <div className="branding-picker__grid">
          {visibleBrands.map((brand, index) => {
            const preview = previewImageProps(brand);
            return (
              <Link
                key={brand.slug}
                href={`/branding/${brand.slug}`}
                className={`branding-picker__card branding-picker__card--link ${
                  index === 0 ? "branding-picker__card--hero" : "branding-picker__card--side"
                }`}
              >
                <div className="branding-picker__card-media" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.src}
                    srcSet={preview.srcSet}
                    sizes={preview.sizes}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="branding-picker__card-scrim" aria-hidden />
                <div className="branding-picker__card-body">
                  {isAdmin ? (
                    <span className="branding-picker__card-label">Client system</span>
                  ) : null}
                  <h2 className="branding-picker__card-title">{brand.name}</h2>
                  <p className="branding-picker__card-desc">{brand.heroSubtitle}</p>
                </div>
              </Link>
            );
          })}

          {isAdmin ? (
            <div
              className="branding-picker__card branding-picker__card--info branding-picker__card--access"
            >
              <div className="branding-picker__card-body">
                <h2 className="branding-picker__card-title">Customer access</h2>
                <p>
                  Invite clients under Admin → Brand access. They only see their project; you can
                  preview any system here.
                </p>
                <p className="branding-picker__card-link">
                  <Link href="/admin/brand-portal">Open brand access →</Link>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
