import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { listPaymentLinks } from "@/lib/db/payment-links";
import { createPaymentLink } from "@/lib/payments/actions";
import { sendPaymentLinkEmail } from "@/lib/emails/payments";
import type { LineItem } from "@/lib/payments/types";
import type { PaymentMethodsOption } from "@/lib/payments/payment-methods";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await listPaymentLinks();
  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      customerName?: string;
      customerEmail?: string;
      currency?: string;
      lineItems?: LineItem[];
      notes?: string;
      sendEmail?: boolean;
      allowedPaymentMethods?: PaymentMethodsOption;
    };

    if (!body.customerName?.trim() || !body.customerEmail?.trim()) {
      return NextResponse.json(
        { error: "Customer name and email are required" },
        { status: 400 },
      );
    }
    if (!body.lineItems?.length) {
      return NextResponse.json(
        { error: "At least one service is required" },
        { status: 400 },
      );
    }

    const link = await createPaymentLink({
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      currency: body.currency ?? process.env.DEFAULT_PAYMENT_CURRENCY ?? "XAF",
      lineItems: body.lineItems,
      notes: body.notes,
      allowedPaymentMethods: body.allowedPaymentMethods,
    });

    let saved = link;
    if (body.sendEmail) {
      await sendPaymentLinkEmail(link);
      const { savePaymentLink } = await import("@/lib/db/payment-links");
      saved = await savePaymentLink({
        ...link,
        status: "SENT",
        sentAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return NextResponse.json({ link: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create link" },
      { status: 400 },
    );
  }
}
