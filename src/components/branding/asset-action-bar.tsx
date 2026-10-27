"use client";

import { useState } from "react";
import { brandAssetUrl } from "@/lib/branding/asset-url";
import { useBrandAssetStorage } from "./brand-asset-context";
import { IconCopy, IconDownload } from "./brand-icons";

export type AssetFormatOption = { value: string; label: string };

function pathForFormat(basePath: string, format: string): string {
  const dot = basePath.lastIndexOf(".");
  if (dot === -1) return `${basePath}.${format}`;
  return `${basePath.slice(0, dot)}.${format}`;
}

export type AssetActionBarProps = {
  brandSlug: string;
  ariaLabel: string;
  downloadPath: string;
  formats: AssetFormatOption[];
  /** Dark frosted bar on dark image tiles */
  onDark?: boolean;
  /** When set, copy is enabled and copies this text */
  copyText?: string;
  copyLabel?: string;
};

/**
 * Universal PNG/SVG (etc.) + copy + download control cluster from Kargul brand guidelines.
 */
export function AssetActionBar({
  brandSlug,
  ariaLabel,
  downloadPath,
  formats,
  onDark,
  copyText,
  copyLabel = "Copy asset",
}: AssetActionBarProps) {
  const storage = useBrandAssetStorage();
  const [format, setFormat] = useState(formats[0]?.value ?? "png");
  const href = brandAssetUrl(brandSlug, pathForFormat(downloadPath, format), storage);
  const fileName = href.split("/").pop() ?? "asset";
  const copyDisabled = !copyText;

  const btnClass = `Guidelines_downloadIconButton__HyeQt${
    onDark ? " Guidelines_downloadIconButtonOnDark__ERqdR" : ""
  }`;

  const onCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`Guidelines_tileActions__UCc8_${
        onDark ? " Guidelines_tileActionsOnDark__bPuao" : ""
      }`}
    >
      <select
        className="Guidelines_assetFormatSelect__0LbNt"
        aria-label={ariaLabel}
        value={format}
        onChange={(e) => setFormat(e.target.value)}
      >
        {formats.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={btnClass}
        aria-disabled={copyDisabled}
        data-copy-disabled={copyDisabled ? "true" : undefined}
        aria-label={
          copyDisabled ? "Download only to maintain P3 color" : copyLabel
        }
        onClick={() => void onCopy()}
      >
        <IconCopy className="Guidelines_downloadIconButtonIcon__oRZTC" />
      </button>
      <a
        href={href}
        download={fileName}
        className={btnClass}
        aria-label={`Download ${fileName}`}
      >
        <IconDownload className="Guidelines_downloadIconButtonIcon__oRZTC" />
      </a>
    </div>
  );
}
