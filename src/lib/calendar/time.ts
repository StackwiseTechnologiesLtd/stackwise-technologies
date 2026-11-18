const TIME_24 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

export function parseTime24(value: string): { hours: number; minutes: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const m = TIME_24.exec(trimmed);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function formatTime24(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function to12Hour(hours24: number): { hour12: number; pm: boolean } {
  const pm = hours24 >= 12;
  let hour12 = hours24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, pm };
}

export function from12Hour(hour12: number, pm: boolean): number {
  if (hour12 === 12) return pm ? 12 : 0;
  return pm ? hour12 + 12 : hour12;
}

export function formatTimeLabel(value: string): string {
  const parsed = parseTime24(value);
  if (!parsed) return "";
  const { hour12, pm } = to12Hour(parsed.hours);
  const min = String(parsed.minutes).padStart(2, "0");
  return `${hour12}:${min} ${pm ? "PM" : "AM"}`;
}