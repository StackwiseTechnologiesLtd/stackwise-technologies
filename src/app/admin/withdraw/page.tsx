import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { WithdrawPanel } from "@/components/admin/WithdrawPanel";

export default async function WithdrawPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <WithdrawPanel />;
}
