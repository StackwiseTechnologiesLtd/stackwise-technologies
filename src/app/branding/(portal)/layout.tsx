import type { ReactNode } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getBrandingViewer } from "@/lib/branding-portal/access";

export const dynamic = "force-dynamic";

export default async function BrandPortalProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const viewer = await getBrandingViewer();
  if (!viewer) {
    redirect("/branding/login");
  }
  return children;
}
