import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/lib/content";
import "../../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: [
    {
      rel: "icon",
      type: "image/svg+xml",
      url: "/favicon.svg",
    },
  ],
  title: "Stackwise Technologies LTD | Your Engineering Partner for Product Development",
  description:
    "Stackwise Technologies Ltd is your trusted engineering partner for product development. We specialize in custom platforms, AI systems, cloud infrastructure, dedicated teams, and the essential work that drives business delivery.",
  openGraph: {
    title: "Stackwise Technologies LTD | Your Engineering Partner for Product Development",
    description:
      "Stackwise Technologies Ltd is your trusted engineering partner for product development. We specialize in custom platforms, AI systems, cloud infrastructure, dedicated teams, and the essential work that drives business delivery.",
    url: "https://stackwisetechnologies.com",
    siteName: "Stackwise Technologies Ltd",
    images: [
      {
        url: "/images/og-landing-1200x630.png",
        width: 1200,
        height: 630,
      },
      {
        url: "/images/og-landing-1200x1200.png",
        width: 1200,
        height: 1200,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stackwise Technologies LTD | Your Engineering Partner for Product Development",
    description:
      "Stackwise Technologies Ltd is your trusted engineering partner for product development. We specialize in custom platforms, AI systems, cloud infrastructure, dedicated teams, and the essential work that drives business delivery.",
    images: ["/image/og-landing-1200x630.png"],
  },

  keywords: [
    "Stackwise Technologies",
    "Engineering Partner",
    "Product Development",
    "Custom Platforms",
    "AI Systems",
    "Cloud Infrastructure",
    "Dedicated Teams",
    "Business Delivery",
    "Next.js",
    "React",
    "Web Development",
    "Software Engineering",
    "Technology Solutions",
    "Innovation",
    "Digital Transformation",
    "Business Growth",
    "Remote-first",
    "Global Team",
    "Scalable Solutions",
    "Tech Consulting",
    "Software Development",
    "Engineering Services",
    "Technology Partner",
    "Agile Development",
    "Full-stack Development",
    "Cloud Solutions",
    "AI Integration",
    "Custom Software",
    "Tech Strategy",
    "Digital Solutions",
    "Software Solutions",
    "Engineering Expertise",
    "Product Engineering",
    "Tech Innovation",
    "Business Technology",
    "Software Architecture",
    "Tech Development",
    "Engineering Services Provider",
    "Technology Consulting",
    "Software Solutions Provider",
    "Engineering Solutions",
    "Tech Development Partner",
    "Digital Engineering",
    "Software Engineering Services",
    "Technology Solutions Provider",
    "Engineering and Development",
    "Tech Solutions",
    "Software Development Services",
    "Engineering and Technology",
    "Digital Product Development",
    "Tech Services",
    "Software Engineering Solutions",
    "Product Development Services",
  ],
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
