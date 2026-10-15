/** Client-side fetches for growth admin APIs (avoid stale cached GET responses). */
export function growthFetch(input: string, init?: RequestInit) {
  return fetch(input, {
    ...init,
    cache: "no-store",
    headers: {
      ...init?.headers,
    },
  });
}
