import { isoDateLocal, parseIsoDay } from "@/lib/content-calendar/dates";
import { formatTime24, parseTime24 } from "@/lib/calendar/time";

/** Local calendar day + optional HH:mm → ISO instant (UTC string). */
export function buildLocalIsoFromDateAndTime(
  date: string,
  time: string,
  options?: { defaultHour?: number; defaultMinute?: number },
): string | null {
  if (!date.trim()) return null;
  const d = parseIsoDay(date.trim());
  const t = parseTime24(time);
  if (t) d.setHours(t.hours, t.minutes, 0, 0);
  else d.setHours(options?.defaultHour ?? 9, options?.defaultMinute ?? 0, 0, 0);
  return d.toISOString();
}

export function dateAndTimeFromDate(d: Date): { date: string; time: string } {
  return {
    date: isoDateLocal(d),
    time: formatTime24(d.getHours(), d.getMinutes()),
  };
}