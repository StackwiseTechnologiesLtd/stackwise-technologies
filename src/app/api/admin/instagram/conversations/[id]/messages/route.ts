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
    const url = new URL(_request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("limit") ?? url.searchParams.get("pageSize") ?? "50")),
    );
    const offset = (page - 1) * pageSize;
    const { messages, total } = await listInstagramMessages(id, {
      limit: pageSize,
      offset,
    });
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    return NextResponse.json({
      conversation,
      messages,
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