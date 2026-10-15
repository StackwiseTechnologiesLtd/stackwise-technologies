import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AdminShell } from "@/components/admin/AdminShell";
import { ClientProviders } from "@/components/ClientProviders";
import { getAdminSession } from "@/lib/auth/session";
import { gravatarUrl } from "@/lib/gravatar";
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

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  const user = session
    ? { email: session.email, avatarUrl: gravatarUrl(session.email, 72) }
    : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <ClientProviders>
          <AdminShell user={user}>{children}</AdminShell>
        </ClientProviders>
      </body>
    </html>
  );
}
