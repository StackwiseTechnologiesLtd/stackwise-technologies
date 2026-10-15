import { applyVerifiedPaystackTransaction } from "@/lib/payments/actions";
import {
  verifyPaystackSignature,
  verifyPaystackTransaction,
} from "@/lib/paystack/client";
import {
  applySubscriptionCharge,
  applySubscriptionWebhookEvent,
  resolveSubscriptionFromCharge,
} from "@/lib/subscriptions/actions";

type PaystackWebhookEvent = {
  event?: string;
  data?: Record<string, unknown> & { reference?: string };
};

export async function handlePaystackWebhookRequest(
  request: Request,
): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const valid = await verifyPaystackSignature(rawBody, signature);
  if (!valid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (
    event.event === "subscription.create" ||
    event.event === "subscription.disable" ||
    event.event === "subscription.not_renew"
  ) {
    await applySubscriptionWebhookEvent(event.event, event.data ?? {});
    return Response.json({ received: true });
  }

  if (event.event !== "charge.success" && event.event !== "charge.failed") {
    return Response.json({ received: true });
  }

  const reference = event.data?.reference;
  if (!reference) return Response.json({ received: true });

  try {
    const charge = await verifyPaystackTransaction(reference);
    const subscriptionId = await resolveSubscriptionFromCharge(charge);
    if (subscriptionId && event.event === "charge.success") {
      await applySubscriptionCharge(subscriptionId, charge);
      return Response.json({ received: true });
    }

    const result = await applyVerifiedPaystackTransaction(charge);
    if (result.status === "not_found" && event.event === "charge.success") {
      return Response.json({ error: "Payment link not found" }, { status: 404 });
    }
  } catch (error) {
    console.error(
      "[paystack:webhook]",
      error instanceof Error ? error.message : "verify failed",
    );
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
