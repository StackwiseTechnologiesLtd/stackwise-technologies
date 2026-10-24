import { redirect } from "next/navigation";

/** Pipeline UI moved to CRM; keep route for old bookmarks. */
export default function GrowthLeadsPage() {
  redirect("/admin/crm");
}
