import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";

function remoteBase(): string | null {
  const base = process.env.GROWTH_CONNECT_VIEWER_BASE?.trim();
  return base ? base.replace(/\/$/, "") : null;
}

async function proxy(request: Request, pathSegments: string[]) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  const base = remoteBase();
  if (!base) {
    return NextResponse.json({ error: "Relay not configured" }, { status: 404 });
  }

  const path = pathSegments.join("/");
  const url = new URL(request.url);
  const target = `${base}/${path}${url.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const res = await fetch(target, init);
  const outHeaders = new Headers();
  const resType = res.headers.get("Content-Type");
  if (resType) outHeaders.set("Content-Type", resType);
  outHeaders.set("Cache-Control", "no-store");

  return new Response(res.body, { status: res.status, headers: outHeaders });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params;
  return proxy(request, path);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
