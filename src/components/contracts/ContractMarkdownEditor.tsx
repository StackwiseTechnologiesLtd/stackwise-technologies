"use client";

import { useState } from "react";
import { ContractMarkdownBody } from "@/components/contracts/ContractMarkdownBody";
import { BTN_GHOST } from "@/lib/ui/buttons";

type Tab = "preview" | "source";

export function ContractMarkdownEditor({
  value,
  onChange,
  minHeight = "min-h-[420px]",
}: {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
}) {
  const [tab, setTab] = useState<Tab>("preview");

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-background">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="flex gap-1 rounded-lg bg-panel p-0.5">
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setTab("source")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "source"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Edit source
          </button>
        </div>
        {tab === "source" && (
          <button
            type="button"
            className={`${BTN_GHOST} text-xs`}
            onClick={() => setTab("preview")}
          >
            Done editing
          </button>
        )}
      </div>

      {tab === "preview" ? (
        <div className={`${minHeight} overflow-y-auto p-5 sm:p-6`}>
          {value.trim() ? (
            <ContractMarkdownBody markdown={value} />
          ) : (
            <p className="text-sm text-muted">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${minHeight} w-full resize-y border-0 bg-transparent px-4 py-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-0`}
          spellCheck={false}
        />
      )}
    </div>
  );
}
