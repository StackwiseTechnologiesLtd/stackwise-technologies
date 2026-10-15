"use client";

import { GrowthSubnav } from "@/components/admin/growth/GrowthSubnav";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function GrowthLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <GrowthSubnav pathname={pathname} />
      {children}
    </div>
  );
}
