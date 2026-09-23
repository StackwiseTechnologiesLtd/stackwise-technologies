import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/format-datetime";
import { parseNotifyEmails } from "@/lib/emails/deliveryConfig";
import { sendEmail } from "@/lib/emails/sendEmail";
import { formatPaymentMethodLabel } from "@/lib/payments/manual-payment-methods";
import {
  displayPaymentReference,
  paidAmountLocal,
  paidAmountUsd,
} from "@/lib/payments/manual-payment";
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

function paymentDetailsBlock(link: PaymentLink): string {
  if (link.paymentSource !== "MANUAL" && !link.paymentMethod) {
    return "";
  }

  const lines = [
    `Payment method: ${formatPaymentMethodLabel(link.paymentMethod)}`,
    link.collectedAt || link.paidAt
      ? `Collected: ${formatDateTime(link.collectedAt ?? link.paidAt!)}`
      : null,
    link.paymentNotes ? `Notes: ${link.paymentNotes}` : null,
  ].filter(Boolean);

  return lines.length ? `\n\n${lines.join("\n")}` : "";
}

function baseMetadata(link: PaymentLink) {
  const reference = displayPaymentReference(link) ?? link.invoiceNumber;
  const amountUsd = paidAmountUsd(link);
  const amountLocal = paidAmountLocal(link);

  return {
    invoiceNumber: link.invoiceNumber,
    amountUsd: `$${amountUsd.toFixed(2)}`,
    amountLocal: formatMoney(amountLocal, link.currency),
    lineItemsSummary: lineItemsSummary(link),
    reference,
    paymentMethod: formatPaymentMethodLabel(link.paymentMethod),
    collectedAt:
      link.collectedAt || link.paidAt
        ? formatDateTime(link.collectedAt ?? link.paidAt!)
        : "",
    paymentNotes: link.paymentNotes ?? "",
    paymentDetails: paymentDetailsBlock(link),
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
