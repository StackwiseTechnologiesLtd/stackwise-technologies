import { notFound } from "next/navigation";
import { InvoiceView } from "@/components/payments/InvoiceView";
import { PrintButton } from "@/components/payments/PrintButton";
import { getPaymentLinkBySlug } from "@/lib/db/payment-links";
import { COMPANY_WEBSITE, COMPANY_WEBSITE_URL } from "@/lib/company";
import { SITE_NAME } from "@/lib/content";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await getPaymentLinkBySlug(slug);
  if (!link) notFound();

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-[#64748b]">{SITE_NAME} · Receipt</p>
        <PrintButton />
      </div>

      <InvoiceView link={link} showStatus={false} variant="receipt" />

      <p className="text-center text-xs text-[#64748b] print:text-gray-500">
        {SITE_NAME} ·{" "}
        <a href={COMPANY_WEBSITE_URL} className="underline">
          {COMPANY_WEBSITE}
        </a>
      </p>
    </div>
  );
}
