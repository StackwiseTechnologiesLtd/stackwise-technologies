import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { updateDraft } from "@/lib/growth/repository";
import { draftStatuses, type DraftStatus } from "@/lib/growth/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    bodyText?: string;
    imageNotes?: string | null;
    status?: DraftStatus;
    reviewNotes?: string | null;
    markPublished?: boolean;
    publishError?: string | null;
  };

  if (body.status && !draftStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const draft = await updateDraft(id, body);
    if (!draft) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
