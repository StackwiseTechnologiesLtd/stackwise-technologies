import type { ReactNode } from "react";
import { BrandDocumentLetterhead } from "@/components/documents/BrandDocumentLetterhead";
import {
  BRAND_BURGUNDY,
  companyDocumentContacts,
  companyFooterLines,
} from "@/lib/company";

export function BrandDocumentShell({
  documentLabel,
  compact = false,
  markId,
  children,
  footerExtra,
  className = "",
}: {
  documentLabel?: string;
  compact?: boolean;
  markId?: string;
  children: ReactNode;
  footerExtra?: ReactNode;
  className?: string;
}) {
  const [companyName] = companyFooterLines;

  return (
    <article
      className={`brand-doc relative overflow-hidden bg-white text-[#0f172a] ${className}`}
    >
      <div className="brand-doc-accent" style={{ backgroundColor: BRAND_BURGUNDY }} aria-hidden />
      <div className="brand-doc-watermark" aria-hidden />

      <div className={`relative ${compact ? "px-5 py-5" : "px-6 py-6 sm:px-10 sm:py-8"}`}>
        <BrandDocumentLetterhead
          documentLabel={documentLabel}
          compact={compact}
          markId={markId}
        />
        <div className={compact ? "mt-5" : "mt-7"}>{children}</div>
      </div>

      <footer className="brand-doc-footer">
        <p className="font-semibold" style={{ color: BRAND_BURGUNDY }}>
          {companyName}
        </p>
        <p className="mt-1">{companyDocumentContacts.join(" · ")}</p>
        {footerExtra}
      </footer>
    </article>
  );
}
