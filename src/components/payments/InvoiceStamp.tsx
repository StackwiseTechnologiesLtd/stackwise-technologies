import Stamp from "@/components/Stamp.svg";

export function InvoiceStamp({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute z-10 ${
        compact ? "bottom-1 right-1" : "bottom-2 right-2 sm:bottom-3 sm:right-3"
      }`}
      aria-hidden="true"
    >
      <div
        className={`origin-bottom-right -rotate-[8deg] opacity-90 print:opacity-100 ${
          compact ? "w-32" : "w-40 sm:w-48"
        } [&_svg]:block [&_svg]:h-auto [&_svg]:w-full`}
      >
        <Stamp />
      </div>
    </div>
  );
}
