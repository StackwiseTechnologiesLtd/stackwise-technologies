import { NextResponse } from "next/server";
import {
  createContentCalendarPost,
  listContentCalendarPosts,
} from "@/lib/content-calendar/repository";
import {
  contentCalendarChannels,
  contentCalendarStatuses,
  type ContentCalendarChannel,
  type ContentCalendarStatus,
} from "@/lib/content-calendar/types";
import { getAdminSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const posts = await listContentCalendarPosts({ from, to });
    return NextResponse.json(
      { posts },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!body.title?.trim() || !body.scheduledOn) {
    return NextResponse.json({ error: "title and scheduledOn are required" }, { status: 400 });
  }

  const channel =
    body.channel && contentCalendarChannels.includes(body.channel as ContentCalendarChannel)
      ? (body.channel as ContentCalendarChannel)
      : undefined;
  const status =
    body.status && contentCalendarStatuses.includes(body.status as ContentCalendarStatus)
      ? (body.status as ContentCalendarStatus)
      : undefined;

  try {
    const post = await createContentCalendarPost({
      title: body.title,
      scheduledOn: body.scheduledOn,
      scheduledTime: body.scheduledTime,
      channel,
      status,
      script: body.script,
      notes: body.notes,
      accent: body.accent,
      projectId: body.projectId,
    });
    return NextResponse.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}