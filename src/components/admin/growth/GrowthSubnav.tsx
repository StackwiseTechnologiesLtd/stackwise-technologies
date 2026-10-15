import Link from "next/link";

const links = [
  { href: "/admin/growth", label: "Inbox" },
  { href: "/admin/growth/leads", label: "Leads" },
  { href: "/admin/growth/settings", label: "Settings" },
];

export function GrowthSubnav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-[var(--admin-border)] pb-3"
      aria-label="Growth"
    >
      {links.map((link) => {
        const active =
          link.href === "/admin/growth"
            ? pathname === "/admin/growth"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-1.5 text-sm ${
              active
                ? "bg-[var(--admin-nav-active)] font-medium text-foreground"
                : "text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
