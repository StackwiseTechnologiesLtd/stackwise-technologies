import { handleKPayWebhookRequest } from "@/lib/kpay/webhook";

/** KPay deposit (payment in) notifications — payment.initiated, payment.completed, etc. */
export async function POST(request: Request) {
  return handleKPayWebhookRequest(request);
}
