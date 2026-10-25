"use client";

import { useState } from "react";
import type { BrandColorSwatch } from "@/lib/branding/types";
import { swatchCardProps } from "@/lib/branding/swatch-style";
import { IconCopy } from "./brand-icons";

function SwatchValueRow({
  label,
  value,
  copyLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      className={`Guidelines_swatchValueRow__uqpXK${copied ? " Guidelines_swatchValueRowCopied___Z11X" : ""}`}
      aria-label={copyLabel}
      onClick={() => void onCopy()}
    >
      <span className="Guidelines_swatchValueLabel__0BtPE">{label}</span>
      <span className="Guidelines_swatchValueText__HioaT" aria-live="polite">
        {value}
      </span>
      <span className="Guidelines_swatchValueIcon__H4Qn7" aria-hidden>
        <IconCopy size={12} strokeWidth={1.8} />
      </span>
    </button>
  );
}

export function ColorPaletteGrid({ swatches }: { swatches: BrandColorSwatch[] }) {
  const count = swatches.length;

  return (
    <div
      className="Guidelines_frame__9X4Dv Guidelines_frameBorderless__9sdyQ Guidelines_colorPaletteFrame__9TB_G"
    >
      <div
        className="Guidelines_swatchGrid__G1Rjv"
        data-count={String(count)}
        data-layout={count === 5 ? "2-3" : undefined}
      >
        {swatches.map((swatch) => {
          const { style, tone } = swatchCardProps(swatch.hex);
          const hexDisplay = swatch.hex.startsWith("#")
            ? swatch.hex
            : `#${swatch.hex}`;

          return (
            <div
              key={swatch.name}
              className="Guidelines_swatchCard__Zx1vV"
              style={style}
              data-tone={tone}
            >
              <p className="Guidelines_swatchName__fs2bk">{swatch.name}</p>
              <div className="Guidelines_swatchValues__UaRjv">
                <SwatchValueRow
                  label="HEX"
                  value={hexDisplay}
                  copyLabel={`Copy HEX: ${hexDisplay}`}
                />
                <SwatchValueRow
                  label="RGB"
                  value={swatch.rgb}
                  copyLabel={`Copy RGB: ${swatch.rgb}`}
                />
                <SwatchValueRow
                  label="CMYK"
                  value={swatch.cmyk}
                  copyLabel={`Copy CMYK: ${swatch.cmyk}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
