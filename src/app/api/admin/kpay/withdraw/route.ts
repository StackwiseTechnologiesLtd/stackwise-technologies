import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { initWithdraw } from "@/lib/kpay/client";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      amount?: number;
      provider?: string;
      phoneNumber?: string;
      description?: string;
    };

    const amount = Number(body.amount);
    const provider = body.provider?.trim() ?? "";
    const phoneNumber = body.phoneNumber?.replace(/\D/g, "") ?? "";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!provider || !phoneNumber) {
      return NextResponse.json(
        { error: "Provider and phone number are required" },
        { status: 400 },
      );
    }

    const withdrawal = await initWithdraw({
      amount,
      provider,
      phoneNumber,
      externalId: `WD-${crypto.randomUUID()}`,
      description: body.description?.trim() || "Stackwise wallet withdrawal",
    });

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Withdrawal failed" },
      { status: 400 },
    );
  }
}
