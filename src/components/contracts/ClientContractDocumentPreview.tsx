import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { DocumentA4Preview } from "@/components/documents/DocumentA4Preview";
import type { ContractEngagement } from "@/lib/contracts/types";

/** Fixed A4 client layout for admin read-only contract pages. */
export function ClientContractDocumentPreview({
  engagement,
}: {
  engagement: ContractEngagement;
}) {
  return (
    <DocumentA4Preview>
      <ContractDocumentView engagement={engagement} variant="admin" a4Fixed />
    </DocumentA4Preview>
  );
}
