import { verifyWebhookSignature, type KPayWebhookEvent } from "@/lib/kpay/client";
import { markPaymentFromWebhook } from "@/lib/payments/actions";

export async function handleKPayWebhookRequest(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("X-KPAY-Signature") ?? "";

  const valid = await verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as KPayWebhookEvent;
  await processKPayWebhookEvent(event);

  return Response.json({ received: true });
}

export async function processKPayWebhookEvent(event: KPayWebhookEvent): Promise<void> {
  if (
    event.event === "payment.completed" ||
    event.event === "payment.failed" ||
    event.event === "payment.cancelled"
  ) {
    const status =
      event.event === "payment.completed"
        ? "COMPLETED"
        : event.event === "payment.failed"
          ? "FAILED"
          : "CANCELLED";
    await markPaymentFromWebhook(event.externalId, status);
    return;
  }

  if (
    event.event === "refund.completed" ||
    event.event === "refund.failed" ||
    event.event === "refund.cancelled"
  ) {
    // Refund webhooks are acknowledged; payment link status can be extended later.
    console.info("[kpay:webhook:refund]", event.event, event.externalId);
    return;
  }

  if (
    event.event === "payout.completed" ||
    event.event === "payout.failed" ||
    event.event === "payout.cancelled"
  ) {
    console.info("[kpay:webhook:payout]", event.event, event.externalId);
  }
}
