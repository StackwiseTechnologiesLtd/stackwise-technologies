import { contractDocumentKindLabel } from "@/lib/contracts/types";
import type { ContractEngagement } from "@/lib/contracts/types";
import {
  contractAdminReviewUrl,
  contractClientUrl,
} from "@/lib/contracts/urls";
import { parseNotifyEmails } from "@/lib/emails/deliveryConfig";
import { sendEmail } from "@/lib/emails/sendEmail";

const VERSION = "0.0.1";

export async function sendContractAdminReviewEmail(
  engagement: ContractEngagement,
): Promise<void> {
  const adminEmails = parseNotifyEmails();
  if (!adminEmails.length) {
    console.info("[contracts] no ADMIN_NOTIFY_EMAILS — skip admin review email");
    return;
  }

  const reviewUrl = contractAdminReviewUrl(engagement);
  const kind = contractDocumentKindLabel(engagement.documentKind);

  await sendEmail({
    to: adminEmails[0]!,
    bcc: adminEmails.length > 1 ? adminEmails.slice(1) : undefined,
    template: "contract-admin-review",
    version: VERSION,
    metadata: {
      headline: `Review draft ${engagement.reference}`,
      body: `AI drafted a ${kind} for ${engagement.customerName} (${engagement.customerEmail}). Review the text, edit if needed, then approve and send to the client.`,
      customerName: engagement.customerName,
      reference: engagement.reference,
      documentTitle: engagement.title,
      reviewUrl,
    },
  });
}

export async function sendContractClientEmail(
  engagement: ContractEngagement,
): Promise<void> {
  const contractUrl = contractClientUrl(engagement);

  await sendEmail({
    to: engagement.customerEmail,
    template: "contract-client",
    version: VERSION,
    metadata: {
      headline: engagement.title,
      body: `Hi ${engagement.customerName}, please review your agreement with Stackwise. Use the link below to read the document and share any comments or requested changes.`,
      customerName: engagement.customerName,
      reference: engagement.reference,
      contractUrl,
      ctaLabel: "Review agreement",
    },
  });
}

export async function sendContractAcceptedNotifyEmail(
  engagement: ContractEngagement,
): Promise<void> {
  const adminEmails = parseNotifyEmails();
  if (!adminEmails.length) return;

  const reviewUrl = contractAdminReviewUrl(engagement);

  await sendEmail({
    to: adminEmails[0]!,
    bcc: adminEmails.length > 1 ? adminEmails.slice(1) : undefined,
    template: "contract-accepted",
    version: VERSION,
    metadata: {
      headline: `${engagement.reference} accepted`,
      body: `${engagement.acceptedByName ?? engagement.customerName} accepted the agreement. You can start delivery tracking and send invoices from the admin engagement page.`,
      customerName: engagement.customerName,
      reference: engagement.reference,
      reviewUrl,
    },
  });
}

export async function sendContractFeedbackNotifyEmail(
  engagement: ContractEngagement,
): Promise<void> {
  const adminEmails = parseNotifyEmails();
  if (!adminEmails.length) return;

  const reviewUrl = contractAdminReviewUrl(engagement);

  await sendEmail({
    to: adminEmails[0]!,
    bcc: adminEmails.length > 1 ? adminEmails.slice(1) : undefined,
    template: "contract-feedback",
    version: VERSION,
    metadata: {
      headline: `Feedback on ${engagement.reference}`,
      body: `${engagement.customerName} left feedback on the agreement. Open the admin review page to read it and send an updated version when ready.`,
      customerName: engagement.customerName,
      reference: engagement.reference,
      feedbackPreview: engagement.clientFeedback?.slice(0, 500) ?? "",
      reviewUrl,
    },
  });
}
