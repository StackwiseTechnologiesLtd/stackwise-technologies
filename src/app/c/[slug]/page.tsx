import { notFound } from "next/navigation";
import { EngagementPublicPortal } from "@/components/contracts/EngagementPublicPortal";
import { getContractEngagementBySlug } from "@/lib/db/contracts";
import { listPaymentLinksForEngagement } from "@/lib/db/payment-links";
import { isContractPortalPublic } from "@/lib/contracts/types";

export default async function PublicContractPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const engagement = await getContractEngagementBySlug(slug);

  if (!engagement || !isContractPortalPublic(engagement.status)) {
    notFound();
  }

  const paymentLinks = await listPaymentLinksForEngagement(engagement.id);

  return <EngagementPublicPortal engagement={engagement} paymentLinks={paymentLinks} />;
}
