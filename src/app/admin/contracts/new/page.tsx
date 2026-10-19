import Link from "next/link";
import { redirect } from "next/navigation";
import { ContractBuilder } from "@/components/admin/ContractBuilder";
import { getAdminSession } from "@/lib/auth/session";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    email?: string;
    company?: string;
    brief?: string;
    leadId?: string;
  }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const q = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/contracts" className="text-sm text-muted hover:text-foreground">
          ← Agreements
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New agreement</h1>
        <p className="mt-1 text-sm text-muted">
          Describe what the prospect needs. AI drafts the document; you approve before
          anything is emailed.
        </p>
      </div>

      <ContractBuilder
        initialCustomerName={q.name ?? ""}
        initialCustomerEmail={q.email ?? ""}
        initialCompanyName={q.company ?? ""}
        initialBrief={q.brief ?? ""}
        leadId={q.leadId}
      />
    </div>
  );
}
