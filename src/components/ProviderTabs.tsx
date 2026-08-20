"use client";

import { useState } from "react";
import type { SiteCopy } from "@/lib/content";

const stacksByTab: Record<string, string[]> = {
  product: ["Next.js", "React", "TypeScript", "Tailwind", "UI/UX"],
  platform: ["Node.js", "Python", "Go", "Postgres", "Redis", "GraphQL"],
  ai: ["OpenAI", "Anthropic", "LangChain", "RAG", "Agents"],
  cloud: ["AWS", "GCP", "Docker", "Kubernetes", "CI/CD"],
};

export default function ProviderTabs({ copy }: { copy: SiteCopy["providers"] }) {
  const [active, setActive] = useState(copy.tabs[0]?.id ?? "product");
  const stack = stacksByTab[active] ?? stacksByTab.product;

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
      <ul className="mt-5 flex flex-wrap gap-2">
        {stack.map((item) => (
          <li
            key={item}
            className="rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-sm text-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
        {copy.usage}
      </p>
    </div>
  );
}
