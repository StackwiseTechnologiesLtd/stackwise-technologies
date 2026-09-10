"use client";

// import { useState } from "react";
import type { SiteCopy } from "@/lib/content";

// const stacksByTab: Record<string, string[]> = {
//   product: ["Next.js", "React", "TypeScript", "Tailwind", "UI/UX"],
//   platform: ["Node.js", "Python", "Go", "Postgres", "Redis", "GraphQL"],
//   ai: ["OpenAI", "Anthropic", "LangChain", "RAG", "Agents"],
//   cloud: ["AWS", "GCP", "Docker", "Kubernetes", "CI/CD"],
// };

export default function ProviderTabs({
  copy,
}: {
  copy: SiteCopy["providers"];
}) {
  // const [active, setActive] = useState(copy.tabs[0]?.id ?? "product");
  // const stack = stacksByTab[active] ?? stacksByTab.product;

  return (
    <div className="mt-8">
      {/* <ul className="flex flex-wrap gap-2">
        {copy.tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => setActive(tab.id)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${selected
                    ? "bg-white text-black"
                    : "border border-white/10 text-muted hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul> */}
      <ul className="mt-5 flex flex-wrap gap-2">
        <li className="flex flex-row items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-sm text-foreground">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4 shrink-0 fill-[#3178C6]"
          >
            <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z" />
          </svg>
          TypeScript
        </li>
        <li className="flex flex-row items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-sm text-foreground">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4 shrink-0 fill-[#F7DF1E]"
          >
            <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"></path>
          </svg>
          JavaScript
        </li>
        <li className="flex flex-row items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-sm text-foreground">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4 shrink-0 fill-[#00599C]"
          >
            <path d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.34.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.11c-3.92 0-7.109-3.19-7.109-7.11 0-3.92 3.19-7.11 7.11-7.11a7.133 7.133 0 016.156 3.553l-3.076 1.78a3.567 3.567 0 00-3.08-1.78A3.56 3.56 0 008.444 12 3.56 3.56 0 0012 15.555a3.57 3.57 0 003.08-1.778l3.078 1.78A7.135 7.135 0 0112 19.11zm7.11-6.715h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79zm2.962 0h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79z"></path>
          </svg>
          C/C++
        </li>
        <li className="flex flex-row items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-sm text-foreground">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4 shrink-0 stroke-[#a1a1aa]"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path>
          </svg>
          SQL
        </li>
      </ul>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
        {copy.usage}
      </p>
    </div>
  );
}
