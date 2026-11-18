import { NextResponse } from "next/server";
import {
  deleteContentCalendarPost,
  getContentCalendarPost,
  updateContentCalendarPost,
} from "@/lib/content-calendar/repository";
import {
  contentCalendarChannels,
  contentCalendarStatuses,
  type ContentCalendarChannel,
  type ContentCalendarStatus,
} from "@/lib/content-calendar/types";
import { getAdminSession } from "@/lib/auth/session";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    const post = await getContentCalendarPost(id);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = (await request.json()) as {
    title?: string;
    scheduledOn?: string;
    scheduledTime?: string | null;
    channel?: string;
    status?: string;
    script?: string;
    notes?: string;
    accent?: string;
    projectId?: string | null;
  };

  try {
    const existing = await getContentCalendarPost(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const scheduledOn = body.scheduledOn ?? existing.scheduledOn;
    const title = body.title?.trim() || existing.title;
    if (!scheduledOn) {
      return NextResponse.json({ error: "scheduledOn is required" }, { status: 400 });
    }

    const channel =
      body.channel && contentCalendarChannels.includes(body.channel as ContentCalendarChannel)
        ? (body.channel as ContentCalendarChannel)
        : undefined;
    const status =
      body.status && contentCalendarStatuses.includes(body.status as ContentCalendarStatus)
        ? (body.status as ContentCalendarStatus)
        : undefined;

    const post = await updateContentCalendarPost(id, {
      title,
      scheduledOn,
      scheduledTime:
        body.scheduledTime !== undefined ? body.scheduledTime : existing.scheduledTime,
      channel: channel ?? existing.channel,
      status: status ?? existing.status,
      script: body.script ?? existing.script,
      notes: body.notes ?? existing.notes,
      accent: body.accent ?? existing.accent,
      projectId: body.projectId !== undefined ? body.projectId : existing.projectId,
    });
    return NextResponse.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    await deleteContentCalendarPost(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}