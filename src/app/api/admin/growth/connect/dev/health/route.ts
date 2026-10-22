import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import { isDevConnectRuntimeEnabled } from "@/lib/growth/dev-connect-flags";

export async function GET() {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  if (process.env.NODE_ENV !== "development" || !isDevConnectRuntimeEnabled()) {
    return NextResponse.json({ ok: false, error: "Not in dev mode" }, { status: 404 });
  }

  const { isDevConnectRuntimeReady } = await import(
    "@/lib/growth/dev-connect-runtime"
  );
  const ready = await isDevConnectRuntimeReady();
  if (!ready) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Playwright is not installed. Run: npm install -D playwright && npx playwright install chromium",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
