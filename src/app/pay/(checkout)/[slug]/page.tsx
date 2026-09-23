import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Mark from "@/components/Mark";
import { InvoiceView } from "@/components/payments/InvoiceView";
import { PaymentLegalNotice } from "@/components/payments/PaymentLegalNotice";
import { PayButton } from "@/components/payments/PayButton";
import { recordPaymentAudit } from "@/lib/db/payment-audit";
import { getPaymentLinkBySlug } from "@/lib/db/payment-links";
import { syncPaymentStatusFromKPay } from "@/lib/payments/actions";
import { SITE_NAME } from "@/lib/content";

async function maybeSyncPendingLink(link: Awaited<ReturnType<typeof getPaymentLinkBySlug>>) {
  if (!link?.kpayPaymentId || link.status !== "PENDING") return link;

  try {
    return await Promise.race([
      syncPaymentStatusFromKPay(link),
      new Promise<typeof link>((resolve) => {
        setTimeout(() => resolve(link), 8_000);
      }),
    ]);
  } catch {
    return link;
  }
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let link = await getPaymentLinkBySlug(slug);
  if (!link) notFound();

  link = (await maybeSyncPendingLink(link)) ?? link;

  recordPaymentAudit(link.id, "PAY_PAGE_VIEW", await headers());

  const isPaid = link.status === "PAID";

  return (
    <div className={`space-y-8 ${!isPaid ? "pb-44 md:pb-0" : ""}`}>
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

      {!isPaid && (
        <>
          <div className="hidden md:block">
            <PayButton
              slug={slug}
              allowedPaymentMethods={link.allowedPaymentMethods}
              amountUsd={link.amountUsd}
            />
          </div>
          <div className="md:hidden">
            <PayButton
              slug={slug}
              allowedPaymentMethods={link.allowedPaymentMethods}
              amountUsd={link.amountUsd}
              sticky
            />
          </div>
        </>
      )}

      <PaymentLegalNotice />
    </div>
  );
}
