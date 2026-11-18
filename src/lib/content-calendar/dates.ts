const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIsoDay(iso: string): Date {
  if (!ISO_DAY.test(iso)) throw new Error("Invalid date");
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Monday-based week start (0 = Mon … 6 = Sun). */
export function startOfWeek(d: Date, weekStart = 1): Date {
  const x = startOfDay(d);
  const diff = (x.getDay() - weekStart + 7) % 7;
  return addDays(x, -diff);
}

export function monthGridDays(cursor: Date, weekStart = 1): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first, weekStart);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  if (cells[35].getMonth() !== cursor.getMonth()) {
    return cells.slice(0, 35);
  }
  return cells;
}

export function weekDays(cursor: Date, weekStart = 1): Date[] {
  const ws = startOfWeek(cursor, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
}

export const WEEKDAY_LABELS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function weekdayHeaders(weekStart = 1): string[] {
  return Array.from({ length: 7 }, (_, i) => WEEKDAY_LABELS_MON[(i + weekStart) % 7]);
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatWeekRange(days: Date[]): string {
  const start = days[0];
  const end = days[6];
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}, ${end.getFullYear()}`;
}

export function rangeForMonth(cursor: Date): { from: string; to: string } {
  const days = monthGridDays(cursor);
  return { from: isoDateLocal(days[0]), to: isoDateLocal(days[days.length - 1]) };
}

export function rangeForWeek(cursor: Date): { from: string; to: string } {
  const days = weekDays(cursor);
  return { from: isoDateLocal(days[0]), to: isoDateLocal(days[6]) };
}