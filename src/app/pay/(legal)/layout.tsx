import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { createPageMetadata } from "@/lib/metadata";
import { ClientProviders } from "@/components/ClientProviders";
import { SITE_NAME } from "@/lib/content";
import "../../../styles/globals.css";
import "../../../styles/pay-legal.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = createPageMetadata({
  title: `Payment processing & data | ${SITE_NAME}`,
  description:
    "How Stackwise Technologies handles payment processing, customer data, receipts, and KPay checkout.",
  path: "/pay/legal",
});

export default function PayLegalLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="pay-legal min-h-full font-sans">
        <ClientProviders>
          <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
