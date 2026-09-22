import { PaymentLinksTable } from "@/components/admin/PaymentLinksTable";
import { PaymentSectionTotals } from "@/components/admin/PaymentSectionTotals";
import type { PaymentEnvironment } from "@/lib/kpay/environment";
import type { PaymentLink } from "@/lib/payments/types";

function PaymentLinkSection({
  title,
  description,
  environment,
  links,
  emptyMessage,
}: {
  title: string;
  description: string;
  environment: PaymentEnvironment;
  links: PaymentLink[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <PaymentSectionTotals environment={environment} links={links} />

      {links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-panel/40 px-4 py-8 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      ) : (
        <PaymentLinksTable links={links} />
      )}
    </section>
  );
}

export function PaymentLinksList({
  liveLinks,
  testLinks,
  showTestSection,
}: {
  liveLinks: PaymentLink[];
  testLinks: PaymentLink[];
  showTestSection: boolean;
}) {
  return (
    <div className="space-y-8">
      <PaymentLinkSection
        title="Live payments"
        description="Production payment links from your database (kpay_is_test = false)."
        environment="production"
        links={liveLinks}
        emptyMessage="No live payment links yet."
      />
      {showTestSection && (
        <PaymentLinkSection
          title="Test payments"
          description="Sandbox payment links — not included in live totals."
          environment="test"
          links={testLinks}
          emptyMessage="No test payment links yet."
        />
      )}
    </div>
  );
}
