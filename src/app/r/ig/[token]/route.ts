import { getTrackedLinkTarget, recordTrackedLinkClick } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const target = await getTrackedLinkTarget(token);
  if (!target) {
    return new Response("Not found", { status: 404 });
  }

  const userAgent = request.headers.get("user-agent");
  await recordTrackedLinkClick(token, userAgent);

  return Response.redirect(target.targetUrl, 302);
}