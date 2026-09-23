/** Shared press feedback for interactive buttons (not menu toggles). */
export const BTN_PRESS =
  "touch-manipulation transition-[transform,opacity,background-color,border-color] duration-150 active:scale-[0.98] active:opacity-90 disabled:opacity-50 disabled:active:scale-100 disabled:active:opacity-50";

export const BTN_PRIMARY = `${BTN_PRESS} rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover`;

export const BTN_SECONDARY = `${BTN_PRESS} rounded-lg border border-line px-4 py-2 hover:bg-panel-hover`;

export const BTN_GHOST = `${BTN_PRESS} rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-panel hover:text-foreground`;
