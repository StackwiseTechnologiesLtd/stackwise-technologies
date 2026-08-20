"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/content";

const flags: Record<Locale, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
};

const labels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

export default function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const pathname = usePathname();
  const other = locales.find((item) => item !== locale) ?? "en";
  const segments = pathname.split("/");
  segments[1] = other;
  const href = segments.join("/") || `/${other}`;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-white/10"
      aria-label={label}
      hrefLang={other}
    >
      <span aria-hidden="true">{flags[locale]}</span>
      <span className="hidden sm:inline">{labels[locale]}</span>
    </Link>
  );
}
