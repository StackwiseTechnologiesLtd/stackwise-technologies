import { getAppSecret } from "@/lib/secrets";
import type { GrowthPlatform } from "@/lib/growth/types";

const TTL_MS = 10 * 60 * 1000;

function encodeBase64Url(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAppSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type ConnectPayload = {
  platform: GrowthPlatform;
  exp: number;
};

export async function mintGrowthConnectToken(
  platform: GrowthPlatform,
): Promise<{ token: string; expiresAt: string }> {
  const payload: ConnectPayload = {
    platform,
    exp: Date.now() + TTL_MS,
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = await sign(encoded);
  return {
    token: `${encoded}.${signature}`,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}

export async function verifyGrowthConnectToken(
  token: string,
): Promise<GrowthPlatform | null> {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = await sign(encoded);
  if (signature.length !== expected.length) return null;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(encoded)) as ConnectPayload;
    if (payload.exp < Date.now()) return null;
    if (payload.platform !== "linkedin" && payload.platform !== "x") return null;
    return payload.platform;
  } catch {
    return null;
  }
}
