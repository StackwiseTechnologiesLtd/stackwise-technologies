import { NextResponse } from "next/server";
import {
  isInstagramApiError,
  requireAccountScope,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import {
  findInstagramConversationByParticipant,
  listInstagramConversations,
} from "@/lib/instagram/inbox-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId")?.trim();
  const participantIgsid = url.searchParams.get("participantIgsid")?.trim();

  try {
    if (accountId && participantIgsid) {
      const denied = requireAccountScope(ctx.access, accountId);
      if (denied) return denied;
      const conversation = await findInstagramConversationByParticipant({
        accountId,
        participantIgsid,
      });
      return NextResponse.json({ conversation });
    }
    const conversations = await listInstagramConversations(ctx.access.accountIds);
    return NextResponse.json({ conversations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}