import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getBrandPortalSession } from "@/lib/branding-portal/session";

export default async function BrandPortalProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getBrandPortalSession();
  if (!session) {
    redirect("/branding/login");
  }
  return children;
}
