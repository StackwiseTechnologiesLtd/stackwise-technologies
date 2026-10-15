import { GrowthLayoutClient } from "@/components/admin/growth/GrowthLayoutClient";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

export default async function GrowthLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <GrowthLayoutClient>{children}</GrowthLayoutClient>;
}
