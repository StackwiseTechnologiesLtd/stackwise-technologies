import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { createPageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/content";
import "../../../styles/globals.css";
import "../../../styles/print-receipt.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = createPageMetadata({
  title: `Pay | ${SITE_NAME}`,
  description: `Secure invoice payment for ${SITE_NAME}. Pay by card or Mobile Money via KPay.`,
  path: "/pay",
  noIndex: true,
});

export default function PayCheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>
      </body>
    </html>
  );
}
