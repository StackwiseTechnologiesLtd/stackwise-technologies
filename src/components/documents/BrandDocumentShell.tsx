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
  printSurface = false,
  children,
  footerExtra,
  className = "",
}: {
  documentLabel?: string;
  compact?: boolean;
  markId?: string;
  /** Optimized for A4 print (no card chrome). */
  printSurface?: boolean;
  children: ReactNode;
  footerExtra?: ReactNode;
  className?: string;
}) {
  const [companyName] = companyFooterLines;

  return (
    <article
      className={`brand-doc relative overflow-hidden bg-white text-[#0f172a] ${
        printSurface ? "brand-doc-print-surface" : ""
      } ${className}`}
    >
      <div className="brand-doc-accent" style={{ backgroundColor: BRAND_BURGUNDY }} aria-hidden />
      <div className="brand-doc-watermark" aria-hidden />

      <div
        className={`brand-doc-inner relative ${compact ? "px-4 py-4" : "px-5 py-5 sm:px-7 sm:py-6"}`}
      >
        <BrandDocumentLetterhead
          documentLabel={documentLabel}
          compact={compact}
          markId={markId}
        />
        <div className="brand-doc-body">{children}</div>
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
