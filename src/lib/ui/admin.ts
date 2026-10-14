import { BTN_PRESS } from "@/lib/ui/buttons";

/** Supabase-style primary action inside the admin shell */
export const ADMIN_BTN_PRIMARY = `${BTN_PRESS} admin-btn-primary inline-flex min-h-11 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-[#0d1f17]`;

/** Full-width on small screens (page headers, toolbars) */
export const ADMIN_BTN_PRIMARY_BLOCK = `${ADMIN_BTN_PRIMARY} w-full sm:w-auto`;

export const ADMIN_BTN_SECONDARY = `${BTN_PRESS} inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 py-2 text-sm font-medium text-foreground hover:bg-[var(--admin-surface-hover)]`;

export const ADMIN_NAV_LINK =
  "flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors touch-manipulation";

export const ADMIN_INPUT =
  "w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-canvas)] px-3 py-2 text-sm text-foreground placeholder:text-muted/70 outline-none focus:border-[var(--admin-focus)] focus:ring-1 focus:ring-[var(--admin-focus)]";

export const ADMIN_SELECT = `${ADMIN_INPUT} appearance-none`;

export const ADMIN_TABLE_WRAP =
  "overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]";

/** Horizontal scroll for wide tables on tablet */
export const ADMIN_TABLE_SCROLL = "overflow-x-auto overscroll-x-contain";

export const ADMIN_TABLE_HEAD =
  "bg-[var(--admin-canvas)] text-left text-[11px] font-medium uppercase tracking-wide text-muted";
