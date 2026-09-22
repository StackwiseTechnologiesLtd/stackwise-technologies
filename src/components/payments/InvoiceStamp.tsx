import Stamp from "@/components/Stamp.svg";

export function InvoiceStamp() {
  return (
    <div
      className="pointer-events-none absolute -bottom-6 right-0 opacity-90 print:opacity-100"
      aria-hidden="true"
    >
      <div className="h-28 w-56 overflow-hidden [&_svg]:h-full [&_svg]:w-full [&_svg]:object-contain">
        <Stamp />
      </div>
    </div>
  );
}
