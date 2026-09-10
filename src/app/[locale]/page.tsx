import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Landing from "@/components/Landing";
import SiteNav from "@/components/SiteNav";
import {
  getCopy,
  isLocale,
  locales,
  type Locale,
} from "@/lib/content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const copy = getCopy(raw);
  return {
    title: copy.meta.title,
    description: copy.meta.description,
    alternates: {
      languages: {
        en: "/en",
        fr: "/fr",
      },
    },
  };
}

export default async function LocaleHome({ params }: PageProps) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = getCopy(locale);

  return (
    <>
      <SiteNav copy={copy.nav} locale={locale} />
      <Landing locale={locale} copy={copy} />
      <Footer copy={copy.footer} />
    </>
  );
}
