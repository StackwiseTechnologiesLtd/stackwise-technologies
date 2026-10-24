import { buildLlmsFullDocument } from "@/lib/site-knowledge";

export function GET() {
  return new Response(buildLlmsFullDocument(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
