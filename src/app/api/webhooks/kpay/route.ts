import { handleKPayWebhookRequest } from "@/lib/kpay/webhook";

/** Generic KPay callback — receives all event types when specific URLs are not set. */
export async function POST(request: Request) {
  return handleKPayWebhookRequest(request);
}
