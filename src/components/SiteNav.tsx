"use client";

import { useState } from "react";
import Mark from "@/components/Mark";
import { CALENDLY_URL, EMAIL, navLinks } from "@/lib/site";

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-3 z-50 px-3 sm:top-4 sm:px-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/80 px-3 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-3">
        <a href="#home" className="flex items-center gap-2.5 py-1 pl-1">
          <Mark className="size-8" gradientId="sw-mark-nav" />
          <span className="text-[15px] font-semibold tracking-tight">
            Stackwise
          </span>
          <span className="hidden rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted sm:inline">
            Ltd
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
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
          <a
            href={`mailto:${EMAIL}`}
            className="hidden rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10 sm:inline-flex"
          >
            Email us
          </a>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Book a call
          </a>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-white/12 text-foreground md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
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
          className="mx-auto mt-2 max-w-6xl rounded-2xl border border-white/10 bg-black/95 p-2 backdrop-blur-xl md:hidden"
        >
          {navLinks.map((link) => (
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
