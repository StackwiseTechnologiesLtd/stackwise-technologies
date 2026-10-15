import { handlePaystackWebhookRequest } from "@/lib/paystack/webhook";

/** Paystack charge webhook. Dashboard → Settings → API Keys & Webhooks. */
export async function POST(request: Request) {
  return handlePaystackWebhookRequest(request);
}
