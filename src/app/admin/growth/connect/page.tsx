"use client";

import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GrowthConnectPanel } from "@/components/admin/growth/GrowthConnectPanel";
import { useSearchParams } from "next/navigation";

function GrowthConnectContent() {
  const params = useSearchParams();
  const platform = params.get("platform") === "x" ? "x" : "linkedin";
  const label = platform === "x" ? "X" : "LinkedIn";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Connect ${label}`}
        description="Sign in inside the panel below. We save an encrypted session cookie, not your password."
      />
      <GrowthConnectPanel platform={platform} />
    </div>
  );
}

export default function GrowthConnectPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted">Loading connect…</p>}
    >
      <GrowthConnectContent />
    </Suspense>
  );
}
