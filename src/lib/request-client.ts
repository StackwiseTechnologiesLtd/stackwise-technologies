const IP_HEADERS = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
] as const;

const MAX_USER_AGENT_LENGTH = 512;

export function getClientIp(headers: Headers): string | null {
  for (const name of IP_HEADERS) {
    const value = headers.get(name);
    if (!value) continue;
    const ip = name === "x-forwarded-for" ? value.split(",")[0]?.trim() : value.trim();
    if (ip) return ip;
  }
  return null;
}

export function getUserAgent(headers: Headers): string | null {
  const value = headers.get("user-agent")?.trim();
  if (!value) return null;
  return value.length > MAX_USER_AGENT_LENGTH
    ? value.slice(0, MAX_USER_AGENT_LENGTH)
    : value;
}

export function getRequestClientInfo(headers: Headers): {
  ip: string | null;
  userAgent: string | null;
} {
  return {
    ip: getClientIp(headers),
    userAgent: getUserAgent(headers),
  };
}
