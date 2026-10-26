"use client";

import type { BrandGuidelines } from "@/lib/branding/types";
import { brandAssetUrl } from "@/lib/branding/asset-url";
import { avifSrcSet } from "./brand-media";
import { AssetActionBar } from "./asset-action-bar";

const PROFILE_BG: Record<string, string> = {
  Forest: "#131D18",
  Earth: "#2C1E19",
  Paper: "#DDDAD5",
  Black: "#000000",
  White: "#FFFFFF",
};

const PFP_SVG: Record<string, string> = {
  Forest: "exports/profile-pictures/opsis-pfp-on-green.svg",
  Earth: "exports/profile-pictures/opsis-pfp-on-brown.svg",
  Paper: "exports/profile-pictures/opsis-pfp-on-paper.svg",
  Black: "exports/profile-pictures/opsis-pfp-on-black.svg",
  White: "exports/profile-pictures/opsis-pfp-on-white.svg",
};

const PFP_PNG: Record<string, string> = {
  Forest: "exports/profile-pictures/opsis-pfp-on-green.png",
  Earth: "exports/profile-pictures/opsis-pfp-on-brown.png",
  Paper: "exports/profile-pictures/opsis-pfp-on-paper.png",
  Black: "exports/profile-pictures/opsis-pfp-on-black.png",
  White: "exports/profile-pictures/opsis-pfp-on-white.png",
};

export function SocialProfileMockup({
  brandSlug,
  social,
  profileColor,
  onProfileColorChange,
}: {
  brandSlug: string;
  social: BrandGuidelines["applications"]["social"];
  profileColor: string;
  onProfileColorChange: (color: string) => void;
}) {
  const header = social.linkedinHeader;
  const { src, srcSet, sizes } = avifSrcSet(brandSlug, header.baseName);
  const pfpSvg = PFP_SVG[profileColor] ?? PFP_SVG.Forest;
  const pfpPng = PFP_PNG[profileColor] ?? PFP_PNG.Forest;
  const bg = PROFILE_BG[profileColor] ?? PROFILE_BG.Forest;

  return (
    <div className="Guidelines_socialMediaFrame__qjU65">
      <div className="Guidelines_socialProfileBlock__NDNnZ">
        <div
          className="Guidelines_socialProfileMockup__EsDWT"
          data-layout="linkedin"
        >
          <div
            className="Guidelines_socialProfileHeaderMedia___I9jB"
            style={{ aspectRatio: "3046 / 516" }}
          >
            <AssetActionBar
              brandSlug={brandSlug}
              ariaLabel={`Choose format for ${header.alt}`}
              downloadPath="exports/applications/opsis-linkedin-header.png"
              formats={[
                { value: "png", label: "PNG" },
                { value: "avif", label: "AVIF" },
              ]}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              srcSet={srcSet}
              sizes={sizes}
              alt={header.alt}
              width={3046}
              height={516}
              decoding="async"
              loading="eager"
              className="Guidelines_socialProfileBannerImage__JT9xy"
              style={{
                aspectRatio: "3046 / 516",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
          </div>
          <div className="Guidelines_socialProfileAvatarWrap__f9xk8">
            <div
              className="Guidelines_socialProfileAvatar__sDiWv"
              style={{ backgroundColor: bg }}
            >
              <AssetActionBar
                brandSlug={brandSlug}
                ariaLabel={`Choose format for Profile picture ${profileColor}`}
                downloadPath={pfpPng}
                formats={[
                  { value: "png", label: "PNG" },
                  { value: "svg", label: "SVG" },
                ]}
                onDark
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandAssetUrl(brandSlug, pfpSvg)}
                alt={`Opsis Partners profile picture on ${profileColor}`}
                width={172}
                height={172}
                decoding="async"
                loading="eager"
                className="Guidelines_socialProfileAvatarImage__IkUDP"
                style={{
                  aspectRatio: "172 / 172",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              />
            </div>
            <div
              className="Guidelines_socialProfileColorPicker__OpWQD"
              role="radiogroup"
              aria-label="Profile picture background"
            >
              {social.profileColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={profileColor === color}
                  tabIndex={profileColor === color ? 0 : -1}
                  className={`Guidelines_socialProfileColorTab__2D3oU${
                    profileColor === color
                      ? " Guidelines_socialProfileColorTabActive__4DQCC"
                      : ""
                  }`}
                  onClick={() => onProfileColorChange(color)}
                >
                  <span
                    className="Guidelines_socialProfileColorDot__B74o7"
                    style={{ backgroundColor: PROFILE_BG[color] }}
                    aria-hidden
                  />
                  <span className="Guidelines_socialProfileColorLabel__IHxqO">
                    {color}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
