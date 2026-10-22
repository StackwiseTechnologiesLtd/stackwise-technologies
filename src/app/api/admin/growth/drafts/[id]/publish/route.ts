import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { publishDraftReply } from "@/lib/growth/publish-draft-reply";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let bodyText = "";
  try {
    const json = (await request.json()) as { bodyText?: string };
    bodyText = json.bodyText?.trim() ?? "";
  } catch {
    /* empty body → use stored draft text */
  }

  try {
    const draft = await publishDraftReply(id, bodyText);
    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
