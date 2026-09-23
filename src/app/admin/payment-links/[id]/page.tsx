import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { getPaymentLinkById } from "@/lib/db/payment-links";
import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { PaymentAuditLog } from "@/components/admin/PaymentAuditLog";
import { ManualPaymentSummary } from "@/components/admin/ManualPaymentSummary";
import { RecordManualPaymentForm } from "@/components/admin/RecordManualPaymentForm";
import { ResendReceiptButton } from "@/components/admin/ResendReceiptButton";
import { SendLinkButton } from "@/components/admin/SendLinkButton";
import { InvoiceView } from "@/components/payments/InvoiceView";
import { resolvePaymentEnvironment } from "@/lib/kpay/environment";
import { canAccessReceipt } from "@/lib/payments/receipt-access";
import { PAYMENT_METHODS_OPTIONS } from "@/lib/payments/payment-methods";
import { BTN_SECONDARY } from "@/lib/ui/buttons";

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
          {!canAccessReceipt(link) && <SendLinkButton id={link.id} />}
          {canAccessReceipt(link) && (
            <>
              <Link
                href={`/pay/${link.slug}/receipt`}
                className={`text-sm ${BTN_SECONDARY}`}
              >
                View receipt
              </Link>
              <ResendReceiptButton id={link.id} />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-background p-4">
          <p className="text-sm text-muted">Payment methods</p>
          <p className="mt-1 text-sm font-medium">
            {
              PAYMENT_METHODS_OPTIONS.find(
                (option) => option.value === link.allowedPaymentMethods,
              )?.label
            }
          </p>
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
      </div>

      <ManualPaymentSummary link={link} />
      <RecordManualPaymentForm link={link} />

      <InvoiceView link={link} />

      {canAccessReceipt(link) && (
        <div className="rounded-xl border border-line bg-panel p-6">
          <h2 className="text-lg font-semibold">Customer receipt</h2>
          <p className="mt-1 text-sm text-muted">
            Preview what the customer sees. Use &quot;View receipt&quot; above to
            open the printable receipt or email it directly.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-[#eef2f6] p-3 sm:p-4">
            <InvoiceView link={link} variant="receipt" compact />
          </div>
        </div>
      )}

      <PaymentAuditLog paymentLinkId={link.id} />
    </div>
  );
}
