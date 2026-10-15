import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getPaymentLinkById } from "@/lib/db/payment-links";

export async function GET(
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

  return NextResponse.json({ link });
}
