import type { AdminNavItem } from "@/lib/admin/nav-meta";
import type { ReactNode } from "react";

export type AdminNavIconName = AdminNavItem["icon"] | "logout" | "menu" | "close" | "panel-left";

function IconSvg({
  className = "size-[18px]",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function AdminNavIcon({
  name,
  className = "size-[18px]",
}: {
  name: AdminNavIconName;
  className?: string;
}) {
  switch (name) {
    case "overview":
      return (
        <IconSvg className={className}>
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </IconSvg>
      );
    case "links":
      return (
        <IconSvg className={className}>
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
          <path d="M8 12h8" />
        </IconSvg>
      );
    case "contracts":
      return (
        <IconSvg className={className}>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </IconSvg>
      );
    case "subscription":
      return (
        <IconSvg className={className}>
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <path d="M2 10h20" />
        </IconSvg>
      );
    case "withdraw":
      return (
        <IconSvg className={className}>
          <path d="M12 17V3" />
          <path d="m6 11 6 6 6-6" />
          <path d="M19 21H5" />
        </IconSvg>
      );
    case "logs":
      return (
        <IconSvg className={className}>
          <path d="M15 12h-5" />
          <path d="M15 8h-5" />
          <path d="M19 17V5a2 2 0 0 0-2-2H4" />
          <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2" />
        </IconSvg>
      );
    case "pipeline":
      return (
        <IconSvg className={className}>
          <path d="M6 5v16" />
          <path d="M12 5v10" />
          <path d="M18 5v14" />
        </IconSvg>
      );
    case "brand":
      return (
        <IconSvg className={className}>
          <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" stroke="none" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" stroke="none" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" stroke="none" />
        </IconSvg>
      );
    case "portal":
      return (
        <IconSvg className={className}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </IconSvg>
      );
    case "projects":
      return (
        <IconSvg className={className}>
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          <rect width="20" height="14" x="2" y="6" rx="2" />
        </IconSvg>
      );
    case "logout":
      return (
        <IconSvg className={className}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </IconSvg>
      );
    case "menu":
      return (
        <IconSvg className={className}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </IconSvg>
      );
    case "close":
      return (
        <IconSvg className={className}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </IconSvg>
      );
    case "panel-left":
      return (
        <IconSvg className={className}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
          <path d="m14 9-3 3 3 3" />
        </IconSvg>
      );
    default:
      return null;
  }
}