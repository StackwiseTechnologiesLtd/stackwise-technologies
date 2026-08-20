"use client";

import { useState } from "react";
import type { SiteCopy } from "@/lib/content";

export default function ProviderTabs({ copy }: { copy: SiteCopy["providers"] }) {
  const [active, setActive] = useState(copy.tabs[0]?.id ?? "product");

  return (
    <div className="mt-8">
      <ul className="flex flex-wrap gap-2">
        {copy.tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => setActive(tab.id)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  selected
                    ? "bg-white text-black"
                    : "border border-white/10 text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
        {copy.usage}
      </p>
    </div>
  );
}
