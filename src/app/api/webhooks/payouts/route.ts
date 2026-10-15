import { handleKPayWebhookRequest } from "@/lib/kpay/webhook";

/** KPay payout (payment out) notifications. */
export async function POST(request: Request) {
  return handleKPayWebhookRequest(request);
}
