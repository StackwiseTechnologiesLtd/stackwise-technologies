"use client";

import type { ReactNode } from "react";

/** Growth sub-nav lives in AdminShell sidebar (nav-meta adminGrowthNavChildren). */
export function GrowthLayoutClient({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}
