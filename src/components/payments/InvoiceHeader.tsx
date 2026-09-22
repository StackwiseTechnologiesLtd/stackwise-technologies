import Mark from "@/components/Mark";
import {
  BRAND_BURGUNDY,
  COMPANY_TAGLINE,
  companyFooterLines,
} from "@/lib/company";

export function InvoiceHeader() {
  return (
    <header className="mb-8 border-b border-[#e2e8f0] pb-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Mark className="h-10 w-10 shrink-0" gradientId="sw-invoice-mark" />
          <div className="min-w-0">
            <p
              className="text-xl font-bold tracking-tight"
              style={{ color: BRAND_BURGUNDY }}
            >
              Stackwise
            </p>
          </div>
          <div
            className="hidden h-10 w-px shrink-0 sm:block"
            style={{ backgroundColor: BRAND_BURGUNDY }}
            aria-hidden="true"
          />
          <p
            className="hidden text-lg italic sm:block"
            style={{
              color: BRAND_BURGUNDY,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            {COMPANY_TAGLINE}
          </p>
        </div>

        <div className="shrink-0 text-left text-sm leading-6 text-[#334155] lg:text-right">
          {companyFooterLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <p
        className="mt-4 text-lg italic sm:hidden"
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
