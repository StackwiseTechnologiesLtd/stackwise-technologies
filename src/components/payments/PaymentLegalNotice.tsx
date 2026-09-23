import Link from "next/link";
import { COMPANY_WEBSITE, COMPANY_WEBSITE_URL } from "@/lib/company";
import { SITE_NAME } from "@/lib/content";

export function PaymentLegalNotice() {
  return (
    <footer className="mt-10 border-t border-[#e2e8f0] pt-6 text-xs leading-relaxed text-[#64748b] print:hidden">
      <p>
        Payments on this page are processed securely by{" "}
        <a
          href="https://kpay.site"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          KPay
        </a>{" "}
        (Mobile Money and card). {SITE_NAME} does not store card numbers or
        mobile-money PINs. We receive payment status, amount, and reference
        details to issue your invoice or receipt.
      </p>
      <p className="mt-2">
        By proceeding you agree to our{" "}
        <Link href="/pay/legal" className="underline">
          payment processing &amp; data notice
        </Link>
        . Contact and company details:{" "}
        <a href={COMPANY_WEBSITE_URL} className="underline">
          {COMPANY_WEBSITE}
        </a>
        .
      </p>
    </footer>
  );
}
