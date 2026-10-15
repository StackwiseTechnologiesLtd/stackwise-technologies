import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { resendPaymentReceipt } from "@/lib/payments/manual-payment";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const link = await resendPaymentReceipt(id);
    return NextResponse.json({ link });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send receipt";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
