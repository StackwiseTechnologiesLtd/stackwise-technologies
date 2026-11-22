"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { instagramPortalNav } from "@/lib/admin/instagram-nav";
import { isNavChildActive } from "@/lib/admin/nav-meta";

type InstagramSubNavAccess = {
  canManageTeam: boolean;
  canManageMetaApps: boolean;
};

export function InstagramSubNavBar({ access }: { access: InstagramSubNavAccess }) {
  const pathname = usePathname();
  const items = instagramPortalNav.filter((item) => {
    if (item.href === "/admin/instagram/team" && !access.canManageTeam) return false;
    if (item.href === "/admin/instagram/connection" && !access.canManageMetaApps) {
      return false;
    }
    return true;
  });

  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-[var(--admin-border)] pb-px scrollbar-none"
      aria-label="Instagram automations"
    >
      {items.map((item) => {
        const child = { href: item.href, label: item.label, match: "prefix" as const };
        const active =
          item.href === "/admin/instagram"
            ? pathname === item.href
            : isNavChildActive(pathname, child);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.description}
            className={`shrink-0 rounded-t-md border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:border-[var(--admin-border)] hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}