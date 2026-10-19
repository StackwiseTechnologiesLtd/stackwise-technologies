import { NextResponse } from "next/server";
import { submitClientContractFeedback } from "@/lib/contracts/actions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = (await request.json()) as { message?: string };

  try {
    const engagement = await submitClientContractFeedback(slug, body.message ?? "");
    return NextResponse.json({ ok: true, status: engagement.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
