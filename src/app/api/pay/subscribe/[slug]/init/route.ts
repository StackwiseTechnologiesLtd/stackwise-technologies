import { NextResponse } from "next/server";
import { initiateMaintenanceSubscriptionCheckout } from "@/lib/subscriptions/actions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const { gatewayUrl } = await initiateMaintenanceSubscriptionCheckout(slug);
    return NextResponse.json({ gatewayUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start subscription";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
