const KPAY_BASE = "https://admin.kpay.site";
const KPAY_FETCH_TIMEOUT_MS = 25_000;

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

export type KPayCredentials = {
  apiKey: string;
  secretKey: string;
};

function getCredentials(): KPayCredentials {
  const apiKey = process.env.KPAY_API_KEY;
  const secretKey = process.env.KPAY_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error("KPAY_API_KEY and KPAY_SECRET_KEY must be configured");
  }
  return { apiKey, secretKey };
}

async function parseKPayJson<T>(res: Response): Promise<
  T & { statusCode?: number; message?: string }
> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T & { statusCode?: number; message?: string };
  } catch {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 120);
    if (res.status === 504 || snippet.includes("504")) {
      throw new Error(
        "KPay timed out while starting payment. Please try again in a moment.",
      );
    }
    throw new Error(
      res.ok
        ? "Invalid response from KPay"
        : `KPay request failed (${res.status})${snippet ? `: ${snippet}` : ""}`,
    );
  }
}

function wrapKPayFetchError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return new Error(
        "KPay timed out while starting payment. Please try again in a moment.",
      );
    }
    return error;
  }
  return new Error("KPay request failed");
}

async function kpayFetchWithCredentials<T>(
  credentials: KPayCredentials,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { apiKey, secretKey } = credentials;

  let res: Response;
  try {
    res = await fetch(`${KPAY_BASE}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(KPAY_FETCH_TIMEOUT_MS),
      headers: {
        "X-API-Key": apiKey,
        "X-Secret-Key": secretKey,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    throw wrapKPayFetchError(error);
  }

  const data = await parseKPayJson<T>(res);
  if (!res.ok) {
    throw new Error(data.message ?? `KPay request failed (${res.status})`);
  }
  return data;
}

async function kpayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return kpayFetchWithCredentials(getCredentials(), path, init);
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

export type KPayWalletBalance = {
  currency: string;
  balance: number;
  reservedBalance: number;
  availableBalance: number;
};

export type KPayWithdrawParams = {
  amount: number;
  provider: string;
  phoneNumber: string;
  externalId: string;
  description?: string;
};

export type KPayWithdrawResponse = {
  id: string;
  reference: string;
  status: KPayPaymentStatus;
  amount: number;
  netAmount: number;
  feeAmount: number;
  currency: string;
  externalId: string;
  provider: string;
  phoneNumber: string;
  message: string;
};

export async function getWalletBalances(): Promise<KPayWalletBalance[]> {
  return kpayFetch<KPayWalletBalance[]>("/api/v1/payments/balance");
}

export async function getWalletBalancesWithCredentials(
  credentials: KPayCredentials,
): Promise<KPayWalletBalance[]> {
  return kpayFetchWithCredentials<KPayWalletBalance[]>(
    credentials,
    "/api/v1/payments/balance",
  );
}

export async function initWithdraw(
  params: KPayWithdrawParams,
): Promise<KPayWithdrawResponse> {
  return kpayFetch<KPayWithdrawResponse>("/api/v1/payments/withdraw", {
    method: "POST",
    body: JSON.stringify(params),
  });
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

  return expected === signature.toLowerCase();
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

  return expected === sig.toLowerCase();
}
