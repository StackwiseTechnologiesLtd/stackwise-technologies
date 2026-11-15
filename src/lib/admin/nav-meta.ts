import { instagramPageTitle } from "@/lib/admin/instagram-nav";

function instagramPortalTitle(pathname: string): string {
  return instagramPageTitle(pathname);
}

export type AdminNavItem = {
  href: string;
  label: string;
  icon:
    | "overview"
    | "links"
    | "contracts"
    | "subscription"
    | "withdraw"
    | "logs"
    | "pipeline"
    | "brand"
    | "portal";
  match?: "exact" | "prefix";
};

export type AdminNavChild = {
  href: string;
  label: string;
  match?: "exact" | "prefix";
  description?: string;
};

/** Pipeline, outreach, and automation routes (sidebar sub-nav). */
export const adminPipelineNavChildren: AdminNavChild[] = [
  { href: "/admin/crm", label: "CRM pipeline", match: "prefix" },
  { href: "/admin/growth/inbox", label: "Inbox", match: "prefix" },
  { href: "/admin/growth/linkedin", label: "LinkedIn", match: "prefix" },
  { href: "/admin/growth/jobs", label: "Jobs", match: "prefix" },
  { href: "/admin/instagram", label: "Instagram DM", match: "prefix" },
  { href: "/admin/growth/discover", label: "Web discover", match: "prefix" },
  { href: "/admin/growth/outreach", label: "Email outreach", match: "prefix" },
  { href: "/admin/growth/connect", label: "Connect", match: "prefix" },
  { href: "/admin/growth/settings", label: "Settings", match: "prefix" },
];

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
  nestedUnder?: string;
  nestedChildren?: AdminNavChild[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    id: "agency",
    label: "Agency",
    items: [
      { href: "/admin", label: "Overview", icon: "overview", match: "exact" },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    items: [
      {
        href: "/admin/payment-links",
        label: "Payment links",
        icon: "links",
        match: "prefix",
      },
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
        icon: "brand",
        match: "prefix",
      },
      {
        href: "/admin/brand-portal",
        label: "Brand access",
        icon: "portal",
        match: "prefix",
      },
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    items: [
      {
        href: "/admin/crm",
        label: "Pipeline",
        icon: "pipeline",
        match: "prefix",
      },
    ],
    nestedUnder: "/admin/crm",
    nestedChildren: adminPipelineNavChildren,
  },
];

/** @deprecated Use adminNavSections — flat list for tests or legacy callers. */
export const adminNavPrimary: AdminNavItem[] = adminNavSections.flatMap((s) => s.items);

/** @deprecated Renamed to adminPipelineNavChildren */
export const adminGrowthNavChildren = adminPipelineNavChildren;

export function adminPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Overview";
  if (pathname === "/admin/payment-links") return "Payment links";
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
  if (pathname.startsWith("/admin/growth/inbox")) return "Inbox";
  if (pathname.startsWith("/admin/growth/linkedin")) return "LinkedIn inbox";
  if (pathname.startsWith("/admin/growth/jobs")) return "Jobs inbox";
  if (pathname.startsWith("/admin/growth/discover")) return "Web discover";
  if (pathname.startsWith("/admin/growth/outreach")) return "Email outreach";
  if (pathname.startsWith("/admin/growth/leads")) return "CRM pipeline";
  if (pathname.startsWith("/admin/growth/settings")) return "Settings";
  if (pathname.startsWith("/admin/growth/connect")) return "Connect";
  if (pathname === "/admin/instagram") return "Overview";
  if (pathname.startsWith("/admin/instagram/")) return instagramPortalTitle(pathname);
  if (pathname === "/admin/crm") return "CRM pipeline";
  if (pathname.startsWith("/admin/crm/opportunities/")) return "Opportunity";
  return "Admin";
}

export function adminBreadcrumbArea(pathname: string): string {
  if (pathname === "/admin") return "Agency";
  if (pathname === "/admin/instagram" || pathname.startsWith("/admin/instagram/")) {
    return "Instagram DM";
  }
  if (isPipelineSection(pathname)) {
    return "Pipeline";
  }
  if (
    pathname.startsWith("/admin/brand-guidelines") ||
    pathname.startsWith("/admin/brand-portal")
  ) {
    return "Brand";
  }
  if (isRevenueSection(pathname)) {
    return "Revenue";
  }
  return "Agency";
}

export function isRevenueSection(pathname: string): boolean {
  return (
    pathname === "/admin/payment-links" ||
    pathname.startsWith("/admin/payment-links/") ||
    pathname.startsWith("/admin/contracts") ||
    pathname.startsWith("/admin/subscriptions") ||
    pathname === "/admin/withdraw" ||
    pathname.startsWith("/admin/audit-logs")
  );
}

export function isNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.href === "/admin/crm") {
    return isPipelineSection(pathname);
  }
  if (item.href === "/admin" && item.match === "exact") {
    return pathname === "/admin";
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

export function isPipelineSection(pathname: string): boolean {
  return (
    isGrowthSection(pathname) ||
    pathname.startsWith("/admin/crm") ||
    pathname === "/admin/instagram" ||
    pathname.startsWith("/admin/instagram/")
  );
}

export const growthHubLinks: AdminNavChild[] = adminPipelineNavChildren;