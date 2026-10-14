import Image from "next/image";
import type { SiteCopy } from "@/lib/content";

export default function Portfolio({ copy }: { copy: SiteCopy["portfolio"] }) {
  return (
    <section
      id="portfolio"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6"
    >
      <p className="mb-3 text-sm text-muted">{copy.label}</p>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
        {copy.title}
      </h2>
      <p className="mt-4 max-w-2xl text-muted sm:text-lg">{copy.subtitle}</p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {copy.items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel transition-colors hover:border-white/16 hover:bg-panel-hover"
            >
              <div className="relative aspect-[16/10] overflow-hidden border-b border-white/8 bg-[#0a0a0a]">
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">
                  {item.body}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {copy.visitLabel}
                  <span
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  >
                    →
                  </span>
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
