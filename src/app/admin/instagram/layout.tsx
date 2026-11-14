import type { ReactNode } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { InstagramAppShell } from "@/components/admin/instagram/InstagramAppShell";
import { InstagramPortalExtras } from "@/components/admin/instagram/InstagramPortalExtras";
import { getAdminSession } from "@/lib/auth/session";
import { getInstagramAccessForEmail } from "@/lib/instagram/access";
import { gravatarUrl } from "@/lib/gravatar";

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
    <InstagramAppShell
      user={{
        email: session.email,
        avatarUrl: gravatarUrl(session.email, 72),
      }}
      access={{
        kind: access.kind,
        canManageTeam: access.canManageTeam,
      }}
    >
      <InstagramPortalExtras>
        <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
          {children}
        </Suspense>
      </InstagramPortalExtras>
    </InstagramAppShell>
  );
}