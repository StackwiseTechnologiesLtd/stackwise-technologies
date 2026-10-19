import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { createPageMetadata } from "@/lib/metadata";
import { ClientProviders } from "@/components/ClientProviders";
import { SITE_NAME } from "@/lib/content";
import "../../styles/globals.css";
import "../../styles/brand-document.css";
import "../../styles/contract-document.css";
import "../../styles/print-document.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = createPageMetadata({
  title: `Agreement | ${SITE_NAME}`,
  description: `Review your agreement with ${SITE_NAME}.`,
  path: "/c",
  noIndex: true,
});

export default function ContractPublicLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ClientProviders>
          <div className="mx-auto w-full max-w-4xl px-4 py-10">{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
