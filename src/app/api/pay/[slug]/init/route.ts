import { NextResponse } from "next/server";
import { initiateKPayPayment } from "@/lib/payments/actions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const { gatewayUrl } = await initiateKPayPayment(slug);
    return NextResponse.json({ gatewayUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initiation failed" },
      { status: 400 },
    );
  }
}
