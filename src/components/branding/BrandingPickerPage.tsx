import Link from "next/link";
import type { BrandGuidelines } from "@/lib/branding/types";
import type { BrandingViewer } from "@/lib/branding-portal/access";
import { brandAssetUrl } from "@/lib/branding/asset-url";
import "@/styles/brand-guidelines/branding-picker.css";

type BrandingPickerPageProps = {
  brands: BrandGuidelines[];
  viewer: BrandingViewer;
};

function previewImagePath(brand: BrandGuidelines): string {
  const base = brand.introduction.heroImage.baseName;
  return brandAssetUrl(`${base}.avif`);
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
          {visibleBrands.map((brand, index) => (
            <Link
              key={brand.slug}
              href={`/branding/${brand.slug}`}
              className={`branding-picker__card ${
                index === 0 ? "branding-picker__card--hero" : "branding-picker__card--side"
              }`}
            >
              <div className="branding-picker__card-media" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewImagePath(brand)} alt="" loading="lazy" decoding="async" />
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
          ))}

          {isAdmin ? (
            <div
              className="branding-picker__card branding-picker__card--info branding-picker__card--side"
            >
              <div className="branding-picker__card-body">
                <h2 className="branding-picker__card-title">Customer access</h2>
                <p>
                  Invite clients under Admin → Brand access. They only see their project; you can
                  preview any system here.
                </p>
                <p style={{ marginTop: "0.75rem" }}>
                  <Link href="/admin/brand-portal">Open brand access →</Link>
                </p>
              </div>
            </div>
          ) : null}

          {isAdmin && visibleBrands.length === 1 ? (
            <div
              className="branding-picker__card branding-picker__card--info branding-picker__card--wide"
            >
              <div className="branding-picker__card-body">
                <h2 className="branding-picker__card-title">More systems coming</h2>
                <p>
                  Additional client guidelines will appear in this grid as they are published.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
