"use client";

import type { BrandImageSet } from "@/lib/branding/types";
import { BrandImageFrame } from "./brand-ui-parts";

export function ApplicationImageStack({
  images,
}: {
  images: BrandImageSet[];
}) {
  return (
    <div className="Guidelines_imageStack__0wBWj">
      {images.map((img) => (
        <BrandImageFrame
          key={img.baseName}
          baseName={img.baseName}
          alt={img.alt}
          downloadBasePath={`exports/applications/${img.baseName}.png`}
        />
      ))}
    </div>
  );
}

export function ApplicationHeroImage({
  image,
}: {
  image: BrandImageSet;
}) {
  return (
    <div className="Guidelines_imageStack__0wBWj">
      <BrandImageFrame
        baseName={image.baseName}
        alt={image.alt}
        downloadBasePath={`exports/applications/${image.baseName}.png`}
      />
    </div>
  );
}
