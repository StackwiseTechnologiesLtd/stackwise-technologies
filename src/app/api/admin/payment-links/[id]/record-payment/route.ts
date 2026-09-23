import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  isManualPaymentMethod,
  type ManualPaymentMethod,
} from "@/lib/payments/manual-payment-methods";
import { recordManualPayment } from "@/lib/payments/manual-payment";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    paymentMethod?: string;
    amountReceivedUsd?: number;
    amountReceivedLocal?: number;
    collectedAt?: string;
    paymentReference?: string;
    paymentNotes?: string;
    sendReceipt?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.paymentMethod || !isManualPaymentMethod(body.paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  if (!body.paymentReference?.trim()) {
    return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
  }

  if (!body.collectedAt) {
    return NextResponse.json({ error: "Collection time is required" }, { status: 400 });
  }

  const collectedAt = new Date(body.collectedAt).getTime();
  if (!Number.isFinite(collectedAt)) {
    return NextResponse.json({ error: "Invalid collection time" }, { status: 400 });
  }

  try {
    const link = await recordManualPayment(
      id,
      {
        paymentMethod: body.paymentMethod as ManualPaymentMethod,
        amountReceivedUsd: Number(body.amountReceivedUsd),
        amountReceivedLocal: Number(body.amountReceivedLocal),
        collectedAt,
        paymentReference: body.paymentReference,
        paymentNotes: body.paymentNotes,
        sendReceipt: body.sendReceipt,
      },
      session.email,
    );
    return NextResponse.json({ link });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record payment";
    const status = message.includes("not found")
      ? 404
      : message.includes("already marked")
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
