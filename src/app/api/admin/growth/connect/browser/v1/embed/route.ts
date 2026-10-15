import { connectEmbedHtml } from "@/lib/growth/connect-embed-html";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";

export async function GET() {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  return new Response(connectEmbedHtml(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
