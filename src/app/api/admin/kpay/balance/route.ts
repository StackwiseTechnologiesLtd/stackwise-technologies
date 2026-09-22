import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getWalletBalances } from "@/lib/kpay/client";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const balances = await getWalletBalances();
    return NextResponse.json({ balances });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch balance" },
      { status: 500 },
    );
  }
}
