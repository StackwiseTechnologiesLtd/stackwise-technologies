import type { Locale, SiteCopy } from "@/lib/content";
import { launcherItemsFor } from "@/lib/content";

export default function HeroMock({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Pick<
    SiteCopy["hero"],
    "mockTitle" | "searchPlaceholder" | "pinnedLabel" | "callouts"
  >;
}) {
  const items = launcherItemsFor(locale);
  const [a, b, c, d] = copy.callouts;

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="pointer-events-none absolute -inset-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(226,75,92,0.22),transparent_65%)]" />

      {a ? (
        <div className="absolute -left-2 top-8 z-20 hidden w-44 rounded-2xl border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-md sm:block lg:-left-8">
          <p className="text-[11px] font-semibold text-accent">{a.title}</p>
          <p className="mt-1 text-[11px] leading-snug text-muted">{a.body}</p>
        </div>
      ) : null}

      {b ? (
        <div className="absolute -right-1 top-2 z-20 hidden w-48 rounded-2xl border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-md sm:block lg:-right-6 lg:top-0">
          <p className="text-[11px] font-semibold text-foreground">{b.title}</p>
          <p className="mt-1 text-[11px] leading-snug text-muted">{b.body}</p>
        </div>
      ) : null}

      {c ? (
        <div className="absolute -right-2 bottom-24 z-20 hidden w-48 rounded-2xl border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-md sm:block lg:-right-10">
          <p className="text-[11px] font-semibold text-foreground">{c.title}</p>
          <p className="mt-1 text-[11px] leading-snug text-muted">{c.body}</p>
          <div className="mt-2 h-7 rounded-md border border-dashed border-accent/40 bg-accent/10" />
        </div>
      ) : null}

      {d ? (
        <div className="absolute -left-1 bottom-8 z-20 hidden w-44 rounded-2xl border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-md sm:block lg:-left-6">
          <p className="text-[11px] font-semibold text-foreground">{d.title}</p>
          <p className="mt-1 text-[11px] leading-snug text-muted">{d.body}</p>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 shadow-[0_40px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-[11px] text-muted">
            {copy.mockTitle}
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-muted">
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
            {copy.searchPlaceholder}
          </div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            {copy.pinnedLabel}
          </p>
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li
                key={item}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
                  i === 0 ? "bg-accent/15 text-foreground" : "text-muted"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`size-2 rounded-full ${
                      i === 0 ? "bg-accent" : "bg-white/20"
                    }`}
                  />
                  <span className={i === 0 ? "font-medium" : undefined}>
                    {item}
                  </span>
                </span>
                {i === 0 ? (
                  <span className="font-mono text-[11px] text-accent">↩</span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-muted/70">
                    {i % 2 === 0 ? "System" : "Service"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
