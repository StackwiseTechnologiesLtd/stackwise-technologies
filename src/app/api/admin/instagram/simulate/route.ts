import { after, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { handleInstagramCommentWebhook } from "@/lib/instagram/handle-comment-webhook";
import { processInstagramDelivery } from "@/lib/instagram/process-delivery";

export const dynamic = "force-dynamic";

/** Local/staging helper for 6.1 manual tests without Meta — disabled when NODE_ENV=production. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const queue: string[] = [];

  const { handled } = await handleInstagramCommentWebhook({
    metaAppId: null,
    body,
    processQueued: (deliveryId) => {
      queue.push(deliveryId);
    },
  });

  for (const deliveryId of queue) {
    after(() => processInstagramDelivery(deliveryId));
  }

  return NextResponse.json({ ok: true, handled, queued: queue.length });
}