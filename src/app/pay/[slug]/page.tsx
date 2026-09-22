import { notFound } from "next/navigation";
import Mark from "@/components/Mark";
import { InvoiceView } from "@/components/payments/InvoiceView";
import { PayButton } from "@/components/payments/PayButton";
import { getPaymentLinkBySlug } from "@/lib/db/payment-links";
import { syncPaymentStatusFromKPay } from "@/lib/payments/actions";
import { SITE_NAME } from "@/lib/content";

export default async function PayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let link = await getPaymentLinkBySlug(slug);
  if (!link) notFound();

  if (link.kpayPaymentId && link.status === "PENDING") {
    link = await syncPaymentStatusFromKPay(link);
  }

  const isPaid = link.status === "PAID";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Mark className="h-8 w-8" />
        <div>
          <p className="font-semibold">{SITE_NAME}</p>
          <p className="text-sm text-muted">Secure payment</p>
        </div>
      </div>

      {isPaid ? (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-6 text-center">
          <p className="text-lg font-semibold text-emerald-300">Payment received</p>
          <p className="mt-2 text-sm text-muted">
            Thank you, {link.customerName}. Your payment for {link.invoiceNumber} is complete.
          </p>
          <a
            href={`/pay/${slug}/receipt`}
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            View receipt
          </a>
        </div>
      ) : link.status === "FAILED" || link.status === "CANCELLED" ? (
        <div className="rounded-xl border border-amber-900 bg-amber-950/30 p-4 text-sm text-amber-200">
          Previous payment attempt {link.status.toLowerCase()}. You can try again below.
        </div>
      ) : null}

      <InvoiceView link={link} showStatus={!isPaid} />

      {!isPaid && <PayButton slug={slug} />}
    </div>
  );
}
