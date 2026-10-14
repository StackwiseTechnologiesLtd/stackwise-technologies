import { PaymentLinksTable } from "@/components/admin/PaymentLinksTable";
import { PaymentSectionTotals } from "@/components/admin/PaymentSectionTotals";
import type { PaymentEnvironment } from "@/lib/kpay/environment";
import type { CardProcessor } from "@/lib/payments/processor";
import type { PaymentLink } from "@/lib/payments/types";

function PaymentLinkSection({
  title,
  description,
  environment,
  links,
  cardProcessor,
  emptyMessage,
}: {
  title: string;
  description: string;
  environment: PaymentEnvironment;
  links: PaymentLink[];
  cardProcessor: CardProcessor;
  emptyMessage: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <PaymentSectionTotals environment={environment} links={links} />

      <PaymentLinksTable
        links={links}
        cardProcessor={cardProcessor}
        emptyMessage={emptyMessage}
      />
    </section>
  );
}

export function PaymentLinksList({
  liveLinks,
  testLinks,
  showTestSection,
  cardProcessor,
}: {
  liveLinks: PaymentLink[];
  testLinks: PaymentLink[];
  showTestSection: boolean;
  cardProcessor: CardProcessor;
}) {
  return (
    <div className="space-y-8">
      <PaymentLinkSection
        title="Live payments"
        description="Live invoices (marked production when created with live Paystack or KPay keys)."
        environment="production"
        links={liveLinks}
        cardProcessor={cardProcessor}
        emptyMessage="No live payment links yet."
      />
      {showTestSection && (
        <PaymentLinkSection
          title="Test payments"
          description="Sandbox payment links — not included in live totals."
          environment="test"
          links={testLinks}
          cardProcessor={cardProcessor}
          emptyMessage="No test payment links yet."
        />
      )}
    </div>
  );
}
