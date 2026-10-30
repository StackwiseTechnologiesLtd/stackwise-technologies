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

function gridCountKey(count: number): string {
  if (count <= 0) return "0";
  if (count <= 5) return String(count);
  return "many";
}

export function BrandingPickerPage({ brands, viewer }: BrandingPickerPageProps) {
  const isAdmin = viewer.mode === "admin";
  const visibleBrands =
    viewer.mode === "portal"
      ? brands.filter((b) => b.slug === viewer.brandSlug)
      : brands;
  const countKey = gridCountKey(visibleBrands.length);

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
          <p className="branding-picker__meta">Signed in as {viewer.email}</p>
        </header>

        {visibleBrands.length === 0 ? (
          <p className="branding-picker__empty">
            {isAdmin
              ? "No published brand systems yet. Create one under Admin → Brand guidelines."
              : "No guidelines are available for your account."}
          </p>
        ) : (
          <div
            className="branding-picker__grid branding-picker__grid--brands"
            data-count={countKey}
          >
            {visibleBrands.map((brand) => {
              const preview = previewImageProps(brand);
              return (
                <Link
                  key={brand.slug}
                  href={`/branding/${brand.slug}`}
                  className="branding-picker__card branding-picker__card--link"
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
          </div>
        )}

        {isAdmin ? (
          <footer className="branding-picker__footer">
            <div className="branding-picker__access">
              <div className="branding-picker__access-copy">
                <h2 className="branding-picker__access-title">Customer access</h2>
                <p>
                  Invite clients under Admin → Brand access. They only see their project; you can
                  preview any system above.
                </p>
              </div>
              <div className="branding-picker__access-actions">
                <Link href="/admin/brand-portal" className="branding-picker__access-btn">
                  Manage customer access
                </Link>
                <Link href="/admin/brand-guidelines" className="branding-picker__access-link">
                  Brand guidelines admin
                </Link>
              </div>
            </div>
          </footer>
        ) : null}
      </div>
    </main>
  );
}
