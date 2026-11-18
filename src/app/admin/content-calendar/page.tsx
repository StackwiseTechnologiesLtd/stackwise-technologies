import { redirect } from "next/navigation";
import { ContentCalendarPanel } from "@/components/admin/content-calendar/ContentCalendarPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminContentCalendarPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div>
      <AdminPageHeader
        title="Content calendar"
        description="Scripts, production notes, and media by channel. Images and video use R2 in production; small files stay in the database during local dev."
      />
      <ContentCalendarPanel />
    </div>
  );
}