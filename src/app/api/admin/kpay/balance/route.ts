import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  isKPayTestMode,
  type PaymentEnvironment,
} from "@/lib/kpay/environment";
import { fetchWalletSnapshot } from "@/lib/kpay/wallets";

function parseEnvironment(value: string | null): PaymentEnvironment | null {
  if (value === "production" || value === "test") return value;
  return null;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const environment =
    parseEnvironment(searchParams.get("environment")) ??
    (isKPayTestMode() ? "test" : "production");

  const snapshot = await fetchWalletSnapshot(environment);
  return NextResponse.json(snapshot);
}
