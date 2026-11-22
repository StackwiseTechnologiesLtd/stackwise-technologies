import type { ReactNode } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { InstagramLayoutClient } from "@/components/admin/instagram/InstagramLayoutClient";
import { InstagramPortalExtras } from "@/components/admin/instagram/InstagramPortalExtras";
import { getAdminSession } from "@/lib/auth/session";
import { getInstagramAccessForEmail } from "@/lib/instagram/access";
export default async function InstagramPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?next=/admin/instagram");

  const access = await getInstagramAccessForEmail(session.email);
  if (!access) redirect("/admin/login");

  return (
    <InstagramPortalExtras>
      <InstagramLayoutClient
        access={{
          canManageTeam: access.canManageTeam,
          canManageMetaApps: access.canManageMetaApps,
        }}
      >
        <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
          {children}
        </Suspense>
      </InstagramLayoutClient>
    </InstagramPortalExtras>
  );
}