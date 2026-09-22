"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Mark from "@/components/Mark";
import { SITE_NAME } from "@/lib/content";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isLogin && (
        <header className="border-b border-line bg-panel/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/admin" className="flex items-center gap-3">
              <Mark className="h-8 w-8" />
              <div>
                <p className="text-sm font-semibold">{SITE_NAME}</p>
                <p className="text-xs text-muted">Payments admin</p>
              </div>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/admin"
                className="text-muted transition hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/withdraw"
                className="text-muted transition hover:text-foreground"
              >
                Withdraw
              </Link>
              <Link
                href="/admin/payment-links/new"
                className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white transition hover:bg-accent-hover"
              >
                New payment link
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-muted transition hover:text-foreground"
              >
                Sign out
              </button>
            </nav>
          </div>
        </header>
      )}
      <main
        className={
          isLogin
            ? ""
            : `mx-auto px-4 py-8 ${
                pathname.startsWith("/admin/payment-links/new")
                  ? "max-w-7xl"
                  : "max-w-5xl"
              }`
        }
      >
        {children}
      </main>
    </div>
  );
}
