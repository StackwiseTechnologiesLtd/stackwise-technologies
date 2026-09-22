import type { PaymentEnvironment } from "@/lib/kpay/environment";

const styles: Record<PaymentEnvironment, string> = {
  production: "bg-emerald-950/80 text-emerald-300 ring-emerald-900/60",
  test: "bg-amber-950/80 text-amber-300 ring-amber-900/60",
};

const labels: Record<PaymentEnvironment, string> = {
  production: "Production",
  test: "Test",
};

export function EnvironmentBadge({
  environment,
  compact = false,
}: {
  environment: PaymentEnvironment;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[environment]}`}
    >
      {compact ? (environment === "test" ? "Test" : "Live") : labels[environment]}
    </span>
  );
}
