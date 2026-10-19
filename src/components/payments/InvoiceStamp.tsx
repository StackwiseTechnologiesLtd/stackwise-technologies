import Stamp from "@/components/Stamp.svg";

export function InvoiceStamp({
  compact = false,
  size,
}: {
  compact?: boolean;
  /** Receipt default; document = agreements / letter-style footer */
  size?: "receipt" | "document";
}) {
  const widthClass =
    size === "document"
      ? "w-32 sm:w-36"
      : compact
        ? "w-32"
        : "w-40 sm:w-48";

  return (
    <div
      className={`pointer-events-none absolute z-10 ${
        size === "document"
          ? "bottom-0 right-0 sm:bottom-1 sm:right-1"
          : compact
            ? "bottom-1 right-1"
            : "bottom-2 right-2 sm:bottom-3 sm:right-3"
      }`}
      aria-hidden="true"
    >
      <div
        className={`origin-bottom-right -rotate-[8deg] opacity-90 print:opacity-100 ${widthClass} [&_svg]:block [&_svg]:h-auto [&_svg]:w-full`}
      >
        <Stamp />
      </div>
    </div>
  );
}
