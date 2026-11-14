"use client";

import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { useToast } from "@/components/ToastProvider";
import Mark from "@/components/Mark";
import {
  instagramPageTitle,
  instagramPortalNav,
} from "@/lib/admin/instagram-nav";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useEffect, useState, type ReactNode } from "react";

type Access = {
  kind: "owner" | "operator";
  canManageTeam: boolean;
};

export function InstagramAppShell({
  children,
  user,
  access,
}: {
  children: ReactNode;
  user: { email: string; avatarUrl: string };
  access: Access;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = instagramPageTitle(pathname);

  useDeferredEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (!res.ok) throw new Error("Sign out failed");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    }
  }

  const navItems = instagramPortalNav.filter(
    (item) => item.href !== "/admin/instagram/team" || access.canManageTeam,
  );

  return (
    <div className="flex h-dvh min-h-0 bg-[#0a0a0c] text-foreground">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line/80 bg-[#0d0d10] lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-line/80 px-4">
          <Mark className="size-7" gradientId="sw-ig-portal" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Instagram DM</p>
            <p className="truncate text-[11px] text-muted">Stackwise automations</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Instagram automations">
          {navItems.map((item) => {
            const active =
              item.href === "/admin/instagram"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-white/10 text-foreground"
                    : "text-muted hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="mt-0.5 block text-[11px] opacity-70">{item.description}</span>
              </Link>
            );
          })}
        </nav>
        {access.kind === "owner" ? (
          <div className="border-t border-line/80 p-3 text-[11px] text-muted">
            <Link href="/admin" className="text-accent underline">
              Full admin
            </Link>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line/80 bg-[#0d0d10]/90 px-4 backdrop-blur">
          <PostHButton mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          <h1 className="truncate text-sm font-semibold">{title}</h1>
          <AdminUserAvatar
            email={user.email}
            avatarUrl={user.avatarUrl}
            size="sm"
            onSignOut={() => void logout()}
          />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      {mobileOpen ? (
        <MobileDrawer
          navItems={navItems}
          pathname={pathname}
          onClose={() => setMobileOpen(false)}
        />
      ) : null}
    </div>
  );
}

function PostHButton({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="rounded-md border border-line p-2 lg:hidden"
      aria-expanded={mobileOpen}
      onClick={() => setMobileOpen(!mobileOpen)}
    >
      <span className="sr-only">Menu</span>
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}

function MobileDrawer({
  navItems,
  pathname,
  onClose,
}: {
  navItems: { href: string; label: string }[];
  pathname: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close menu"
        onClick={onClose}
      />
      <nav className="relative ml-auto flex h-full w-72 flex-col gap-1 bg-[#0d0d10] p-4 shadow-xl">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm font-medium"
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}