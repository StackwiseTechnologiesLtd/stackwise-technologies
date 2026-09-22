import { redirect } from "next/navigation";
import { WithdrawPanel } from "@/components/admin/WithdrawPanel";
import { getAdminSession } from "@/lib/auth/session";
import { isKPayTestMode } from "@/lib/kpay/environment";

export default async function WithdrawPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const environment = isKPayTestMode() ? "test" : "production";
  return <WithdrawPanel environment={environment} />;
}
