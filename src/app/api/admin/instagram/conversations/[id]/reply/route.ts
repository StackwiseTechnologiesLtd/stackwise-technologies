import { NextResponse } from "next/server";
import {
  isInstagramApiError,
  requireAccountScope,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import {
  isInstagramDryRun,
  sendInstagramDirectMessage,
} from "@/lib/instagram/graph-send";
import {
  getInstagramConversation,
  recordOutboundInstagramMessage,
} from "@/lib/instagram/inbox-repository";
import {
  getAccountAccessToken,
  getAccountIgUserId,
} from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  const { id } = await context.params;
  const body = (await request.json()) as { message?: string };
  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > 1000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  try {
    const conversation = await getInstagramConversation(id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const denied = requireAccountScope(ctx.access, conversation.accountId);
    if (denied) return denied;

    if (isInstagramDryRun()) {
      await recordOutboundInstagramMessage({
        accountId: conversation.accountId,
        participantIgsid: conversation.participantIgsid,
        participantUsername: conversation.participantUsername,
        bodyText: message,
        externalMessageId: "dry_run",
        sendStatus: "sent",
      });
      return NextResponse.json({ ok: true, messageId: "dry_run", dryRun: true });
    }

    const token = await getAccountAccessToken(conversation.accountId);
    if (!token) {
      return NextResponse.json({ error: "No access token on account" }, { status: 400 });
    }
    const igAccountId = await getAccountIgUserId(conversation.accountId);
    if (!igAccountId) {
      return NextResponse.json({ error: "Instagram account id missing" }, { status: 400 });
    }

    const result = await sendInstagramDirectMessage({
      igAccountId,
      recipientIgsid: conversation.participantIgsid,
      message,
      accessToken: token,
    });

    if (!result.ok) {
      await recordOutboundInstagramMessage({
        accountId: conversation.accountId,
        participantIgsid: conversation.participantIgsid,
        participantUsername: conversation.participantUsername,
        bodyText: message,
        externalMessageId: null,
        sendStatus: "failed",
        errorDetail: result.error,
      });
      return NextResponse.json(
        {
          error: result.error,
          hint: "Instagram only allows replies within the messaging window (typically 24 hours after the user's last message).",
        },
        { status: 422 },
      );
    }

    await recordOutboundInstagramMessage({
      accountId: conversation.accountId,
      participantIgsid: conversation.participantIgsid,
      participantUsername: conversation.participantUsername,
      bodyText: message,
      externalMessageId: result.messageId,
      sendStatus: "sent",
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}