"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { StackwiseSelect } from "@/components/stackwise";
import { ADMIN_BTN_PRIMARY, ADMIN_INPUT } from "@/lib/ui/admin";
import {
  SUBSCRIPTION_INTERVALS,
  type SubscriptionInterval,
} from "@/lib/subscriptions/types";

export function MaintenanceSubscriptionBuilder({
  currencies,
  defaultCurrency,
}: {
  currencies: Array<{ code: string; label: string }>;
  defaultCurrency: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [amountMajor, setAmountMajor] = useState("");
  const [interval, setInterval] = useState<SubscriptionInterval>("monthly");
  const [description, setDescription] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  const currencyOptions = useMemo(() => currencies, [currencies]);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/maintenance-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          currency,
          amountMajor: Number(amountMajor),
          interval,
          description,
          sendEmail,
        }),
      });
      const data = (await res.json()) as {
        subscription?: { id: string };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to create subscription");
      router.push(`/admin/subscriptions/${data.subscription!.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New maintenance subscription</h1>
        <p className="mt-1 text-sm text-muted">
          Creates a Paystack plan and sends the customer a link to authorize recurring
          card billing.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-line bg-panel p-6">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Customer name</span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={ADMIN_INPUT}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">Customer email</span>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className={ADMIN_INPUT}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">What this covers</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={ADMIN_INPUT}
            placeholder="e.g. Monthly software maintenance for Acme portal"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm text-muted">Amount</span>
            <input
              type="number"
              min={1}
              step={1}
              value={amountMajor}
              onChange={(e) => setAmountMajor(e.target.value)}
              className={ADMIN_INPUT}
            />
          </label>
          <div className="block space-y-2">
            <span className="text-sm text-muted">Currency</span>
            <StackwiseSelect
              aria-label="Currency"
              value={currency}
              onChange={setCurrency}
              options={currencyOptions.map((c) => ({
                value: c.code,
                label: c.label,
              }))}
            />
          </div>
          <div className="block space-y-2">
            <span className="text-sm text-muted">Interval</span>
            <StackwiseSelect<SubscriptionInterval>
              aria-label="Billing interval"
              value={interval}
              onChange={setInterval}
              options={SUBSCRIPTION_INTERVALS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
          />
          Email subscription link to customer
        </label>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className={ADMIN_BTN_PRIMARY}
        >
          {loading ? "Creating…" : "Create subscription"}
        </button>
      </div>
    </div>
  );
}
