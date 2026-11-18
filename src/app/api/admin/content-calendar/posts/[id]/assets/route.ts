import { NextResponse } from "next/server";
import { addContentCalendarAsset, addContentCalendarLink } from "@/lib/content-calendar/repository";
import { getAdminSession } from "@/lib/auth/session";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: RouteCtx) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const form = await request.formData();
  const urlField = form.get("url");
  const file = form.get("file");

  try {
    if (typeof urlField === "string" && urlField.trim()) {
      const asset = await addContentCalendarLink(id, urlField);
      return NextResponse.json(asset);
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file or url is required" }, { status: 400 });
    }
    const asset = await addContentCalendarAsset(id, file);
    return NextResponse.json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}