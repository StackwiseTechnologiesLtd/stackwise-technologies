"use client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function GrowthConnectPage() {
  const params = useSearchParams();
  const platform = params.get("platform") === "x" ? "x" : "linkedin";
  const label = platform === "x" ? "X" : "LinkedIn";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Connect ${label}`}
        description="Log in through a real browser window on your computer. We never store your password."
      />

      <div className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <ol className="list-decimal space-y-4 pl-5 text-sm text-muted">
          <li>
            Install Playwright once:{" "}
            <code className="text-foreground">npm install -D playwright</code> then{" "}
            <code className="text-foreground">npx playwright install chromium</code>
          </li>
          <li>
            Set <code className="text-foreground">GROWTH_CONNECTOR_SECRET</code> in
            `.env.local` (same value as production).
          </li>
          <li>
            Run:{" "}
            <code className="text-foreground">
              node scripts/growth-connect.mjs {platform}
            </code>
          </li>
          <li>Complete login in the opened browser. The script uploads cookies and runs a health check.</li>
          <li>Return here and click Refresh on Growth settings to see status.</li>
        </ol>

        <p className="mt-6 text-sm text-muted">
          Harvesting (read-only) uses the same session with human pacing:{" "}
          <code className="text-foreground">
            node scripts/growth-harvest.mjs {platform}
          </code>
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/admin/growth/settings" className={ADMIN_BTN_SECONDARY}>
            Back to settings
          </Link>
        </div>
      </div>
    </div>
  );
}
