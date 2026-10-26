import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getBrandingViewer } from "@/lib/branding-portal/access";

export default async function BrandPortalProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const viewer = await getBrandingViewer();
  if (!viewer) {
    redirect("/branding/login");
  }
  return children;
}
