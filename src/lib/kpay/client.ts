const KPAY_BASE = "https://admin.kpay.site";

export type KPayPaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type KPayInitGatewayParams = {
  amount: number;
  externalId: string;
  returnUrl: string;
  cancelUrl?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: "CARD";
  metadata?: Record<string, unknown>;
};

export type KPayGatewayResponse = {
  id: string;
  reference: string;
  externalId: string;
  status: KPayPaymentStatus;
  mode: "GATEWAY";
  amount: number;
  currency: string;
  gatewayUrl: string;
  expiresAt: string;
  isTest: boolean;
  message: string;
};

export type KPayPayment = {
  id: string;
  reference: string;
  status: KPayPaymentStatus;
  amount: number;
  currency: string;
  externalId: string;
  completedAt: string | null;
  failureReason: string | null;
};

export type KPayExchangeRate = {
  from: string;
  to: string;
  rate: number;
};

export type KPayWebhookEvent = {
  event: string;
  paymentId: string;
  reference: string;
  status: KPayPaymentStatus;
  amount: number;
  phoneNumber?: string;
  externalId: string;
  metadata?: Record<string, unknown>;
  completedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  timestamp: string;
};

function getCredentials() {
  const apiKey = process.env.KPAY_API_KEY;
  const secretKey = process.env.KPAY_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error("KPAY_API_KEY and KPAY_SECRET_KEY must be configured");
  }
  return { apiKey, secretKey };
}

async function kpayFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { apiKey, secretKey } = getCredentials();
  const res = await fetch(`${KPAY_BASE}${path}`, {
    ...init,
    headers: {
      "X-API-Key": apiKey,
      "X-Secret-Key": secretKey,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = (await res.json()) as T & { statusCode?: number; message?: string };
  if (!res.ok) {
    throw new Error(
      data.message ?? `KPay request failed (${res.status})`,
    );
  }
  return data;
}

export async function initGatewayPayment(
  params: KPayInitGatewayParams,
): Promise<KPayGatewayResponse> {
  return kpayFetch<KPayGatewayResponse>("/api/v1/payments/init", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getPayment(id: string): Promise<KPayPayment> {
  return kpayFetch<KPayPayment>(`/api/v1/payments/${id}`);
}

export async function getExchangeRate(
  from: string,
  to: string,
): Promise<KPayExchangeRate | null> {
  if (from === to) return { from, to, rate: 1 };
  try {
    return await kpayFetch<KPayExchangeRate>(
      `/api/v1/payments/exchange-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
  } catch {
    return null;
  }
}

export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  const secret = process.env.KPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyGatewayReturnSignature(
  status: string,
  reference: string,
  externalId: string,
  ts: string,
  sig: string,
): Promise<boolean> {
  const secret = process.env.KPAY_GATEWAY_SECRET;
  if (!secret) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Date.now() - tsNum > 10 * 60 * 1000) {
    return false;
  }

  const payload = `${status}|${reference}|${externalId}|${ts}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const computed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const expected = Array.from(new Uint8Array(computed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== sig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return mismatch === 0;
}
