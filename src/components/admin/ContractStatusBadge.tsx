import type { ContractStatus } from "@/lib/contracts/types";
import { contractStatusLabel } from "@/lib/contracts/types";

const styles: Record<ContractStatus, string> = {
  GENERATING: "bg-violet-950 text-violet-300",
  GENERATION_FAILED: "bg-red-950 text-red-300",
  PENDING_REVIEW: "bg-amber-950 text-amber-300",
  SENT: "bg-blue-950 text-blue-300",
  FEEDBACK_RECEIVED: "bg-orange-950 text-orange-300",
  ACCEPTED: "bg-emerald-950 text-emerald-300",
  IN_PROGRESS: "bg-sky-950 text-sky-300",
  COMPLETED: "bg-zinc-800 text-zinc-300",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-sm px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {contractStatusLabel(status)}
    </span>
  );
}
