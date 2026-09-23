"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { formatMoney } from "@/lib/currency";
import { MANUAL_PAYMENT_METHODS } from "@/lib/payments/manual-payment-methods";
import type { PaymentLink } from "@/lib/payments/types";
import { BTN_PRIMARY } from "@/lib/ui/buttons";

function toDatetimeLocalValue(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function RecordManualPaymentForm({ link }: { link: PaymentLink }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [amountReceivedUsd, setAmountReceivedUsd] = useState(
    link.amountUsd.toFixed(2),
  );
  const [amountReceivedLocal, setAmountReceivedLocal] = useState(
    String(link.amountLocal),
  );
  const [collectedAt, setCollectedAt] = useState(() =>
    toDatetimeLocalValue(Date.now()),
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [sendReceipt, setSendReceipt] = useState(true);

  const canRecord = useMemo(
    () => link.status !== "PAID" && link.status !== "CANCELLED",
    [link.status],
  );

  if (!canRecord) {
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment-links/${link.id}/record-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          amountReceivedUsd: Number(amountReceivedUsd),
          amountReceivedLocal: Number(amountReceivedLocal),
          collectedAt: new Date(collectedAt).toISOString(),
          paymentReference,
          paymentNotes: paymentNotes.trim() || undefined,
          sendReceipt,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to record payment");
      toast.success(
        sendReceipt
          ? "Payment recorded and receipt emailed to customer."
          : "Payment recorded. You can email the receipt when ready.",
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-6">
      <h2 className="text-lg font-semibold">Record manual payment</h2>
      <p className="mt-1 text-sm text-muted">
        Mark this invoice as paid and generate a receipt with transaction details
        for the customer.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Payment method</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm"
          >
            {MANUAL_PAYMENT_METHODS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-muted">Amount received (USD)</span>
            <input
              type="number"
              min={0.01}
              step={0.01}
              required
              value={amountReceivedUsd}
              onChange={(e) => setAmountReceivedUsd(e.target.value)}
              className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm tabular-nums"
            />
            <span className="text-xs text-muted">
              Invoiced: ${link.amountUsd.toFixed(2)}
            </span>
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted">
              Amount received ({link.currency})
            </span>
            <input
              type="number"
              min={0.01}
              step={link.currency === "KES" || link.currency === "UGX" ? 1 : 0.01}
              required
              value={amountReceivedLocal}
              onChange={(e) => setAmountReceivedLocal(e.target.value)}
              className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm tabular-nums"
            />
            <span className="text-xs text-muted">
              Invoiced: {formatMoney(link.amountLocal, link.currency)}
            </span>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Time of collection</span>
          <input
            type="datetime-local"
            required
            value={collectedAt}
            onChange={(e) => setCollectedAt(e.target.value)}
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Payment reference</span>
          <input
            required
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            pattern="[A-Za-z0-9]{1,64}"
            title="Alphanumeric only, up to 64 characters"
            placeholder="TXN8F2K9A1"
            className="w-full rounded-lg border border-line bg-background px-3 py-2 font-mono text-sm"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Payment notes (optional)</span>
          <textarea
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            rows={3}
            placeholder="Bank name, MoMo sender name, wire memo, etc."
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendReceipt}
            onChange={(e) => setSendReceipt(e.target.checked)}
          />
          Email receipt to customer
        </label>

        <button type="submit" disabled={loading} className={BTN_PRIMARY}>
          {loading ? "Recording…" : "Record payment & generate receipt"}
        </button>
      </form>
    </section>
  );
}
