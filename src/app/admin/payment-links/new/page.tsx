import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { PaymentLinkBuilder } from "@/components/admin/PaymentLinkBuilder";

export default async function NewPaymentLinkPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <PaymentLinkBuilder />;
}
