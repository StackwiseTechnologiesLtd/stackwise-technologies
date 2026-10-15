import type { ConnectMode } from "@/lib/growth/types";

import type { BrowserWorker } from "@cloudflare/puppeteer";

type BrowserBindingEnv = { BROWSER?: BrowserWorker };

export function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

/** Miniflare’s browser binding in `next dev` often fails (broken Chromium zip). Use local connect server instead. */
export function preferLocalConnectServer(): boolean {
  if (process.env.GROWTH_CONNECT_FORCE_LOCAL === "1") return true;
  if (process.env.GROWTH_CONNECT_USE_HOSTED_LOCAL === "1") return false;
  return process.env.NODE_ENV === "development";
}

export async function resolveGrowthConnect(
  request: Request,
): Promise<{ mode: ConnectMode; viewerBaseUrl: string }> {
  const origin = siteOrigin(request);

  const remoteBase = process.env.GROWTH_CONNECT_VIEWER_BASE?.trim();
  if (remoteBase) {
    return {
      mode: "relay",
      viewerBaseUrl: `${origin}/api/admin/growth/connect/relay`,
    };
  }

  if (preferLocalConnectServer()) {
    return {
      mode: "local",
      viewerBaseUrl: "http://127.0.0.1:9234",
    };
  }

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    if ((env as BrowserBindingEnv).BROWSER) {
      return {
        mode: "hosted",
        viewerBaseUrl: `${origin}/api/admin/growth/connect/browser`,
      };
    }
  } catch {
    /* next dev without worker bindings */
  }

  return {
    mode: "local",
    viewerBaseUrl: "http://127.0.0.1:9234",
  };
}
