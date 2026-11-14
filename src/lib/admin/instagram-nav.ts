export type InstagramNavItem = {
  href: string;
  label: string;
  description: string;
};

export const instagramPortalNav: InstagramNavItem[] = [
  {
    href: "/admin/instagram",
    label: "Overview",
    description: "Health, recent sends, quick stats",
  },
  {
    href: "/admin/instagram/campaigns",
    label: "Automations",
    description: "Keywords, DMs, and replies",
  },
  {
    href: "/admin/instagram/activity",
    label: "Activity",
    description: "Delivery log and failures",
  },
  {
    href: "/admin/instagram/inbox",
    label: "Inbox",
    description: "DM threads and manual replies",
  },
  {
    href: "/admin/instagram/connection",
    label: "Connection",
    description: "Account, token, webhooks",
  },
  {
    href: "/admin/instagram/team",
    label: "Team access",
    description: "Invite operators (owners only)",
  },
];

export function instagramPageTitle(pathname: string): string {
  if (pathname === "/admin/instagram") return "Overview";
  if (pathname.startsWith("/admin/instagram/campaigns")) return "Automations";
  if (pathname.startsWith("/admin/instagram/activity")) return "Activity";
  if (pathname.startsWith("/admin/instagram/inbox")) return "Inbox";
  if (pathname.startsWith("/admin/instagram/connection")) return "Connection";
  if (pathname.startsWith("/admin/instagram/team")) return "Team";
  return "Instagram";
}