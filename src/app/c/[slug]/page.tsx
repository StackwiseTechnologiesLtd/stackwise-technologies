import { notFound } from "next/navigation";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { ContractFeedbackForm } from "@/components/contracts/ContractFeedbackForm";
import { getContractEngagementBySlug } from "@/lib/db/contracts";

export default async function PublicContractPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const engagement = await getContractEngagementBySlug(slug);

  if (!engagement) notFound();

  if (engagement.status !== "SENT" && engagement.status !== "FEEDBACK_RECEIVED") {
    notFound();
  }

  return (
    <div>
      <ContractDocumentView engagement={engagement} />
      <ContractFeedbackForm slug={slug} />
    </div>
  );
}
