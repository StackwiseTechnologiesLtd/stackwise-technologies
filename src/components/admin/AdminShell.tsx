"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import Mark from "@/components/Mark";
import { useToast } from "@/components/ToastProvider";
import { SITE_NAME } from "@/lib/content";
import { BTN_GHOST } from "@/lib/ui/buttons";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/audit-logs", label: "Access logs" },
  { href: "/admin/withdraw", label: "Withdraw" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const isLogin = pathname === "/admin/login";
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (!res.ok) throw new Error("Sign out failed");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isLogin && (
        <header className="sticky top-0 z-50 border-b border-line bg-panel/95 backdrop-blur supports-[backdrop-filter]:bg-panel/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:py-4">
            <Link
              href="/admin"
              className="flex min-w-0 items-center gap-3"
              onClick={() => setMenuOpen(false)}
            >
              <Mark className="h-8 w-8 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{SITE_NAME}</p>
                <p className="text-xs text-muted">Payments admin</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-5 text-sm sm:flex">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={
                    pathname === href || pathname.startsWith(`${href}/`)
                      ? "font-medium text-foreground"
                      : "text-muted transition hover:text-foreground"
                  }
                >
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => void logout()}
                className={BTN_GHOST}
              >
                Sign out
              </button>
            </nav>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-line px-3 py-2 text-sm sm:hidden"
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-nav"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>

          {menuOpen && (
            <nav
              id="admin-mobile-nav"
              className="relative z-10 border-t border-line bg-panel px-4 py-3 sm:hidden"
            >
              <div className="flex flex-col gap-1 text-sm">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-lg px-3 py-2 transition hover:bg-panel"
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className={`w-full text-left ${BTN_GHOST}`}
                >
                  Sign out
                </button>
              </div>
            </nav>
          )}
        </header>
      )}
      <main
        className={
          isLogin
            ? ""
            : `mx-auto w-full px-4 py-6 sm:py-8 ${
                pathname.startsWith("/admin/payment-links/new") ||
                pathname.startsWith("/admin/audit-logs")
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
