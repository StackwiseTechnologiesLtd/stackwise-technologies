const MS_PER_HOUR = 60 * 60 * 1000;

/** Parse LinkedIn/X relative labels like "2h", "3d", "1w" or absolute dates. */
export function parsePostedAtHint(
  hint: string | null | undefined,
  now = new Date(),
): Date | null {
  const text = hint?.trim().toLowerCase();
  if (!text) return null;

  const iso = Date.parse(text);
  if (!Number.isNaN(iso)) return new Date(iso);

  const relative = text.match(
    /(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mos|month|months)\b/,
  );
  if (relative) {
    const n = Number.parseInt(relative[1], 10);
    if (!Number.isFinite(n)) return null;
    const unit = relative[2];
    let hours = 0;
    if (unit.startsWith("s")) hours = n / 3600;
    else if (unit.startsWith("m")) hours = n / 60;
    else if (unit.startsWith("h")) hours = n;
    else if (unit.startsWith("d")) hours = n * 24;
    else if (unit.startsWith("w")) hours = n * 24 * 7;
    else if (unit.startsWith("mo")) hours = n * 24 * 30;
    return new Date(now.getTime() - hours * MS_PER_HOUR);
  }

  if (text.includes("just now") || text === "now") return now;
  if (text.includes("yesterday")) {
    return new Date(now.getTime() - 24 * MS_PER_HOUR);
  }

  return null;
}

export function isPostedWithinHours(
  postedAt: Date | string | null | undefined,
  maxAgeHours: number,
  now = new Date(),
): boolean {
  if (!postedAt) return true;
  const date = postedAt instanceof Date ? postedAt : new Date(postedAt);
  if (Number.isNaN(date.getTime())) return true;
  const ageMs = now.getTime() - date.getTime();
  return ageMs >= 0 && ageMs <= maxAgeHours * MS_PER_HOUR;
}

export function freshnessCutoffIso(
  freshnessHours: number,
  now = new Date(),
): string {
  return new Date(now.getTime() - freshnessHours * MS_PER_HOUR).toISOString();
}
