"use client";

import { GrowthSubNavBar } from "@/components/admin/growth/GrowthSubNavBar";
import type { ReactNode } from "react";

export function GrowthLayoutClient({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-6">
      <GrowthSubNavBar />
      {children}
    </div>
  );
}
