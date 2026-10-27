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
};

export const adminGrowthNavChildren: AdminNavChild[] = [
  { href: "/admin/crm", label: "Pipeline", match: "prefix" },
  { href: "/admin/growth", label: "Inbox", match: "exact" },
  { href: "/admin/growth/linkedin", label: "LinkedIn", match: "prefix" },
  { href: "/admin/growth/jobs", label: "Jobs", match: "prefix" },
  { href: "/admin/growth/settings", label: "Settings", match: "prefix" },
];

export const adminNavPrimary: AdminNavItem[] = [
  { href: "/admin", label: "Payment links", icon: "links", match: "exact" },
  { href: "/admin/contracts", label: "Agreements", icon: "contracts", match: "prefix" },
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
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    icon: "subscription",
    match: "prefix",
  },
  { href: "/admin/withdraw", label: "Withdraw", icon: "withdraw", match: "prefix" },
  { href: "/admin/audit-logs", label: "Access logs", icon: "logs", match: "prefix" },
  { href: "/admin/crm", label: "CRM", icon: "crm", match: "prefix" },
  {
    href: "/admin/growth",
    label: "Growth",
    icon: "growth",
    match: "prefix",
  },
];

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
  if (pathname === "/admin/growth") return "Inbox";
  if (pathname.startsWith("/admin/growth/linkedin")) return "LinkedIn inbox";
  if (pathname.startsWith("/admin/growth/jobs")) return "Jobs inbox";
  if (pathname.startsWith("/admin/growth/leads")) return "CRM pipeline";
  if (pathname.startsWith("/admin/growth/settings")) return "Settings";
  if (pathname.startsWith("/admin/growth/connect")) return "Connect";
  if (pathname === "/admin/crm") return "CRM pipeline";
  if (pathname.startsWith("/admin/crm/opportunities/")) return "Opportunity";
  return "Admin";
}

export function isNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function isNavChildActive(pathname: string, child: AdminNavChild): boolean {
  if (child.match === "exact") return pathname === child.href;
  return pathname === child.href || pathname.startsWith(`${child.href}/`);
}

export function isGrowthSection(pathname: string): boolean {
  return pathname === "/admin/growth" || pathname.startsWith("/admin/growth/");
}
