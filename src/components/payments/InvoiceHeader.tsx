import Mark from "@/components/Mark";
import {
  BRAND_BURGUNDY,
  COMPANY_TAGLINE,
  companyFooterLines,
} from "@/lib/company";

export function InvoiceHeader({ compact = false }: { compact?: boolean }) {
  const [companyName, ...companyDetails] = companyFooterLines;

  return (
    <header
      className={`border-b border-[#e8ecf1] ${compact ? "mb-6 pb-5" : "mb-8 pb-6"}`}
    >
      <div
        className={`flex flex-col gap-4 ${
          compact ? "" : "sm:flex-row sm:items-center sm:justify-between"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <Mark
            className={`shrink-0 ${compact ? "h-9 w-9" : "h-11 w-11"}`}
            gradientId="sw-invoice-mark"
          />
          <p
            className={`shrink-0 font-bold tracking-tight ${compact ? "text-lg" : "text-xl"}`}
            style={{ color: BRAND_BURGUNDY }}
          >
            Stackwise
          </p>
          {!compact && (
            <>
              <div
                className="hidden h-10 w-px shrink-0 sm:block"
                style={{ backgroundColor: BRAND_BURGUNDY }}
                aria-hidden="true"
              />
              <p
                className="hidden min-w-0 text-lg italic sm:block"
                style={{
                  color: BRAND_BURGUNDY,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
              >
                {COMPANY_TAGLINE}
              </p>
            </>
          )}
        </div>

        <div
          className={`shrink-0 text-sm leading-6 text-[#334155] ${
            compact ? "text-left" : "text-left sm:text-right"
          }`}
        >
          <p className="font-semibold text-[#0f172a]">{companyName}</p>
          {companyDetails.map((line) => (
            <p key={line} className="text-[#475569]">
              {line}
            </p>
          ))}
        </div>
      </div>

      <p
        className={`text-base italic ${compact ? "mt-3" : "mt-4 sm:hidden"}`}
        style={{
          color: BRAND_BURGUNDY,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {COMPANY_TAGLINE}
      </p>
    </header>
  );
}
