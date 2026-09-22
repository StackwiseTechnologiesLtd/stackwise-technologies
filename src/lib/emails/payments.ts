import { formatMoney } from "@/lib/currency";
import { parseNotifyEmails } from "@/lib/emails/deliveryConfig";
import { sendEmail } from "@/lib/emails/sendEmail";
import type { PaymentLink } from "@/lib/payments/types";

const VERSION = "0.0.1";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function lineItemsSummary(link: PaymentLink): string {
  return link.lineItems
    .map(
      (item) =>
        `${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ""} — $${(item.unitPriceUsd * item.quantity).toFixed(2)}`,
    )
    .join("; ");
}

function baseMetadata(link: PaymentLink) {
  return {
    invoiceNumber: link.invoiceNumber,
    amountUsd: `$${link.amountUsd.toFixed(2)}`,
    amountLocal: formatMoney(link.amountLocal, link.currency),
    lineItemsSummary: lineItemsSummary(link),
    reference: link.kpayReference ?? link.invoiceNumber,
    receiptUrl: `${siteUrl()}/pay/${link.slug}/receipt`,
    paymentUrl: `${siteUrl()}/pay/${link.slug}`,
  };
}

export async function sendPaymentLinkEmail(link: PaymentLink): Promise<void> {
  await sendEmail({
    to: link.customerEmail,
    template: "payment-link",
    version: VERSION,
    metadata: {
      ...baseMetadata(link),
      headline: `Payment request ${link.invoiceNumber}`,
      body: `Hi ${link.customerName}, please use the link below to pay for your Stackwise services via Mobile Money or card.`,
      ctaLabel: "Pay now",
    },
  });
}

export async function sendPaymentReceiptEmails(
  link: PaymentLink,
): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const metadata = baseMetadata(link);
  const customerHeadline = `Receipt ${link.invoiceNumber} — payment received`;
  const customerBody = `Hi ${link.customerName}, thank you. We received your payment for Stackwise services. Open the link below to view and print your receipt (formatted for A4).`;

  let customerSent = false;
  try {
    await sendEmail({
      to: link.customerEmail,
      template: "payment-receipt",
      version: VERSION,
      metadata: {
        ...metadata,
        headline: customerHeadline,
        body: customerBody,
      },
    });
    customerSent = true;
  } catch (error) {
    console.error("[email] customer receipt failed", error);
  }

  const adminEmails = parseNotifyEmails();
  let adminSent = false;
  if (adminEmails.length) {
    try {
      await sendEmail({
        to: adminEmails[0]!,
        bcc: adminEmails.length > 1 ? adminEmails.slice(1) : undefined,
        template: "payment-receipt",
        version: VERSION,
        metadata: {
          ...metadata,
          headline: `${metadata.amountUsd} payment received from ${link.customerName}`,
          body: `${link.customerName} (${link.customerEmail}) paid ${metadata.amountUsd} for invoice ${link.invoiceNumber}.`,
        },
      });
      adminSent = true;
    } catch (error) {
      console.error("[email] admin receipt failed", error);
    }
  }

  return { customerSent, adminSent };
}
