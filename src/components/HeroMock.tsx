import { launcherItems } from "@/lib/site";

export default function HeroMock() {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-3xl">
      <div className="pointer-events-none absolute -inset-8 rounded-4xl bg-[radial-gradient(ellipse_at_center,rgba(226,75,92,0.12),transparent_70%)]" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_40px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-[11px] text-muted">
            stackwise — delivery
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 font-mono text-sm text-muted">
            <svg
              viewBox="0 0 24 24"
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" />
            </svg>
            Search a capability…
          </div>
          <ul className="space-y-1">
            {launcherItems.map((item, i) => (
              <li
                key={item}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
                  i === 0 ? "bg-accent/15 text-foreground" : "text-muted"
                }`}
              >
                <span className={i === 0 ? "font-medium" : undefined}>{item}</span>
                {i === 0 ? (
                  <span className="font-mono text-[11px] text-accent">↩</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
