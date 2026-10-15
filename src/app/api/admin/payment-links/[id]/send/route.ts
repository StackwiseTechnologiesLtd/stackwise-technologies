import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getPaymentLinkById, savePaymentLink } from "@/lib/db/payment-links";
import { sendPaymentLinkEmail } from "@/lib/emails/payments";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const link = await getPaymentLinkById(id);
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await sendPaymentLinkEmail(link);
    const updated = await savePaymentLink({
      ...link,
      status: link.status === "DRAFT" ? "SENT" : link.status,
      sentAt: link.sentAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    return NextResponse.json({ link: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
