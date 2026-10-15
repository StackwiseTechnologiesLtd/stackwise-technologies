export type AdminNavItem = {
  href: string;
  label: string;
  icon: "links" | "subscription" | "withdraw" | "logs" | "growth" | "settings";
  match?: "exact" | "prefix";
};

export const adminNavPrimary: AdminNavItem[] = [
  { href: "/admin", label: "Payment links", icon: "links", match: "exact" },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    icon: "subscription",
    match: "prefix",
  },
  { href: "/admin/withdraw", label: "Withdraw", icon: "withdraw", match: "prefix" },
  { href: "/admin/audit-logs", label: "Access logs", icon: "logs", match: "prefix" },
  {
    href: "/admin/growth",
    label: "Growth inbox",
    icon: "growth",
    match: "prefix",
  },
];

export function adminPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Payment links";
  if (pathname.startsWith("/admin/payment-links/new")) return "New payment link";
  if (pathname.startsWith("/admin/payment-links/")) return "Payment link";
  if (pathname.startsWith("/admin/subscriptions/new")) return "New subscription";
  if (pathname.startsWith("/admin/subscriptions/")) return "Subscription";
  if (pathname === "/admin/subscriptions") return "Maintenance subscriptions";
  if (pathname === "/admin/withdraw") return "Withdraw funds";
  if (pathname === "/admin/audit-logs") return "Payment access logs";
  if (pathname === "/admin/growth") return "Growth inbox";
  if (pathname.startsWith("/admin/growth/leads")) return "Leads";
  if (pathname.startsWith("/admin/growth/settings")) return "Growth settings";
  return "Admin";
}

export function isNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
