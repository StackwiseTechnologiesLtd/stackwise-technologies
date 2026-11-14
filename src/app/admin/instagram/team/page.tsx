import { InstagramTeamPanel } from "@/components/admin/instagram/InstagramTeamPanel";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { getInstagramAccessForEmail } from "@/lib/instagram/access";
import { listAccounts } from "@/lib/instagram/repository";
import { filterByAccountAccess } from "@/lib/instagram/access";

export default async function InstagramTeamPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const access = await getInstagramAccessForEmail(session.email);
  if (!access?.canManageTeam) redirect("/admin/instagram");

  const accounts = filterByAccountAccess(await listAccounts(), access);
  return <InstagramTeamPanel accounts={accounts} />;
}