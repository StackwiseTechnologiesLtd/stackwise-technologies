import Link from "next/link";

const links = [
  { href: "/admin/growth", label: "Inbox", description: "Review drafts" },
  { href: "/admin/growth/leads", label: "Leads", description: "Pipeline & scores" },
  { href: "/admin/growth/settings", label: "Settings", description: "ICP & connect" },
];

export function GrowthSubnav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="flex flex-col gap-1"
      aria-label="Growth"
    >
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Growth
      </p>
      {links.map((link) => {
        const active =
          link.href === "/admin/growth"
            ? pathname === "/admin/growth"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg border px-3 py-2.5 transition-colors ${
              active
                ? "border-accent/30 bg-[var(--admin-nav-active)] text-foreground"
                : "border-transparent text-muted hover:border-[var(--admin-border)] hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
            }`}
          >
            <span className="block text-sm font-medium">{link.label}</span>
            <span className="mt-0.5 block text-[11px] opacity-80">
              {link.description}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
