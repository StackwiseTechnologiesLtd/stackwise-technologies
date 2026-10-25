import { brandAssetUrl } from "@/lib/branding/asset-url";

export function avifSrcSet(baseName: string): {
  src: string;
  srcSet: string;
  sizes: string;
} {
  return {
    src: brandAssetUrl(`${baseName}.avif`),
    srcSet: [
      `${brandAssetUrl(`${baseName}-800.avif`)} 800w`,
      `${brandAssetUrl(`${baseName}-1600.avif`)} 1600w`,
      `${brandAssetUrl(`${baseName}.avif`)} 3200w`,
    ].join(", "),
    sizes: "(max-width: 950px) 100vw, 950px",
  };
}

export function BrandResponsiveImage({
  baseName,
  alt,
  className,
  priority,
}: {
  baseName: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const { src, srcSet, sizes } = avifSrcSet(baseName);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand guidelines mirror static Kargul layout
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
    />
  );
}
