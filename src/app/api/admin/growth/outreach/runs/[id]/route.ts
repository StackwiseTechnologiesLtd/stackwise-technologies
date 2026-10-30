import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { formatOutreachCsv, formatOutreachMarkdown } from "@/lib/growth/outreach-export";
import { getOutreachRun } from "@/lib/growth/outreach-run";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await getOutreachRun(id);
  if (!data) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (format === "csv") {
    return new NextResponse(formatOutreachCsv(data.run, data.items), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="growth-outreach-${id.slice(0, 8)}.csv"`,
      },
    });
  }
  if (format === "md") {
    return new NextResponse(formatOutreachMarkdown(data.run, data.items), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="growth-outreach-${id.slice(0, 8)}.md"`,
      },
    });
  }

  return NextResponse.json(data);
}
