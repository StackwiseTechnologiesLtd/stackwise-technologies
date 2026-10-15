import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { sendMaintenanceSubscriptionEmail } from "@/lib/emails/subscriptions";
import {
  listMaintenanceSubscriptions,
  saveMaintenanceSubscription,
} from "@/lib/db/maintenance-subscriptions";
import {
  createMaintenanceSubscription,
  enrichSubscriptionUsd,
} from "@/lib/subscriptions/actions";
import type { SubscriptionInterval } from "@/lib/subscriptions/types";
import { getPaystackChargeCurrencies } from "@/lib/paystack/currencies";
import { isPaystackConfigured } from "@/lib/paystack/environment";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscriptions = await listMaintenanceSubscriptions();
  return NextResponse.json({ subscriptions });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: "Configure PAYSTACK_SECRET_KEY before creating subscriptions" },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as {
      customerName?: string;
      customerEmail?: string;
      currency?: string;
      amountMajor?: number;
      interval?: SubscriptionInterval;
      description?: string;
      sendEmail?: boolean;
    };

    const allowed = getPaystackChargeCurrencies();
    const currency = (body.currency ?? allowed[0] ?? "KES").toUpperCase();

    const input = await enrichSubscriptionUsd({
      customerName: body.customerName?.trim() ?? "",
      customerEmail: body.customerEmail?.trim() ?? "",
      currency,
      amountMajor: Number(body.amountMajor),
      interval: body.interval ?? "monthly",
      description: body.description?.trim() ?? "",
    });

    if (!input.customerName || !input.customerEmail) {
      return NextResponse.json(
        { error: "Customer name and email are required" },
        { status: 400 },
      );
    }
    if (!input.description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    let subscription = await createMaintenanceSubscription(input);

    if (body.sendEmail) {
      await sendMaintenanceSubscriptionEmail(subscription);
      subscription = await saveMaintenanceSubscription({
        ...subscription,
        status: "SENT",
        sentAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create subscription" },
      { status: 400 },
    );
  }
}
