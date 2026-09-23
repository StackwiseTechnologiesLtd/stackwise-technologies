import { handleKPayWebhookRequest } from "@/lib/kpay/webhook";

/** KPay refund notifications. */
export async function POST(request: Request) {
  return handleKPayWebhookRequest(request);
}
