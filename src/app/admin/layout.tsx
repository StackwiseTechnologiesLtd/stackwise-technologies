import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AdminShell } from "@/components/admin/AdminShell";
import { createPageMetadata } from "@/lib/metadata";
import "../../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = createPageMetadata({
  title: "Admin | Stackwise Technologies",
  description:
    "Stackwise Technologies payments admin — manage invoices, payment links, withdrawals, and access logs.",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
