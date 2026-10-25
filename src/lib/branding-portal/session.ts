import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getAppSecret } from "@/lib/secrets";

export const BRAND_PORTAL_COOKIE = "sw_brand_portal_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type BrandPortalSession = {
  email: string;
  brandSlug: string;
  exp: number;
};

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

export async function createBrandPortalSessionToken(
  email: string,
  brandSlug: string,
): Promise<string> {
  const payload: BrandPortalSession = {
    email,
    brandSlug,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = await sign(encoded);
  return `${encoded}.${signature}`;
}

export async function verifyBrandPortalSessionToken(
  token: string | undefined,
): Promise<BrandPortalSession | null> {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  try {
    const expected = await sign(encoded);
    if (expected.length !== signature.length) return null;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const payload = JSON.parse(decodeBase64Url(encoded)) as BrandPortalSession;
    if (
      !payload.email ||
      !payload.brandSlug ||
      !payload.exp ||
      Date.now() > payload.exp
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getBrandPortalSession(): Promise<BrandPortalSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(BRAND_PORTAL_COOKIE)?.value;
  return verifyBrandPortalSessionToken(token);
}

export function getBrandPortalSessionFromRequest(
  request: NextRequest,
): Promise<BrandPortalSession | null> {
  const token = request.cookies.get(BRAND_PORTAL_COOKIE)?.value;
  return verifyBrandPortalSessionToken(token);
}

export async function setBrandPortalSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(BRAND_PORTAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearBrandPortalSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(BRAND_PORTAL_COOKIE);
}
