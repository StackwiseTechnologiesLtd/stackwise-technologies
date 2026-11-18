import { redirect } from "next/navigation";
import { ContentCalendarPanel } from "@/components/admin/content-calendar/ContentCalendarPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminContentCalendarPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-2">
      <AdminPageHeader
        title="Content calendar"
        description="Plan posts with scripts, notes, and creative assets. Media lives in Cloudflare R2 (free tier) on deploy; local dev keeps small files in the database."
      />
      <ContentCalendarPanel />
    </div>
  );
}