import type { ReactNode } from "react";

function Frame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-52 flex-col bg-[#070707]">
      <div className="flex items-center gap-1.5 border-b border-white/8 px-3 py-2">
        <span className="size-1.5 rounded-full bg-white/20" />
        <span className="size-1.5 rounded-full bg-white/20" />
        <span className="size-1.5 rounded-full bg-white/20" />
        <span className="ml-2 font-mono text-[10px] text-muted">{title}</span>
      </div>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </div>
  );
}

const visuals = [
  function Widgets() {
    return (
      <Frame title="ops">
        <div className="grid h-full grid-cols-3 gap-2">
          {["CPU", "Mem", "Disk"].map((label, i) => (
            <div
              key={label}
              className="flex flex-col justify-between rounded-lg border border-white/8 bg-white/3 p-2"
            >
              <span className="text-[10px] text-muted">{label}</span>
              <span className="text-lg font-semibold">{[24, 61, 38][i]}%</span>
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${[24, 61, 38][i]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Frame>
    );
  },
  function Markup() {
    return (
      <Frame title="design">
        <div className="relative h-full overflow-hidden rounded-lg bg-gradient-to-br from-white/10 to-accent/20">
          <div className="absolute left-4 top-4 size-8 rounded-full border-2 border-accent" />
          <div className="absolute bottom-6 right-6 h-8 w-24 rounded-md bg-accent/80" />
          <div className="absolute left-10 top-16 h-px w-20 bg-accent" />
        </div>
      </Frame>
    );
  },
  function Windows() {
    return (
      <Frame title="switcher">
        <div className="grid h-full grid-cols-3 gap-2">
          {["01", "02", "03"].map((n, i) => (
            <div
              key={n}
              className={`flex flex-col rounded-lg border p-2 ${
                i === 1
                  ? "border-accent/40 bg-accent/15"
                  : "border-white/8 bg-white/3"
              }`}
            >
              <span className="font-mono text-[10px] text-muted">{n}</span>
              <div className="mt-2 h-full rounded bg-white/8" />
            </div>
          ))}
        </div>
      </Frame>
    );
  },
  function Chat() {
    return (
      <Frame title="product">
        <div className="flex h-full flex-col gap-2">
          <div className="self-start rounded-lg bg-white/8 px-2 py-1 text-[11px] text-muted">
            Status of the billing cutover?
          </div>
          <div className="self-end rounded-lg bg-accent/20 px-2 py-1 text-[11px]">
            Shipped to staging. Tests green.
          </div>
          <div className="mt-auto h-7 rounded-md border border-white/10 bg-black/40" />
        </div>
      </Frame>
    );
  },
  function Agents() {
    return (
      <Frame title="agent">
        <ol className="space-y-2 font-mono text-[11px] text-muted">
          <li className="text-foreground">1. Plan the cutover</li>
          <li>2. Call the billing API</li>
          <li>3. Write the runbook</li>
          <li className="text-accent">→ done</li>
        </ol>
      </Frame>
    );
  },
  function Terminal() {
    return (
      <Frame title="term">
        <pre className="font-mono text-[11px] leading-5 text-muted">
          {`$ deploy --env prod
> building…
> pushing image
> healthy`}
        </pre>
      </Frame>
    );
  },
  function QuickFix() {
    return (
      <Frame title="review">
        <p className="text-[11px] leading-5 text-muted">
          The invoice{" "}
          <span className="bg-accent/30 text-foreground">fails after retry</span>{" "}
          when the card is expired.
        </p>
        <p className="mt-3 text-[11px] leading-5 text-foreground">
          The invoice{" "}
          <span className="underline decoration-accent">surfaces a recovery
          flow</span>{" "}
          when the card is expired.
        </p>
      </Frame>
    );
  },
  function Keys() {
    return (
      <Frame title="hotkey">
        <div className="flex h-full items-center justify-center gap-2">
          <kbd className="rounded-lg border border-white/15 bg-white/8 px-3 py-2 font-mono text-sm">
            ⌘
          </kbd>
          <span className="text-muted">+</span>
          <kbd className="rounded-lg border border-white/15 bg-white/8 px-3 py-2 font-mono text-sm">
            ⌘
          </kbd>
        </div>
      </Frame>
    );
  },
];

export default function WorkVisual({ index }: { index: number }) {
  const Visual = visuals[index] ?? visuals[0];
  return <Visual />;
}
