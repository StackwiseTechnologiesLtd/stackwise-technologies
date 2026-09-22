import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { recordPaymentAudit } from "@/lib/db/payment-audit";
import { handleGatewayReturn } from "@/lib/payments/return";

export default async function PayReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const handled = await handleGatewayReturn(slug, query);
  if (!handled) notFound();

  const { link, result } = handled;
  recordPaymentAudit(link.id, "RETURN_CALLBACK", await headers(), {
    outcome: result.outcome,
  });

  if (result.outcome === "receipt") {
    redirect(`/pay/${slug}/receipt`);
  }

  if (result.outcome === "pay") {
    redirect(`/pay/${slug}`);
  }

  return (
    <div className="space-y-6 rounded-xl border border-line bg-panel p-8 text-center">
      <h1 className="text-xl font-semibold">
        {result.outcome === "cancelled" ? "Payment cancelled" : "Payment status pending"}
      </h1>
      <p className="text-sm text-muted">
        {result.outcome === "cancelled"
          ? "You cancelled the payment. You can try again when ready."
          : "We are confirming your payment. This may take a moment."}
      </p>
      <Link
        href={`/pay/${slug}`}
        className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        Back to invoice
      </Link>
    </div>
  );
}
