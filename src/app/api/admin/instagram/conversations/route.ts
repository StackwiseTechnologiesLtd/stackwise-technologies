import { NextResponse } from "next/server";
import {
  isInstagramApiError,
  requireAccountScope,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import {
  findInstagramConversationByParticipant,
  listInstagramContactThreads,
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
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("limit") ?? url.searchParams.get("pageSize") ?? "25")),
    );
    const offset = (page - 1) * pageSize;
    const search = url.searchParams.get("q")?.trim() || null;
    const { threads, total } = await listInstagramContactThreads({
      accountIds: ctx.access.accountIds,
      limit: pageSize,
      offset,
      search,
    });
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    return NextResponse.json({
      threads,
      conversations: threads,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}