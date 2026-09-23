import type { PaymentLinkStatus } from "@/lib/payments/types";

const styles: Record<PaymentLinkStatus, string> = {
  DRAFT: "bg-zinc-800 text-zinc-300",
  SENT: "bg-blue-950 text-blue-300",
  PENDING: "bg-amber-950 text-amber-300",
  PAID: "bg-emerald-950 text-emerald-300",
  FAILED: "bg-red-950 text-red-300",
  CANCELLED: "bg-zinc-800 text-zinc-400",
  EXPIRED: "bg-zinc-800 text-zinc-500",
};

export function StatusBadge({ status }: { status: PaymentLinkStatus }) {
  return (
    <span
      className={`inline-flex rounded-sm w-fit px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
