import { NextResponse } from "next/server";
import { recordPaymentAudit } from "@/lib/db/payment-audit";
import type { CheckoutPaymentMethod } from "@/lib/kpay/buildGatewayInit";
import {
  initiateKPayPayment,
  initiatePaystackPayment,
} from "@/lib/payments/actions";
import { cardCheckoutProcessor } from "@/lib/payments/processor";

function parseMethod(value: unknown): CheckoutPaymentMethod {
  if (value === "MOBILE_MONEY") return "MOBILE_MONEY";
  return "CARD";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      method?: unknown;
    };
    const method = parseMethod(body.method);
    const processor = method === "CARD" ? cardCheckoutProcessor() : "KPAY";
    const { link, gatewayUrl } =
      processor === "PAYSTACK"
        ? await initiatePaystackPayment(slug)
        : await initiateKPayPayment(slug, method);
    recordPaymentAudit(link.id, "PAYMENT_INIT", request.headers, {
      method,
      processor,
    });
    return NextResponse.json({ gatewayUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment initiation failed";
    const status = message.includes("timed out") ? 504 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
