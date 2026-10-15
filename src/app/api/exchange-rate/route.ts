import { NextResponse } from "next/server";
import { convertUsdToCurrency } from "@/lib/currency";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "USD";
  const to = searchParams.get("to") ?? "XAF";
  const amount = Number.parseFloat(searchParams.get("amount") ?? "1");

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const { amount: converted, rate } = await convertUsdToCurrency(amount, to);
    return NextResponse.json({
      from,
      to,
      rate,
      amount,
      converted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversion failed" },
      { status: 400 },
    );
  }
}
