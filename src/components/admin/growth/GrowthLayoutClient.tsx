"use client";

import { GrowthSubnav } from "@/components/admin/growth/GrowthSubnav";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function GrowthLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isConnect = pathname.startsWith("/admin/growth/connect");

  if (isConnect) {
    return <div className="min-w-0">{children}</div>;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside
        className="w-full shrink-0 lg:sticky lg:top-4 lg:w-52"
        aria-label="Growth navigation"
      >
        <GrowthSubnav pathname={pathname} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
