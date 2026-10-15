import Mark from "@/components/Mark";
import { BRAND_BURGUNDY, companyFooterLines } from "@/lib/company";

export function InvoiceHeader({ compact = false }: { compact?: boolean }) {
  const [companyName, ...companyDetails] = companyFooterLines;

  return (
    <header
      className={`border-b border-[#e8ecf1] ${compact ? "mb-6 pb-5" : "mb-8 pb-6"}`}
    >
      <div
        className={`flex flex-col gap-4 ${compact ? "" : "sm:flex-row sm:items-center sm:justify-between"
          }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Mark
            className={`shrink-0 ${compact ? "h-9 w-9" : "h-11 w-11"}`}
            gradientId="sw-invoice-mark"
          />
          <div className="flex flex-col gap-0.5">
            <p
              className={`shrink-0 font-bold tracking-tight ${compact ? "text-sm" : "text-md"}`}
              style={{ color: BRAND_BURGUNDY }}
            >
              {companyName}
            </p>
            <p className="font-semibold text-[#475569] text-xs">Engineering software at the speed of your business.</p>
          </div>
        </div>

        <div
          className={`shrink-0 text-xs leading-6 text-[#334155] ${compact ? "text-left" : "text-left sm:text-right"
            }`}
        >
          {/* <p className="font-semibold text-[#0f172a]">{companyName}</p> */}
          {companyDetails.map((line) => (
            <p key={line} className="text-[#475569]">
              {line}
            </p>
          ))}
        </div>
      </div>
    </header>
  );
}
