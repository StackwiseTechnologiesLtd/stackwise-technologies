import { sendEmail } from "@/lib/emails/sendEmail";
import { formatMoney } from "@/lib/currency";
import {
  formatSubscriptionInterval,
  subscriptionAmountMajor,
  type MaintenanceSubscription,
} from "@/lib/subscriptions/types";

const VERSION = "0.0.1";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function sendMaintenanceSubscriptionEmail(
  sub: MaintenanceSubscription,
): Promise<void> {
  const subscribeUrl = `${siteUrl()}/pay/subscribe/${sub.slug}`;
  const amount = formatMoney(subscriptionAmountMajor(sub), sub.currency);

  await sendEmail({
    to: sub.customerEmail,
    template: "payment-link",
    version: VERSION,
    metadata: {
      invoiceNumber: `Maintenance · ${formatSubscriptionInterval(sub.interval)}`,
      amountUsd: sub.amountUsd != null ? `$${sub.amountUsd.toFixed(2)}` : amount,
      amountLocal: amount,
      lineItemsSummary: sub.description,
      reference: sub.paystackPlanCode ?? sub.slug,
      paymentMethod: "Paystack subscription (card)",
      collectedAt: "",
      paymentNotes: "",
      paymentDetails: "",
      receiptUrl: subscribeUrl,
      paymentUrl: subscribeUrl,
      headline: "Software maintenance subscription",
      body: `Hi ${sub.customerName}, use the link below to authorize ${formatSubscriptionInterval(sub.interval).toLowerCase()} card payments of ${amount} for: ${sub.description}`,
      ctaLabel: "Subscribe with card",
    },
  });
}
