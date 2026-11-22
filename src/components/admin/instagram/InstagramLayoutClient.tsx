"use client";

import type { ReactNode } from "react";
import { InstagramSubNavBar } from "@/components/admin/instagram/InstagramSubNavBar";

export function InstagramLayoutClient({
  children,
  access,
}: {
  children: ReactNode;
  access: { canManageTeam: boolean; canManageMetaApps: boolean };
}) {
  return (
    <div className="min-w-0 space-y-6">
      <InstagramSubNavBar access={access} />
      {children}
    </div>
  );
}