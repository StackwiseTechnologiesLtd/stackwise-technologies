import type { CSSProperties } from "react";

const P3: Record<string, string> = {
  "#131D18": "color(display-p3 0.0745 0.1137 0.0941)",
  "#2C1E19": "color(display-p3 0.1725 0.1176 0.098)",
  "#DDDAD5": "color(display-p3 0.8667 0.8549 0.8353)",
  "#000000": "color(display-p3 0 0 0)",
  "#FFFFFF": "color(display-p3 1 1 1)",
};

function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62;
}

export function proportionSegmentStyle(
  name: string,
  value: number,
  hex: string,
): CSSProperties {
  const light = isLightHex(hex);
  return {
    "--proportion-fg": light ? "rgba(0, 0, 0, 0.84)" : "rgba(255, 255, 255, 0.92)",
    "--proportion-fg-muted": light
      ? "rgba(0, 0, 0, 0.58)"
      : "rgba(255, 255, 255, 0.72)",
    "--proportion-fg-name": light ? "#000000" : "#ffffff",
    "--proportion": `${value}%`,
    "--brand-color-srgb": hex,
    "--brand-color-p3": P3[hex.toUpperCase()] ?? hex,
  } as CSSProperties;
}
