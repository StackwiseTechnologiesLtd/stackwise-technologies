export type AdminNavItem = {
  href: string;
  label: string;
  icon:
    | "links"
    | "contracts"
    | "subscription"
    | "withdraw"
    | "logs"
    | "growth"
    | "crm"
    | "settings";
  match?: "exact" | "prefix";
};

export type AdminNavChild = {
  href: string;
  label: string;
  match?: "exact" | "prefix";
  description?: string;
};

/** Sub-routes under Growth (sidebar + horizontal sub-nav). */
export const adminGrowthNavChildren: AdminNavChild[] = [
  { href: "/admin/growth", label: "Dashboard", match: "exact" },
  { href: "/admin/growth/inbox", label: "Inbox", match: "prefix" },
  { href: "/admin/growth/linkedin", label: "LinkedIn", match: "prefix" },
  { href: "/admin/growth/jobs", label: "Jobs", match: "prefix" },
  { href: "/admin/growth/outreach", label: "Email outreach", match: "prefix" },
  { href: "/admin/crm", label: "CRM pipeline", match: "prefix" },
  { href: "/admin/growth/connect", label: "Connect", match: "prefix" },
  { href: "/admin/growth/settings", label: "Settings", match: "prefix" },
];

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
  /** When set, rendered under the item whose href matches `under`. */
  nestedUnder?: string;
  nestedChildren?: AdminNavChild[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    id: "billing",
    label: "Billing",
    items: [
      { href: "/admin", label: "Payment links", icon: "links", match: "exact" },
      { href: "/admin/contracts", label: "Agreements", icon: "contracts", match: "prefix" },
      {
        href: "/admin/subscriptions",
        label: "Subscriptions",
        icon: "subscription",
        match: "prefix",
      },
      { href: "/admin/withdraw", label: "Withdraw", icon: "withdraw", match: "prefix" },
      { href: "/admin/audit-logs", label: "Access logs", icon: "logs", match: "prefix" },
    ],
  },
  {
    id: "brand",
    label: "Brand",
    items: [
      {
        href: "/admin/brand-guidelines",
        label: "Brand guidelines",
        icon: "settings",
        match: "prefix",
      },
      {
        href: "/admin/brand-portal",
        label: "Brand access",
        icon: "settings",
        match: "prefix",
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    items: [
      {
        href: "/admin/growth",
        label: "Growth",
        icon: "growth",
        match: "prefix",
      },
    ],
    nestedUnder: "/admin/growth",
    nestedChildren: adminGrowthNavChildren,
  },
];

/** @deprecated Use adminNavSections — flat list for tests or legacy callers. */
export const adminNavPrimary: AdminNavItem[] = adminNavSections.flatMap((s) => s.items);

export function adminPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Payment links";
  if (pathname.startsWith("/admin/payment-links/new")) return "New payment link";
  if (pathname.startsWith("/admin/payment-links/")) return "Payment link";
  if (pathname === "/admin/brand-guidelines") return "Brand guidelines";
  if (pathname.startsWith("/admin/brand-guidelines/")) return "Edit brand guidelines";
  if (pathname === "/admin/brand-portal") return "Brand guidelines access";
  if (pathname === "/admin/contracts") return "Agreements";
  if (pathname.startsWith("/admin/contracts/new")) return "New agreement";
  if (pathname.startsWith("/admin/contracts/")) return "Agreement";
  if (pathname.startsWith("/admin/subscriptions/new")) return "New subscription";
  if (pathname.startsWith("/admin/subscriptions/")) return "Subscription";
  if (pathname === "/admin/subscriptions") return "Maintenance subscriptions";
  if (pathname === "/admin/withdraw") return "Withdraw funds";
  if (pathname === "/admin/audit-logs") return "Payment access logs";
  if (pathname === "/admin/growth") return "Dashboard";
  if (pathname.startsWith("/admin/growth/inbox")) return "Inbox";
  if (pathname.startsWith("/admin/growth/linkedin")) return "LinkedIn inbox";
  if (pathname.startsWith("/admin/growth/jobs")) return "Jobs inbox";
  if (pathname.startsWith("/admin/growth/outreach")) return "Email outreach";
  if (pathname.startsWith("/admin/growth/leads")) return "CRM pipeline";
  if (pathname.startsWith("/admin/growth/settings")) return "Settings";
  if (pathname.startsWith("/admin/growth/connect")) return "Connect";
  if (pathname === "/admin/crm") return "CRM pipeline";
  if (pathname.startsWith("/admin/crm/opportunities/")) return "Opportunity";
  return "Admin";
}

export function adminBreadcrumbArea(pathname: string): string {
  if (
    pathname === "/admin/growth" ||
    pathname.startsWith("/admin/growth/") ||
    pathname.startsWith("/admin/crm")
  ) {
    return "Growth";
  }
  if (
    pathname.startsWith("/admin/brand-guidelines") ||
    pathname.startsWith("/admin/brand-portal")
  ) {
    return "Brand";
  }
  return "Payments";
}

export function isNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.href === "/admin/growth") {
    return isGrowthSection(pathname) || pathname.startsWith("/admin/crm");
  }
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function isNavChildActive(pathname: string, child: AdminNavChild): boolean {
  if (child.href === "/admin/crm") {
    return pathname.startsWith("/admin/crm");
  }
  if (child.match === "exact") return pathname === child.href;
  return pathname === child.href || pathname.startsWith(`${child.href}/`);
}

export function isGrowthSection(pathname: string): boolean {
  return pathname === "/admin/growth" || pathname.startsWith("/admin/growth/");
}

export const growthHubLinks: AdminNavChild[] = adminGrowthNavChildren.filter(
  (c) => c.href !== "/admin/growth",
);
