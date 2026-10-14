import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  applySubscriptionCharge,
  resolveSubscriptionFromCharge,
} from "@/lib/subscriptions/actions";
import { verifyPaystackTransaction } from "@/lib/paystack/client";
import { getMaintenanceSubscriptionBySlug } from "@/lib/db/maintenance-subscriptions";

export default async function SubscribeReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const sub = await getMaintenanceSubscriptionBySlug(slug);
  if (!sub) notFound();

  if (sub.status === "ACTIVE") {
    redirect(`/pay/subscribe/${slug}`);
  }

  const reference = String(query.reference ?? query.trxref ?? "");
  if (reference) {
    try {
      const charge = await verifyPaystackTransaction(reference);
      const subscriptionId = await resolveSubscriptionFromCharge(charge);
      if (subscriptionId) {
        await applySubscriptionCharge(subscriptionId, charge);
        redirect(`/pay/subscribe/${slug}`);
      }
    } catch {
      // Show pending UI below.
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-line bg-panel p-8 text-center">
      <h1 className="text-xl font-semibold">Confirming subscription</h1>
      <p className="text-sm text-muted">
        We are verifying your card with Paystack. This usually takes a few seconds.
      </p>
      <Link
        href={`/pay/subscribe/${slug}`}
        className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        Back to subscription
      </Link>
    </div>
  );
}
