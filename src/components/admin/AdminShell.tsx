"use client";

import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import Mark from "@/components/Mark";
import { useToast } from "@/components/ToastProvider";
import {
  adminGrowthNavChildren,
  adminNavPrimary,
  adminPageTitle,
  isNavActive,
  isNavChildActive,
} from "@/lib/admin/nav-meta";
import { SITE_NAME } from "@/lib/content";
import { ADMIN_NAV_LINK } from "@/lib/ui/admin";
import Link from "next/link";
import {
  getAdminSidebarCollapsed,
  getAdminSidebarCollapsedServerSnapshot,
  setAdminSidebarCollapsed,
  subscribeAdminSidebar,
} from "@/lib/admin/sidebar-preference";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, useState, type ReactNode } from "react";

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={`flex h-12 shrink-0 items-center border-b border-[var(--admin-border)] ${collapsed ? "justify-center px-2" : "gap-2 px-4"
        }`}
    >
      <Mark className="size-7 shrink-0" gradientId="sw-mark-admin" />
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Stackwise</p>
          <p className="truncate text-[11px] text-muted">Payments</p>
        </div>
      ) : null}
    </div>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function SidebarNav({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-2 py-3" aria-label="Admin">
      {/* {!collapsed ? (
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Billing
        </p>
      ) : (
        <p className="sr-only">Billing</p>
      )} */}
      {adminNavPrimary.map((item) => {
        const growthChildren =
          item.href === "/admin/growth" ? adminGrowthNavChildren : null;
        const active = isNavActive(pathname, item);
        return (
          <div key={item.href} className="flex flex-col gap-0.5">
            <Link
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={onNavigate}
              className={`${ADMIN_NAV_LINK} ${collapsed ? "justify-center px-2" : ""
                } ${active
                  ? collapsed
                    ? "bg-[var(--admin-nav-active)] font-medium text-foreground"
                    : "border-l-2 border-[var(--admin-nav-active-border)] bg-[var(--admin-nav-active)] font-medium text-foreground"
                  : collapsed
                    ? "text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
                    : "border-l-2 border-transparent text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
                }`}
            >
              <AdminNavIcon
                name={item.icon}
                className={`size-4 shrink-0 ${active ? "text-accent" : "opacity-80"}`}
              />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
              {collapsed ? <span className="sr-only">{item.label}</span> : null}
            </Link>
            {growthChildren && !collapsed ? (
              <div
                className="ml-4 flex flex-col gap-0.5 border-l border-[var(--admin-border)] pl-2"
                aria-label="Growth"
              >
                {growthChildren.map((child) => {
                  const childActive = isNavChildActive(pathname, child);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={`rounded-md px-2.5 py-1.5 text-[13px] ${childActive
                        ? "bg-[var(--admin-nav-active)] font-medium text-foreground"
                        : "text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
                        }`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div
      className="shrink-0 border-t border-[var(--admin-border)] p-2"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className={`${ADMIN_NAV_LINK} w-full text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground ${collapsed ? "justify-center px-2" : ""
          }`}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : undefined}
      >
        <CollapseIcon collapsed={collapsed} />
        {!collapsed ? <span>Collapse sidebar</span> : null}
        {collapsed ? <span className="sr-only">Collapse sidebar</span> : null}
      </button>
    </div>
  );
}

function DesktopSidebar({
  pathname,
  collapsed,
  onToggleCollapse,
}: {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <aside
      className="hidden h-full max-h-full w-[var(--admin-sidebar-width)] shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)] transition-[width] duration-200 ease-out lg:flex"
      style={{
        paddingTop: "max(0px, env(safe-area-inset-top))",
      }}
    >
      <SidebarBrand collapsed={collapsed} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <SidebarNav pathname={pathname} collapsed={collapsed} />
      </div>
      <SidebarFooter
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </aside>
  );
}

export type AdminShellUser = {
  email: string;
  avatarUrl: string;
};

export function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: AdminShellUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const isLogin = pathname === "/admin/login";
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarCollapsed = useSyncExternalStore(
    subscribeAdminSidebar,
    getAdminSidebarCollapsed,
    getAdminSidebarCollapsedServerSnapshot,
  );
  const pageTitle = adminPageTitle(pathname);

  useDeferredEffect(() => {
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

  function toggleSidebar() {
    setAdminSidebarCollapsed(!sidebarCollapsed);
  }

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
    <div
      className={`admin-shell flex h-dvh max-h-dvh overflow-hidden bg-[var(--admin-canvas)] text-foreground ${sidebarCollapsed ? "admin-sidebar-collapsed" : ""
        }`}
    >
      <DesktopSidebar
        pathname={pathname}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <AdminUserAvatar
                email={user.email}
                avatarUrl={user.avatarUrl}
                onSignOut={() => void logout()}
              />
            ) : null}
          </div>
        </header>

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
              className="fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(100vw-2.5rem,17rem)] max-w-[85vw] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)] shadow-2xl lg:hidden"
              style={{
                paddingTop: "max(0px, env(safe-area-inset-top))",
              }}
            >
              <SidebarBrand collapsed={false} />
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                <SidebarNav
                  pathname={pathname}
                  collapsed={false}
                  onNavigate={() => setMenuOpen(false)}
                />
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
