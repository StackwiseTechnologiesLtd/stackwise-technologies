"use client";

import { useState } from "react";

export default function CopyCommand({
  value,
  copyLabel,
  copiedLabel,
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
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
      className="mx-auto flex w-full max-w-xl items-center gap-3 rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-left font-mono text-sm text-muted transition-colors hover:bg-white/6"
      aria-label={copied ? copiedLabel : copyLabel}
    >
      <span className="text-muted/70">$</span>
      <span className="min-w-0 flex-1 truncate text-foreground">{value}</span>
      <span className="shrink-0 text-xs text-muted">
        {copied ? copiedLabel : copyLabel}
      </span>
    </button>
  );
}
