"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/currency";
import { KPAY_WITHDRAW_PROVIDERS } from "@/lib/kpay/providers";

type Balance = {
  currency: string;
  balance: number;
  reservedBalance: number;
  availableBalance: number;
};

export function WithdrawPanel() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("MPESA_KEN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/kpay/balance")
      .then((res) => res.json())
      .then((data: { balances?: Balance[]; error?: string }) => {
        if (data.balances) setBalances(data.balances);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/kpay/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          provider,
          phoneNumber,
          description,
        }),
      });
      const data = (await res.json()) as {
        withdrawal?: { reference: string; message: string };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Withdrawal failed");
      setSuccess(
        `${data.withdrawal!.message} Reference: ${data.withdrawal!.reference}`,
      );
      setAmount("");
      const refreshed = await fetch("/api/admin/kpay/balance");
      const balanceData = (await refreshed.json()) as { balances?: Balance[] };
      if (balanceData.balances) setBalances(balanceData.balances);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }

  const selectedProvider = KPAY_WITHDRAW_PROVIDERS.find((p) => p.code === provider);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Withdraw funds</h1>
        <p className="mt-1 text-sm text-muted">
          Transfer from your KPay wallet to Mobile Money.
        </p>
      </div>

      {balances.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map((wallet) => (
            <div
              key={wallet.currency}
              className="rounded-xl border border-line bg-panel p-4"
            >
              <p className="text-sm text-muted">{wallet.currency} wallet</p>
              <p className="mt-1 text-xl font-semibold">
                {formatMoney(wallet.availableBalance, wallet.currency)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Reserved {formatMoney(wallet.reservedBalance, wallet.currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="space-y-4 rounded-xl border border-line bg-panel p-6"
      >
        <label className="block space-y-2">
          <span className="text-sm text-muted">Mobile Money provider</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-lg border border-line bg-background px-3 py-2"
          >
            {KPAY_WITHDRAW_PROVIDERS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label} ({p.currency})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">
            Amount {selectedProvider ? `(${selectedProvider.currency})` : ""}
          </span>
          <input
            type="number"
            min={1}
            step={1}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-line bg-background px-3 py-2"
            placeholder="5000"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Recipient phone (international, no +)</span>
          <input
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full rounded-lg border border-line bg-background px-3 py-2"
            placeholder="254703456789"
          />
          <p className="text-xs text-muted">
            Sandbox test (Kenya M-Pesa success): 254703456789
          </p>
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Description (optional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-line bg-background px-3 py-2"
            placeholder="Consulting payout"
          />
        </label>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-400">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Processing…" : "Withdraw to Mobile Money"}
        </button>
      </form>
    </div>
  );
}
