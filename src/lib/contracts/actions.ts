import { generateContractDraft } from "@/lib/contracts/ai-draft";
import {
  createContractEngagementSeed,
  getContractEngagementById,
  getContractEngagementBySlug,
  saveContractEngagement,
  type CreateContractEngagementSeed,
} from "@/lib/db/contracts";
import {
  sendContractAdminReviewEmail,
  sendContractClientEmail,
  sendContractFeedbackNotifyEmail,
} from "@/lib/emails/contracts";
import { defaultMilestonesFromBrief } from "@/lib/contracts/milestones";
import type {
  ContractDeliveryPhase,
  ContractEngagement,
  ContractStatus,
} from "@/lib/contracts/types";
import type { ContractMilestone } from "@/lib/contracts/milestones";
import { createPaymentLink } from "@/lib/payments/actions";
import { sendPaymentLinkEmail } from "@/lib/emails/payments";
import { savePaymentLink } from "@/lib/db/payment-links";
import type { LineItem } from "@/lib/payments/types";
import { sendContractAcceptedNotifyEmail } from "@/lib/emails/contracts";

export type CreateContractInput = CreateContractEngagementSeed & {
  companyName?: string | null;
};

export async function createAndGenerateContract(
  input: CreateContractInput,
): Promise<ContractEngagement> {
  const seed = createContractEngagementSeed(input);
  await saveContractEngagement(seed);

  const draft = await generateContractDraft({
    documentKind: input.documentKind,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    companyName: input.companyName,
    servicesBrief: input.servicesBrief,
    commercialNotes: input.commercialNotes,
  });

  const status = draft.bodyMarkdown ? "PENDING_REVIEW" : "GENERATION_FAILED";
  const engagement: ContractEngagement = {
    ...seed,
    title: draft.title || `Agreement — ${input.customerName}`,
    bodyMarkdown: draft.bodyMarkdown,
    status: draft.aiError && !draft.usedAi ? "GENERATION_FAILED" : status,
    generationError: draft.aiError ?? null,
    updatedAt: Date.now(),
  };

  if (engagement.status === "GENERATION_FAILED" && engagement.bodyMarkdown) {
    engagement.status = "PENDING_REVIEW";
  }

  await saveContractEngagement(engagement);

  if (engagement.status === "PENDING_REVIEW") {
    try {
      await sendContractAdminReviewEmail(engagement);
    } catch (error) {
      console.error("[contracts] admin review email failed", error);
    }
  }

  return engagement;
}

export async function approveAndSendContractToClient(
  id: string,
): Promise<ContractEngagement> {
  const engagement = await getContractEngagementById(id);
  if (!engagement) {
    throw new Error("Contract not found");
  }
  if (engagement.status !== "PENDING_REVIEW" && engagement.status !== "FEEDBACK_RECEIVED") {
    throw new Error("Contract is not ready to send");
  }
  if (!engagement.bodyMarkdown.trim()) {
    throw new Error("Contract body is empty");
  }

  await sendContractClientEmail(engagement);

  const updated: ContractEngagement = {
    ...engagement,
    status: "SENT",
    sentAt: Date.now(),
    milestones:
      engagement.milestones.length > 0
        ? engagement.milestones
        : defaultMilestonesFromBrief(engagement.servicesBrief),
    progressHeadline:
      engagement.progressHeadline ??
      `Review and accept your ${engagement.reference} agreement`,
    updatedAt: Date.now(),
  };
  await saveContractEngagement(updated);
  return updated;
}

export async function saveContractDraftEdits(
  id: string,
  edits: { title?: string; bodyMarkdown?: string },
): Promise<ContractEngagement> {
  const engagement = await getContractEngagementById(id);
  if (!engagement) {
    throw new Error("Contract not found");
  }
  const editable =
    engagement.status === "PENDING_REVIEW" ||
    engagement.status === "FEEDBACK_RECEIVED" ||
    engagement.status === "GENERATION_FAILED";
  if (!editable && edits.bodyMarkdown !== undefined) {
    throw new Error("Cannot edit body in the current status");
  }

  const updated: ContractEngagement = {
    ...engagement,
    title: edits.title?.trim() ?? engagement.title,
    bodyMarkdown: edits.bodyMarkdown ?? engagement.bodyMarkdown,
    updatedAt: Date.now(),
  };
  await saveContractEngagement(updated);
  return updated;
}

export async function regenerateContractDraft(
  id: string,
): Promise<ContractEngagement> {
  const engagement = await getContractEngagementById(id);
  if (!engagement) {
    throw new Error("Contract not found");
  }

  const generating: ContractEngagement = {
    ...engagement,
    status: "GENERATING",
    generationError: null,
    updatedAt: Date.now(),
  };
  await saveContractEngagement(generating);

  const draft = await generateContractDraft({
    documentKind: engagement.documentKind,
    customerName: engagement.customerName,
    customerEmail: engagement.customerEmail,
    companyName: engagement.companyName,
    servicesBrief: engagement.servicesBrief,
    commercialNotes: engagement.commercialNotes,
  });

  const updated: ContractEngagement = {
    ...generating,
    title: draft.title || engagement.title,
    bodyMarkdown: draft.bodyMarkdown,
    status: "PENDING_REVIEW",
    generationError: draft.aiError ?? null,
    updatedAt: Date.now(),
  };
  await saveContractEngagement(updated);
  return updated;
}

export async function submitClientContractFeedback(
  slug: string,
  message: string,
): Promise<ContractEngagement> {
  const engagement = await getContractEngagementBySlug(slug);
  if (!engagement) {
    throw new Error("Contract not found");
  }
  const openForFeedback =
    engagement.status === "SENT" ||
    engagement.status === "FEEDBACK_RECEIVED" ||
    engagement.status === "ACCEPTED" ||
    engagement.status === "IN_PROGRESS";
  if (!openForFeedback) {
    throw new Error("This agreement is not open for feedback");
  }

  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Feedback message is required");
  }

  const updated: ContractEngagement = {
    ...engagement,
    clientFeedback: trimmed,
    clientFeedbackAt: Date.now(),
    status: "FEEDBACK_RECEIVED",
    updatedAt: Date.now(),
  };
  await saveContractEngagement(updated);

  try {
    await sendContractFeedbackNotifyEmail(updated);
  } catch (error) {
    console.error("[contracts] feedback notify failed", error);
  }

  return updated;
}

export async function acceptContractEngagement(
  slug: string,
  acceptedByName: string,
): Promise<ContractEngagement> {
  const engagement = await getContractEngagementBySlug(slug);
  if (!engagement) {
    throw new Error("Contract not found");
  }
  if (engagement.status !== "SENT" && engagement.status !== "FEEDBACK_RECEIVED") {
    throw new Error("This agreement cannot be accepted in its current state");
  }

  const name = acceptedByName.trim();
  if (!name) {
    throw new Error("Your name is required to accept");
  }

  const updated: ContractEngagement = {
    ...engagement,
    status: "ACCEPTED",
    acceptedAt: Date.now(),
    acceptedByName: name,
    deliveryPhase: "agreement",
    progressHeadline:
      engagement.progressHeadline ?? "Agreement accepted — delivery will begin after kickoff",
    updatedAt: Date.now(),
  };
  await saveContractEngagement(updated);

  try {
    await sendContractAcceptedNotifyEmail(updated);
  } catch (error) {
    console.error("[contracts] accept notify failed", error);
  }

  return updated;
}

export type UpdateEngagementTrackingInput = {
  deliveryPhase?: ContractDeliveryPhase;
  progressHeadline?: string | null;
  progressDetail?: string | null;
  milestones?: ContractMilestone[];
  status?: ContractStatus;
};

export async function updateEngagementTracking(
  id: string,
  input: UpdateEngagementTrackingInput,
): Promise<ContractEngagement> {
  const engagement = await getContractEngagementById(id);
  if (!engagement) {
    throw new Error("Contract not found");
  }

  let status = input.status ?? engagement.status;
  if (input.deliveryPhase === "active" && status === "ACCEPTED") {
    status = "IN_PROGRESS";
  }
  if (input.deliveryPhase === "complete") {
    status = "COMPLETED";
  }

  const updated: ContractEngagement = {
    ...engagement,
    deliveryPhase: input.deliveryPhase ?? engagement.deliveryPhase,
    progressHeadline:
      input.progressHeadline !== undefined
        ? input.progressHeadline
        : engagement.progressHeadline,
    progressDetail:
      input.progressDetail !== undefined
        ? input.progressDetail
        : engagement.progressDetail,
    milestones: input.milestones ?? engagement.milestones,
    status,
    updatedAt: Date.now(),
  };
  await saveContractEngagement(updated);
  return updated;
}

export async function createEngagementPaymentLink(
  engagementId: string,
  input: {
    currency: string;
    lineItems: LineItem[];
    notes?: string;
    sendEmail?: boolean;
  },
): Promise<{
  engagement: ContractEngagement;
  link: Awaited<ReturnType<typeof createPaymentLink>>;
}> {
  const engagement = await getContractEngagementById(engagementId);
  if (!engagement) {
    throw new Error("Contract not found");
  }

  const link = await createPaymentLink({
    customerName: engagement.customerName,
    customerEmail: engagement.customerEmail,
    currency: input.currency,
    lineItems: input.lineItems,
    notes: input.notes ?? `Linked to agreement ${engagement.reference}`,
    contractEngagementId: engagement.id,
  });

  let saved = link;
  if (input.sendEmail) {
    await sendPaymentLinkEmail(link);
    saved = await savePaymentLink({
      ...link,
      status: "SENT",
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  return { engagement, link: saved };
}
