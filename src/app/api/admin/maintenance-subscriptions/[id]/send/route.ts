import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  getMaintenanceSubscriptionById,
  saveMaintenanceSubscription,
} from "@/lib/db/maintenance-subscriptions";
import { sendMaintenanceSubscriptionEmail } from "@/lib/emails/subscriptions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const subscription = await getMaintenanceSubscriptionById(id);
  if (!subscription) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await sendMaintenanceSubscriptionEmail(subscription);
  const updated = await saveMaintenanceSubscription({
    ...subscription,
    status: subscription.status === "DRAFT" ? "SENT" : subscription.status,
    sentAt: Date.now(),
    updatedAt: Date.now(),
  });

  return NextResponse.json({ subscription: updated });
}
