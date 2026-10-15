"use client";

import { useState } from "react";
import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { WalletBalancesLoader } from "@/components/admin/WalletBalancesLoader";
import { useToast } from "@/components/ToastProvider";
import type { PaymentEnvironment } from "@/lib/kpay/environment";
import { KPAY_WITHDRAW_PROVIDERS } from "@/lib/kpay/providers";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BTN_PRIMARY, ADMIN_INPUT } from "@/lib/ui/admin";

export function WithdrawPanel({
  environment,
  paystackEnabled = false,
}: {
  environment: PaymentEnvironment;
  paystackEnabled?: boolean;
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
      <AdminPageHeader
        title="Withdraw funds"
        description={
          <>
            Transfer from your{" "}
            <EnvironmentBadge environment={environment} compact /> KPay wallet to
            Mobile Money. Card settlements through Paystack are withdrawn from
            the Paystack dashboard, not here.
          </>
        }
      />

      {paystackEnabled && (
        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 text-sm text-muted">
          <p className="font-medium text-foreground">Paystack card balance</p>
          <p className="mt-1">
            Payouts and bank transfers for Paystack card payments are managed in{" "}
            <a
              href="https://dashboard.paystack.com/#/settings/payouts"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Paystack → Settings → Payouts
            </a>
            . This page only withdraws KPay Mobile Money wallet funds.
          </p>
        </div>
      )}

      <WalletBalancesLoader environment={environment} refreshKey={refreshKey} />

      <form
        onSubmit={submit}
        className="space-y-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6"
      >
        <label className="block space-y-2">
          <span className="text-sm text-muted">Mobile Money provider</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className={ADMIN_INPUT}
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
            className={ADMIN_INPUT}
            placeholder="5000"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Recipient phone (international, no +)</span>
          <input
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className={ADMIN_INPUT}
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
            className={ADMIN_INPUT}
            placeholder="Consulting payout"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className={ADMIN_BTN_PRIMARY}
        >
          {loading ? "Processing…" : "Withdraw to Mobile Money"}
        </button>
      </form>
    </div>
  );
}
