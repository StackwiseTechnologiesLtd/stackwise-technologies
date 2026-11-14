import { NextResponse } from "next/server";
import {
  isInstagramApiError,
  requireAccountScope,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import {
  getInstagramConversation,
  listInstagramMessages,
} from "@/lib/instagram/inbox-repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  const { id } = await context.params;
  try {
    const conversation = await getInstagramConversation(id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const denied = requireAccountScope(ctx.access, conversation.accountId);
    if (denied) return denied;
    const messages = await listInstagramMessages(id);
    return NextResponse.json({ conversation, messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}