"use client";

import { GrowthInstagramOAuthBanner } from "@/components/admin/growth/GrowthInstagramOAuthBanner";
import { Suspense, type ReactNode } from "react";

export function InstagramPortalExtras({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <GrowthInstagramOAuthBanner />
      </Suspense>
      {children}
    </>
  );
}