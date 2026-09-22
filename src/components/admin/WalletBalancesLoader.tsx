"use client";

import { useEffect, useState } from "react";
import { WalletBalances } from "@/components/admin/WalletBalances";
import type { PaymentEnvironment } from "@/lib/kpay/environment";
import type { WalletSnapshot } from "@/lib/kpay/wallets";

export function WalletBalancesLoader({
  environment,
  refreshKey = 0,
}: {
  environment: PaymentEnvironment;
  refreshKey?: number;
}) {
  const [snapshot, setSnapshot] = useState<WalletSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadWallet() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/kpay/balance?environment=${environment}`,
        );
        const data = (await res.json()) as WalletSnapshot & { error?: string };
        if (cancelled) return;
        setSnapshot({
          environment,
          configured: data.configured ?? !data.error,
          balances: data.balances ?? [],
          error: data.error,
        });
      } catch {
        if (cancelled) return;
        setSnapshot({
          environment,
          configured: true,
          balances: [],
          error: "Failed to load wallet",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadWallet();

    return () => {
      cancelled = true;
    };
  }, [environment, refreshKey]);

  if (loading && !snapshot) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-line bg-panel"
          />
        ))}
      </div>
    );
  }

  return (
    <WalletBalances
      environment={environment}
      snapshot={
        snapshot ?? {
          environment,
          configured: false,
          balances: [],
        }
      }
    />
  );
}
