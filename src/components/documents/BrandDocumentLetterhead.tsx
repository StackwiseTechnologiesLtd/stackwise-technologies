import Mark from "@/components/Mark";
import {
  BRAND_BURGUNDY,
  COMPANY_TAGLINE
} from "@/lib/company";
import { SITE_NAME } from "@/lib/content";

export function BrandDocumentLetterhead({
  documentLabel,
  compact = false,
  markId = "sw-brand-doc-mark",
}: {
  /** e.g. INVOICE, RECEIPT, SOW */
  documentLabel?: string;
  compact?: boolean;
  markId?: string;
}) {
  const markSize = compact ? "h-8 w-8" : "h-9 w-9";

  return (
    <header className="brand-doc-letterhead">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-0">
        <Mark className={`shrink-0 ${markSize}`} gradientId={markId} />
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-[1em] font-bold leading-snug tracking-tight"
              style={{ color: BRAND_BURGUNDY }}
            >
              {SITE_NAME}
            </p>
            <p className="mt-0.5 text-[0.833em] leading-snug text-[#64748b]">
              {COMPANY_TAGLINE}
            </p>
          </div>
          {documentLabel ? (
            <p
              className="brand-doc-type-label max-w-[5.5rem] shrink-0 text-right sm:max-w-none"
              style={{ color: BRAND_BURGUNDY }}
              title={documentLabel}
            >
              {documentLabel}
            </p>
          ) : null}
        </div>
      </div>

      {/* <ul className="brand-doc-contact-row" aria-label="Company contact">
        {companyDocumentContacts.map((line, index) => {
          const isEmail = line.includes("@");
          const isWeb = line.includes(".") && !line.startsWith("RC");
          const href = isEmail
            ? `mailto:${line}`
            : isWeb
              ? COMPANY_WEBSITE_URL
              : undefined;
          return (
            <li key={line}>
              {index > 0 ? (
                <span className="brand-doc-contact-sep" aria-hidden>·</span>
              ) : null}
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
      </ul> */}

      <div className="brand-doc-rule" aria-hidden />
    </header>
  );
}
