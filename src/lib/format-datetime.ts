const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: "UTC",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
};

/** Stable SSR/client datetime string (UTC) to avoid hydration mismatches. */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", DATE_TIME_OPTIONS);
}

/** Stable SSR/client date string (UTC) to avoid hydration mismatches. */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", DATE_OPTIONS);
}
