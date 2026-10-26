"use client";

import type { BrandImageSet } from "@/lib/branding/types";
import { BrandImageFrame } from "./brand-ui-parts";

export function ApplicationImageStack({
  brandSlug,
  images,
}: {
  brandSlug: string;
  images: BrandImageSet[];
}) {
  return (
    <div className="Guidelines_imageStack__0wBWj">
      {images.map((img) => (
        <BrandImageFrame
          key={img.baseName}
          brandSlug={brandSlug}
          baseName={img.baseName}
          alt={img.alt}
          downloadBasePath={`exports/applications/${img.baseName}.png`}
        />
      ))}
    </div>
  );
}

export function ApplicationHeroImage({
  brandSlug,
  image,
}: {
  brandSlug: string;
  image: BrandImageSet;
}) {
  return (
    <div className="Guidelines_imageStack__0wBWj">
      <BrandImageFrame
        brandSlug={brandSlug}
        baseName={image.baseName}
        alt={image.alt}
        downloadBasePath={`exports/applications/${image.baseName}.png`}
      />
    </div>
  );
}
