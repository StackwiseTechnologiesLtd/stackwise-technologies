"use client";

import { useState } from "react";

export default function CopyCommand({
  value,
  copyLabel,
  copiedLabel,
  className = "",
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-left font-mono text-sm text-muted transition-colors hover:bg-white/5 ${className}`}
      aria-label={copied ? copiedLabel : copyLabel}
    >
      <span className="text-muted/70">$</span>
      <span className="min-w-0 flex-1 truncate text-foreground">{value}</span>
      <span className="shrink-0 text-xs text-muted" aria-hidden="true">
        {copied ? (
          copiedLabel
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </span>
    </button>
  );
}
