import { connectEmbedHtml } from "@/lib/growth/connect-embed-html";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import { isDevConnectRuntimeEnabled } from "@/lib/growth/dev-connect-runtime";

export async function GET() {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  if (!isDevConnectRuntimeEnabled()) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(connectEmbedHtml(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
