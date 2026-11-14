import { after, NextResponse } from "next/server";
import { handleInstagramCommentWebhook } from "@/lib/instagram/handle-comment-webhook";
import {
  timingSafeEqualString,
  verifyMetaWebhookSignature,
} from "@/lib/instagram/meta-signature";
import { processInstagramDelivery } from "@/lib/instagram/process-delivery";
import { getMetaAppBySlug } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ appSlug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { appSlug } = await context.params;
  const app = await getMetaAppBySlug(appSlug);
  if (!app) {
    return NextResponse.json({ error: "Unknown app" }, { status: 404 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    timingSafeEqualString(token, app.webhookVerifyToken)
  ) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request, context: RouteContext) {
  const { appSlug } = await context.params;
  const app = await getMetaAppBySlug(appSlug);
  if (!app) {
    return NextResponse.json({ error: "Unknown app" }, { status: 404 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const valid = await verifyMetaWebhookSignature(
    rawBody,
    signature,
    app.appSecret,
  );
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const queue: string[] = [];

  const { handled } = await handleInstagramCommentWebhook({
    metaAppId: app.id,
    body,
    processQueued: (deliveryId) => {
      queue.push(deliveryId);
    },
  });

  for (const deliveryId of queue) {
    after(() => processInstagramDelivery(deliveryId));
  }

  return NextResponse.json({ ok: true, handled });
}