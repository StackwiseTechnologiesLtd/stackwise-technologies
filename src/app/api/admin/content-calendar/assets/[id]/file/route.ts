import { contentDispositionFilename } from "@/lib/content-calendar/asset-download";
import { getContentCalendarAssetBlob } from "@/lib/content-calendar/repository";
import { getAdminSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: RouteCtx) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const forceDownload = new URL(request.url).searchParams.get("download") === "1";
  try {
    const blob = await getContentCalendarAssetBlob(id);
    if (!blob) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const inline =
      !forceDownload &&
      (blob.contentType === "application/pdf" ||
        blob.contentType.startsWith("image/") ||
        blob.contentType.startsWith("video/") ||
        blob.contentType.startsWith("audio/"));
    const headers: Record<string, string> = {
      "Content-Type": blob.contentType,
      "Cache-Control": "private, max-age=3600",
    };
    const safeName = contentDispositionFilename(blob.filename);
    if (forceDownload) {
      headers["Content-Disposition"] = `attachment; filename="${safeName}"`;
    } else if (inline) {
      headers["Content-Disposition"] = "inline";
    } else {
      headers["Content-Disposition"] = `attachment; filename="${safeName}"`;
    }
    return new NextResponse(blob.body, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}