"use client";

import { useState } from "react";
import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { WalletBalancesLoader } from "@/components/admin/WalletBalancesLoader";
import { useToast } from "@/components/ToastProvider";
import type { PaymentEnvironment } from "@/lib/kpay/environment";
import { KPAY_WITHDRAW_PROVIDERS } from "@/lib/kpay/providers";
import { BTN_PRIMARY } from "@/lib/ui/buttons";

export function WithdrawPanel({
  environment,
}: {
  environment: PaymentEnvironment;
}) {
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("MPESA_KEN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
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
      toast.success(
        `${data.withdrawal!.message} Reference: ${data.withdrawal!.reference}`,
      );
      setAmount("");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
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
          Transfer from your{" "}
          <EnvironmentBadge environment={environment} compact /> KPay wallet to
          Mobile Money.
        </p>
      </div>

      <WalletBalancesLoader environment={environment} refreshKey={refreshKey} />

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
          {environment === "test" && (
            <p className="text-xs text-muted">
              Sandbox test (Kenya M-Pesa success): 254703456789
            </p>
          )}
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

        <button
          type="submit"
          disabled={loading}
          className={BTN_PRIMARY}
        >
          {loading ? "Processing…" : "Withdraw to Mobile Money"}
        </button>
      </form>
    </div>
  );
}
