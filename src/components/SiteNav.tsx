"use client";

import { useState, type ReactNode } from "react";
import Mark from "@/components/Mark";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { CALENDLY_URL, EMAIL, TWITTER_URL, type Locale, type SiteCopy } from "@/lib/content";

function IconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-foreground transition-colors hover:bg-white/10"
    >
      {children}
    </a>
  );
}

export default function SiteNav({
  copy,
  locale,
}: {
  copy: SiteCopy["nav"];
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-3 z-50 px-3 sm:top-4 sm:px-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/80 px-3 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <a href={`/${locale}#home`} className="flex items-center gap-2.5 py-1 pl-1">
          <Mark className="size-8" gradientId="sw-mark-nav" />
          <span className="text-[15px] font-semibold tracking-tight">
            Stackwise
          </span>
          <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
            Ltd
          </span>
        </a>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary"
        >
          {copy.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} label={copy.language} />
          <IconButton href={TWITTER_URL} label={copy.twitter}>
            <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
              <path d="M18.9 2H22l-6.76 7.73L23 22h-6.55l-5.13-6.7L5.7 22H2.68l7.23-8.26L1 2h6.7l4.64 6.13L18.9 2Zm-1.15 18h1.82L6.36 3.88H4.4L17.75 20Z" />
            </svg>
          </IconButton>
          <a
            href={`mailto:${EMAIL}`}
            className="hidden rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10 sm:inline-flex"
          >
            {copy.email}
          </a>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            {copy.book}
          </a>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-white/12 text-foreground lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">
              {open ? copy.closeMenu : copy.openMenu}
            </span>
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="mx-auto mt-2 max-w-6xl rounded-2xl border border-white/10 bg-black/95 p-2 backdrop-blur-xl lg:hidden"
        >
          {copy.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
