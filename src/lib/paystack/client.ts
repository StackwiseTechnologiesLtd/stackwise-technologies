import { getPaystackSecretKey } from "@/lib/paystack/environment";
import type { PaystackCharge, PaystackMetadata } from "@/lib/paystack/checkout";

const PAYSTACK_BASE = "https://api.paystack.co";
const PAYSTACK_FETCH_TIMEOUT_MS = 25_000;

type PaystackEnvelope<T> = {
  status?: boolean;
  message?: string;
  data?: T;
};

export type PaystackInitResponse = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackTransaction = PaystackCharge & {
  id?: number;
  channel?: string | null;
};

export type PaystackInitializeParams = {
  email: string;
  amount?: number;
  currency?: string;
  plan?: string;
  reference: string;
  callback_url: string;
  channels?: ["card"];
  metadata: PaystackMetadata | Record<string, string | undefined>;
};

export type PaystackPlan = {
  plan_code: string;
  name: string;
  amount: number;
  interval: string;
  currency: string;
};

export type PaystackCreatePlanParams = {
  name: string;
  interval: string;
  amount: number;
  currency: string;
  description?: string;
};

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexEqual(a: string, b: string): boolean {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyPaystackSignature(
  rawBody: string,
  signature: string,
  secret = getPaystackSecretKey() ?? "",
): Promise<boolean> {
  if (!secret || !signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  return hexEqual(toHex(digest), signature.trim());
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = getPaystackSecretKey();
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY must be configured");
  }

  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: init?.signal ?? AbortSignal.timeout(PAYSTACK_FETCH_TIMEOUT_MS),
  });

  const body = (await res.json().catch(() => null)) as PaystackEnvelope<T> | null;
  if (!res.ok || !body?.status || body.data == null) {
    throw new Error(body?.message || "Paystack request failed");
  }
  return body.data;
}

export async function initializePaystackTransaction(
  params: PaystackInitializeParams,
): Promise<PaystackInitResponse> {
  return paystackFetch<PaystackInitResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackTransaction> {
  return paystackFetch<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

export async function createPaystackPlan(
  params: PaystackCreatePlanParams,
): Promise<PaystackPlan> {
  return paystackFetch<PaystackPlan>("/plan", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
