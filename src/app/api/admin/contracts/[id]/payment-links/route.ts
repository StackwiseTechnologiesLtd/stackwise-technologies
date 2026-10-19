import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createEngagementPaymentLink } from "@/lib/contracts/actions";
import type { LineItem } from "@/lib/payments/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    currency?: string;
    lineItems?: LineItem[];
    notes?: string;
    sendEmail?: boolean;
  };

  if (!body.lineItems?.length) {
    return NextResponse.json({ error: "lineItems required" }, { status: 400 });
  }

  try {
    const result = await createEngagementPaymentLink(id, {
      currency: body.currency ?? process.env.DEFAULT_PAYMENT_CURRENCY ?? "KES",
      lineItems: body.lineItems,
      notes: body.notes,
      sendEmail: body.sendEmail ?? false,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 400 },
    );
  }
}
