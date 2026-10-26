"use client";

import { brandAssetUrl } from "@/lib/branding/asset-url";

export function avifSrcSet(
  brandSlug: string,
  baseName: string,
): {
  src: string;
  srcSet: string;
  sizes: string;
} {
  return {
    src: brandAssetUrl(brandSlug, `${baseName}.avif`),
    srcSet: [
      `${brandAssetUrl(brandSlug, `${baseName}-800.avif`)} 800w`,
      `${brandAssetUrl(brandSlug, `${baseName}-1600.avif`)} 1600w`,
      `${brandAssetUrl(brandSlug, `${baseName}.avif`)} 3200w`,
    ].join(", "),
    sizes: "(max-width: 950px) 100vw, 950px",
  };
}

export function BrandResponsiveImage({
  brandSlug,
  baseName,
  alt,
  className,
  priority,
  aspectRatio = "3200 / 1801",
  width = 3200,
  height = 1801,
  lightbox = true,
}: {
  brandSlug: string;
  baseName: string;
  alt: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: string;
  width?: number;
  height?: number;
  lightbox?: boolean;
}) {
  const { src, srcSet, sizes } = avifSrcSet(brandSlug, baseName);
  const imgClass = ["Guidelines_imageFill__leSLX", className]
    .filter(Boolean)
    .join(" ");

  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- brand guidelines mirror static Kargul layout
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      className={imgClass}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onLoad={(e) => {
        e.currentTarget.setAttribute("data-ready", "");
      }}
    />
  );

  const slot = (
    <div
      className="Guidelines_imageSlot__tDrQU"
      style={{ aspectRatio }}
    >
      {image}
    </div>
  );

  if (!lightbox) {
    return slot;
  }

  return (
    <button
      type="button"
      className="Guidelines_lightboxTrigger__KB52Y"
      aria-label={`Open ${alt} fullscreen`}
    >
      {slot}
    </button>
  );
}
