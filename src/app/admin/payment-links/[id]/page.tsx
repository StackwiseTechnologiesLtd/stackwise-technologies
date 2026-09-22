import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { getPaymentLinkById } from "@/lib/db/payment-links";
import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { SendLinkButton } from "@/components/admin/SendLinkButton";
import { InvoiceView } from "@/components/payments/InvoiceView";
import { resolvePaymentEnvironment } from "@/lib/kpay/environment";
import { canAccessReceipt } from "@/lib/payments/receipt-access";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export default async function PaymentLinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const link = await getPaymentLinkById(id);
  if (!link) notFound();

  const payUrl = `${siteUrl()}/pay/${link.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-muted hover:text-foreground">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{link.invoiceNumber}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EnvironmentBadge environment={resolvePaymentEnvironment(link)} />
            <p className="text-sm text-muted">{link.customerName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <SendLinkButton id={link.id} />
          {canAccessReceipt(link) && (
            <Link
              href={`/pay/${link.slug}/receipt`}
              className="rounded-lg border border-line px-4 py-2 text-sm transition hover:bg-panel-hover"
            >
              View receipt
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-background p-4">
        <p className="text-sm text-muted">Payment link</p>
        <a
          href={payUrl}
          className="mt-1 block break-all font-mono text-sm text-accent hover:underline"
        >
          {payUrl}
        </a>
      </div>

      <InvoiceView link={link} />
    </div>
  );
}
