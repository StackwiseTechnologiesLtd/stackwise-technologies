import Mark from "@/components/Mark";
import {
  BRAND_BURGUNDY,
  COMPANY_TAGLINE,
  companyDocumentContacts,
  COMPANY_WEBSITE_URL,
} from "@/lib/company";
import { SITE_NAME } from "@/lib/content";

export function BrandDocumentLetterhead({
  documentLabel,
  compact = false,
  markId = "sw-brand-doc-mark",
}: {
  /** e.g. INVOICE, RECEIPT, STATEMENT OF WORK */
  documentLabel?: string;
  compact?: boolean;
  markId?: string;
}) {
  return (
    <header className="brand-doc-letterhead">
      <div
        className={`flex flex-col gap-5 ${compact ? "" : "sm:flex-row sm:items-start sm:justify-between"}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <Mark
            className={`shrink-0 ${compact ? "h-10 w-10" : "h-12 w-12"}`}
            gradientId={markId}
          />
          <div className="min-w-0 pt-0.5">
            <p
              className={`font-bold tracking-tight ${compact ? "text-base" : "text-lg"}`}
              style={{ color: BRAND_BURGUNDY }}
            >
              {SITE_NAME}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#64748b]">{COMPANY_TAGLINE}</p>
          </div>
        </div>

        <div
          className={`shrink-0 ${compact ? "text-left" : "text-left sm:text-right"}`}
        >
          {documentLabel ? (
            <p
              className="brand-doc-type-label"
              style={{ color: BRAND_BURGUNDY }}
            >
              {documentLabel}
            </p>
          ) : null}
          <ul
            className={`brand-doc-contact brand-doc-contact--end mt-2 ${compact ? "text-[11px]" : "text-xs"}`}
            aria-label="Company contact"
          >
            {companyDocumentContacts.map((line) => {
              const isEmail = line.includes("@");
              const isWeb = line.includes(".");
              const href = isEmail
                ? `mailto:${line}`
                : isWeb && !line.startsWith("RC")
                  ? COMPANY_WEBSITE_URL
                  : undefined;
              return (
                <li key={line}>
                  {href ? (
                    <a href={href} className="brand-doc-contact-link">
                      {line}
                    </a>
                  ) : (
                    line
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="brand-doc-rule" aria-hidden />
    </header>
  );
}
