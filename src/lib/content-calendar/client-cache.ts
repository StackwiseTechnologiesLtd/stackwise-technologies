import type { ContentCalendarPostDetail } from "@/lib/content-calendar/types";

type CacheEntry = {
  posts: ContentCalendarPostDetail[];
  fetchedAt: number;
};

const store = new Map<string, CacheEntry>();

/** Keeps month navigations snappy without serving stale data for long. */
const FRESH_MS = 45_000;

function cacheKey(from: string, to: string) {
  return `${from}::${to}`;
}

export function readContentCalendarCache(
  from: string,
  to: string,
): ContentCalendarPostDetail[] | null {
  const hit = store.get(cacheKey(from, to));
  if (!hit) return null;
  if (Date.now() - hit.fetchedAt > FRESH_MS * 4) {
    store.delete(cacheKey(from, to));
    return null;
  }
  return hit.posts;
}

export function isContentCalendarCacheFresh(from: string, to: string): boolean {
  const hit = store.get(cacheKey(from, to));
  if (!hit) return false;
  return Date.now() - hit.fetchedAt < FRESH_MS;
}

export function primeContentCalendarCache(
  from: string,
  to: string,
  posts: ContentCalendarPostDetail[],
) {
  store.set(cacheKey(from, to), { posts, fetchedAt: Date.now() });
}

export function invalidateContentCalendarCache(from?: string, to?: string) {
  if (from && to) {
    store.delete(cacheKey(from, to));
    return;
  }
  store.clear();
}

export async function fetchContentCalendarRange(
  from: string,
  to: string,
  options?: { force?: boolean },
): Promise<ContentCalendarPostDetail[]> {
  if (!options?.force) {
    const fresh = readContentCalendarCache(from, to);
    if (fresh && isContentCalendarCacheFresh(from, to)) return fresh;
  }

  const q = new URLSearchParams({ from, to });
  const res = await fetch(`/api/admin/content-calendar?${q}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Could not load calendar");
  const data = (await res.json()) as { posts: ContentCalendarPostDetail[] };
  primeContentCalendarCache(from, to, data.posts);
  return data.posts;
}

/** Warm adjacent ranges while viewing a month/week. */
export function prefetchContentCalendarRange(from: string, to: string) {
  if (isContentCalendarCacheFresh(from, to)) return;
  void fetchContentCalendarRange(from, to).catch(() => undefined);
}