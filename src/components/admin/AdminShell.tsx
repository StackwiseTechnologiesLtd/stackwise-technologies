"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import Mark from "@/components/Mark";
import { useToast } from "@/components/ToastProvider";
import {
  adminNavPrimary,
  adminPageTitle,
  isNavActive,
} from "@/lib/admin/nav-meta";
import { SITE_NAME } from "@/lib/content";
import { ADMIN_BTN_SECONDARY, ADMIN_NAV_LINK } from "@/lib/ui/admin";

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-2 py-3" aria-label="Admin">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Billing
      </p>
      {adminNavPrimary.map((item) => {
        const active = isNavActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`${ADMIN_NAV_LINK} ${
              active
                ? "bg-[var(--admin-nav-active)] font-medium text-foreground"
                : "text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
            }`}
          >
            <AdminNavIcon name={item.icon} className="size-4 shrink-0 opacity-80" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const isLogin = pathname === "/admin/login";
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = adminPageTitle(pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

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

  if (isLogin) {
    return (
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    );
  }

  return (
    <div className="admin-shell flex min-h-screen bg-[var(--admin-canvas)] text-foreground">
      {/* Desktop sidebar */}
      <aside
        className="hidden w-[var(--admin-sidebar-width)] shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)] lg:flex"
      >
        <div className="flex h-12 items-center gap-2 border-b border-[var(--admin-border)] px-4">
          <Mark className="size-7 shrink-0" gradientId="sw-mark-admin" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Stackwise</p>
            <p className="truncate text-[11px] text-muted">Payments</p>
          </div>
        </div>
        <SidebarNav pathname={pathname} />
        <div className="mt-auto border-t border-[var(--admin-border)] p-2">
          <button
            type="button"
            onClick={() => void logout()}
            className={`${ADMIN_NAV_LINK} w-full text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground`}
          >
            <AdminNavIcon name="settings" className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-40 flex h-12 items-center justify-between gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-sidebar)]/90 px-3 backdrop-blur-md sm:gap-3 sm:px-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-md border border-[var(--admin-border)] lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-drawer"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
            <nav
              className="flex min-w-0 items-center gap-1 text-muted sm:gap-1.5"
              aria-label="Breadcrumb"
            >
              <span className="hidden max-w-[8rem] truncate md:inline lg:max-w-none">
                {SITE_NAME}
              </span>
              <span className="hidden opacity-40 md:inline">/</span>
              <span className="hidden md:inline">Payments</span>
              <span className="hidden opacity-40 md:inline">/</span>
              <span className="min-w-0 truncate font-medium text-foreground">
                {pageTitle}
              </span>
            </nav>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className={`shrink-0 ${ADMIN_BTN_SECONDARY} px-2.5 text-xs sm:px-3.5 sm:text-sm lg:hidden`}
          >
            Sign out
          </button>
        </header>

        {/* Mobile drawer */}
        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/55 lg:hidden"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside
              id="admin-mobile-drawer"
              className="fixed inset-y-0 left-0 z-50 flex w-[min(100vw-2.5rem,17rem)] max-w-[85vw] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)] shadow-2xl lg:hidden"
              style={{
                paddingTop: "max(0px, env(safe-area-inset-top))",
                paddingBottom: "max(0px, env(safe-area-inset-bottom))",
              }}
            >
              <div className="flex h-12 items-center gap-2 border-b border-[var(--admin-border)] px-4">
                <Mark className="size-7 shrink-0" gradientId="sw-mark-admin-mobile" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">Stackwise</p>
                  <p className="truncate text-[11px] text-muted">Payments</p>
                </div>
              </div>
              <SidebarNav
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
              />
              <div className="mt-auto border-t border-[var(--admin-border)] p-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className={`${ADMIN_NAV_LINK} w-full text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground`}
                >
                  <AdminNavIcon name="settings" className="size-4" />
                  Sign out
                </button>
              </div>
            </aside>
          </>
        ) : null}

        <main
          className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-5 sm:px-6 sm:py-8 lg:px-10"
          style={{
            paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
