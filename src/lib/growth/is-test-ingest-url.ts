/** URLs used by smoke tests and samples — not real prospects. */
export function isTestIngestUrl(sourceUrl: string | undefined | null): boolean {
  if (!sourceUrl?.trim()) return false;
  try {
    const host = new URL(sourceUrl.trim()).hostname.toLowerCase();
    if (host === "example.com" || host === "example.org" || host === "example.net") {
      return true;
    }
    if (host === "localhost" || host.endsWith(".localhost")) return true;
    return false;
  } catch {
    return false;
  }
}

export function testIngestAllowed(): boolean {
  return process.env.ALLOW_TEST_INGEST === "1";
}
