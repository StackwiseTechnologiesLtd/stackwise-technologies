import { NextResponse } from "next/server";
import { recordPaymentAudit } from "@/lib/db/payment-audit";
import type { CheckoutPaymentMethod } from "@/lib/kpay/buildGatewayInit";
import { initiateKPayPayment } from "@/lib/payments/actions";

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
    const { link, gatewayUrl } = await initiateKPayPayment(slug, method);
    recordPaymentAudit(link.id, "PAYMENT_INIT", request.headers, { method });
    return NextResponse.json({ gatewayUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initiation failed" },
      { status: 400 },
    );
  }
}
