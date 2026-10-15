import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { formatMoney } from "@/lib/currency";
import type { PaymentEnvironment } from "@/lib/kpay/environment";
import type { WalletSnapshot } from "@/lib/kpay/wallets";

export function WalletBalances({
  environment,
  snapshot,
}: {
  environment: PaymentEnvironment;
  snapshot: WalletSnapshot;
}) {
  if (!snapshot.configured) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-panel/40 px-4 py-5 text-sm text-muted">
        {environment === "production"
          ? "Add KPAY_LIVE_API_KEY and KPAY_LIVE_SECRET_KEY (or set live keys as KPAY_API_KEY) to view the live wallet."
          : "Add KPAY_TEST_API_KEY and KPAY_TEST_SECRET_KEY (or set test keys as KPAY_API_KEY) to view the test wallet."}
      </div>
    );
  }

  if (snapshot.error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-5 text-sm text-red-300">
        Could not load {environment === "production" ? "live" : "test"} wallet:{" "}
        {snapshot.error}
      </div>
    );
  }

  if (snapshot.balances.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-panel px-4 py-5 text-sm text-muted">
        No wallet balances returned from KPay.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {snapshot.balances.map((wallet) => (
        <div
          key={`${environment}-${wallet.currency}`}
          className="rounded-xl border border-line bg-panel p-4"
        >
          <div className="flex items-center gap-2">
            <EnvironmentBadge environment={environment} compact />
            <p className="text-sm text-muted">{wallet.currency} wallet</p>
          </div>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatMoney(wallet.availableBalance, wallet.currency)}
          </p>
          <p className="mt-1 text-xs text-muted tabular-nums">
            Reserved {formatMoney(wallet.reservedBalance, wallet.currency)}
          </p>
          <p className="mt-0.5 text-xs text-muted tabular-nums">
            Total {formatMoney(wallet.balance, wallet.currency)}
          </p>
        </div>
      ))}
    </div>
  );
}
