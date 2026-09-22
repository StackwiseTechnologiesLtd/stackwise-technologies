import Link from "next/link";
import Mark from "@/components/Mark";
import {
  COMPANY_RC,
  COMPANY_WEBSITE,
  COMPANY_WEBSITE_URL,
} from "@/lib/company";
import { EMAIL, SITE_NAME } from "@/lib/content";

export default function PaymentLegalPage() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-[#334155]">
      <div className="flex items-center gap-3">
        <Mark className="h-9 w-9" />
        <div>
          <p className="font-semibold text-[#0f172a]">{SITE_NAME}</p>
          <p className="text-[#64748b]">Payment processing &amp; data notice</p>
        </div>
      </div>

      <section className="space-y-3">
        <h1 className="text-xl font-semibold text-[#0f172a]">
          How we handle payments and your data
        </h1>
        <p>
          This notice applies when you pay an invoice issued by {SITE_NAME}{" "}
          through our secure payment pages ({COMPANY_WEBSITE}/pay/…).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-[#0f172a]">Payment processor</h2>
        <p>
          Card and Mobile Money payments are processed by{" "}
          <a href="https://kpay.site" className="underline" target="_blank" rel="noopener noreferrer">
            KPay
          </a>
          . When you choose a payment method you are redirected to KPay&apos;s
          hosted checkout. KPay collects the information required to complete
          the transaction under their terms and privacy policy.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-[#0f172a]">What we collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Name and email address provided on the invoice</li>
          <li>Invoice line items, amounts, and currency conversion rates</li>
          <li>Payment status, KPay reference, and completion timestamp</li>
          <li>
            IP address and browser user agent on pay pages, stored for internal
            auditing (not shared with third parties)
          </li>
        </ul>
        <p>
          We do <strong>not</strong> receive or store card numbers, CVV codes,
          or mobile-money PINs.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-[#0f172a]">Receipts</h2>
        <p>
          After a successful payment we email a receipt link to the address on
          the invoice. Receipt pages are only available once payment is
          confirmed. You may print the receipt for your records; it is
          formatted for A4 paper.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-[#0f172a]">Data retention</h2>
        <p>
          Payment records are retained for accounting, tax, and dispute
          resolution for as long as required by applicable law and our internal
          policies.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-[#0f172a]">Contact</h2>
        <p>
          {SITE_NAME} · RC: {COMPANY_RC}
          <br />
          Email:{" "}
          <a href={`mailto:${EMAIL}`} className="underline">
            {EMAIL}
          </a>
          <br />
          Web:{" "}
          <a href={COMPANY_WEBSITE_URL} className="underline">
            {COMPANY_WEBSITE}
          </a>
        </p>
      </section>

      <p>
        <Link href={COMPANY_WEBSITE_URL} className="text-[#64748b] underline">
          ← {COMPANY_WEBSITE}
        </Link>
      </p>
    </div>
  );
}
