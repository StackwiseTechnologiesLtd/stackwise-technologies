import {
  getWalletBalancesWithCredentials,
  type KPayWalletBalance,
} from "@/lib/kpay/client";
import {
  getKPayCredentials,
  type PaymentEnvironment,
} from "@/lib/kpay/environment";

export type WalletSnapshot = {
  environment: PaymentEnvironment;
  configured: boolean;
  balances: KPayWalletBalance[];
  error?: string;
};

export async function fetchWalletSnapshot(
  environment: PaymentEnvironment,
): Promise<WalletSnapshot> {
  const credentials = getKPayCredentials(environment);
  if (!credentials) {
    return { environment, configured: false, balances: [] };
  }

  try {
    const balances = await getWalletBalancesWithCredentials(credentials);
    return { environment, configured: true, balances };
  } catch (error) {
    return {
      environment,
      configured: true,
      balances: [],
      error: error instanceof Error ? error.message : "Failed to fetch wallet",
    };
  }
}

export async function fetchAllWalletSnapshots(): Promise<{
  production: WalletSnapshot;
  test: WalletSnapshot;
}> {
  const [production, test] = await Promise.all([
    fetchWalletSnapshot("production"),
    fetchWalletSnapshot("test"),
  ]);
  return { production, test };
}
