"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminGrowthNavChildren, isNavChildActive } from "@/lib/admin/nav-meta";

export function GrowthSubNavBar() {
  const pathname = usePathname();
  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-[var(--admin-border)] pb-px scrollbar-none"
      aria-label="Growth sections"
    >
      {adminGrowthNavChildren.map((item) => {
        const active = isNavChildActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
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
