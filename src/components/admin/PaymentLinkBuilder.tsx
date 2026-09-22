"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InvoiceView } from "@/components/payments/InvoiceView";
import { formatMoney } from "@/lib/currency";
import { KPAY_CARD_MAX_USD } from "@/lib/kpay/buildGatewayInit";
import { SERVICES_CATALOG } from "@/lib/services-catalog";
import {
  PAYMENT_METHODS_OPTIONS,
  type PaymentMethodsOption,
} from "@/lib/payments/payment-methods";
import { SUPPORTED_CURRENCIES } from "@/lib/payments/types";
import type { LineItem, PaymentLink } from "@/lib/payments/types";

type SelectedItem = LineItem & { key: string };

function newKey() {
  return crypto.randomUUID();
}

export function PaymentLinkBuilder() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [allowedPaymentMethods, setAllowedPaymentMethods] =
    useState<PaymentMethodsOption>("BOTH");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [fxResult, setFxResult] = useState<{
    key: string;
    converted: number;
    rate: number;
  } | null>(null);
  const [fxError, setFxError] = useState<{ key: string; message: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"invoice" | "receipt">("invoice");

  const totalUsd = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPriceUsd, 0),
    [items],
  );

  const fxRequestKey = totalUsd > 0 ? `${currency}:${totalUsd}` : null;
  const fx =
    fxRequestKey && fxResult?.key === fxRequestKey ? fxResult : null;
  const fxErrorMessage =
    fxError?.key === fxRequestKey ? fxError.message : null;
  const fxLoading = Boolean(
    fxRequestKey && fxResult?.key !== fxRequestKey && !fxErrorMessage,
  );

  useEffect(() => {
    if (!fxRequestKey) return;

    const controller = new AbortController();
    fetch(
      `/api/exchange-rate?from=USD&to=${currency}&amount=${totalUsd}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        const data = (await res.json()) as {
          converted?: number;
          rate?: number;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Unable to fetch exchange rate");
        }
        if (data.converted == null || data.rate == null) {
          throw new Error("Invalid exchange rate response");
        }
        setFxResult({
          key: fxRequestKey,
          converted: data.converted,
          rate: data.rate,
        });
        setFxError(null);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setFxError({
            key: fxRequestKey,
            message: err.message || "Unable to fetch exchange rate",
          });
        }
      });

    return () => controller.abort();
  }, [fxRequestKey, currency, totalUsd]);

  const previewLink: PaymentLink | null = useMemo(() => {
    if (items.length === 0) return null;
    const now = 1_700_000_000_000;
    const lineItems: LineItem[] = items.map(
      ({ serviceId, name, description, quantity, unitPriceUsd }) => ({
        serviceId,
        name,
        description,
        quantity,
        unitPriceUsd,
      }),
    );
    return {
      id: "preview",
      slug: "preview",
      customerName: customerName.trim() || "Customer name",
      customerEmail: customerEmail.trim() || "customer@example.com",
      currency,
      amountUsd: totalUsd,
      amountLocal: fx?.converted ?? 0,
      exchangeRate: fx?.rate ?? 0,
      status: previewMode === "receipt" ? "PAID" : "DRAFT",
      lineItems,
      notes: notes.trim() || null,
      kpayPaymentId: null,
      kpayReference: previewMode === "receipt" ? "PREVIEW-REF" : null,
      kpayIsTest: null,
      gatewayUrl: null,
      allowedPaymentMethods,
      invoiceNumber: "STL-PREVIEW",
      sentAt: null,
      paidAt: previewMode === "receipt" ? now : null,
      receiptSentAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }, [
    items,
    customerName,
    customerEmail,
    currency,
    totalUsd,
    fx?.converted,
    fx?.rate,
    allowedPaymentMethods,
    notes,
    previewMode,
  ]);

  function addService(serviceId: string) {
    const service = SERVICES_CATALOG.find((s) => s.id === serviceId);
    if (!service) return;
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        serviceId: service.id,
        name: service.name,
        description: service.description,
        quantity: 1,
        unitPriceUsd: service.defaultPriceUsd,
      },
    ]);
  }

  function updateItem(key: string, patch: Partial<SelectedItem>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  async function submit(saveOnly: boolean) {
    setError(null);
    setLoading(true);
    try {
      if (!customerName.trim() || !customerEmail.trim()) {
        throw new Error("Customer name and email are required");
      }

      const lineItems: LineItem[] = items.map(
        ({ serviceId, name, description, quantity, unitPriceUsd }) => ({
          serviceId,
          name,
          description,
          quantity,
          unitPriceUsd,
        }),
      );

      const res = await fetch("/api/admin/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          currency,
          lineItems,
          notes,
          allowedPaymentMethods,
          sendEmail: saveOnly ? false : sendEmail,
        }),
      });
      const data = (await res.json()) as { link?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create payment link");

      router.push(`/admin/payment-links/${data.link!.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Create payment link</h1>
        <p className="mt-1 text-sm text-muted">
          Build the invoice, preview it live, then set the recipient and create the link.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,540px)]">
        <div className="space-y-8">
          <section className="grid gap-6 rounded-xl border border-line bg-panel p-6 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-muted">Customer name</span>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-line bg-background px-3 py-2"
                placeholder="Jane Client"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-muted">Customer email</span>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-background px-3 py-2"
                placeholder="client@company.com"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-muted">Payment currency</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-line bg-background px-3 py-2"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-muted">Payment methods</span>
              <select
                value={allowedPaymentMethods}
                onChange={(e) =>
                  setAllowedPaymentMethods(e.target.value as PaymentMethodsOption)
                }
                className="w-full rounded-lg border border-line bg-background px-3 py-2"
              >
                {PAYMENT_METHODS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">
                {
                  PAYMENT_METHODS_OPTIONS.find(
                    (option) => option.value === allowedPaymentMethods,
                  )?.description
                }
              </p>
            </label>
          </section>

          <section className="rounded-xl border border-line bg-panel p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-medium">Services</h2>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    addService(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="rounded-lg border border-line bg-background px-3 py-2 text-sm"
              >
                <option value="">Add service…</option>
                {SERVICES_CATALOG.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ${s.defaultPriceUsd}
                  </option>
                ))}
              </select>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted">Add at least one service.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="grid gap-3 rounded-lg border border-line bg-background p-4 md:grid-cols-[1fr_80px_120px_auto]"
                  >
                    <div>
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(item.key, { name: e.target.value })}
                        className="w-full rounded border border-line bg-panel px-2 py-1 text-sm font-medium"
                      />
                      <input
                        value={item.description ?? ""}
                        onChange={(e) =>
                          updateItem(item.key, { description: e.target.value })
                        }
                        className="mt-2 w-full rounded border border-line bg-panel px-2 py-1 text-xs text-muted"
                        placeholder="Description"
                      />
                    </div>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs text-muted">Qty</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.key, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="w-full rounded border border-line bg-panel px-2 py-1"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs text-muted">USD</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPriceUsd}
                        onChange={(e) =>
                          updateItem(item.key, {
                            unitPriceUsd: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full rounded border border-line bg-panel px-2 py-1"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="self-end text-sm text-muted hover:text-accent"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-line bg-panel p-6">
            <label className="block space-y-2">
              <span className="text-sm text-muted">Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-line bg-background px-3 py-2"
                placeholder="Scope details, payment terms, etc."
              />
            </label>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-6">
              <div>
                <p className="text-sm text-muted">Total (USD)</p>
                <p className="text-2xl font-semibold">${totalUsd.toFixed(2)}</p>
                {totalUsd > 0 && fxLoading && (
                  <p className="mt-1 text-sm text-muted">Fetching exchange rate…</p>
                )}
                {totalUsd > 0 && fxErrorMessage && (
                  <p className="mt-1 text-sm text-amber-300">{fxErrorMessage}</p>
                )}
                {totalUsd > 0 && fx && !fxLoading && (
                  <p className="mt-1 text-sm text-muted tabular-nums">
                    ≈ {formatMoney(fx.converted, currency)} (1 USD ={" "}
                    {fx.rate.toFixed(4)} {currency})
                  </p>
                )}
                {totalUsd > KPAY_CARD_MAX_USD &&
                  allowedPaymentMethods !== "MOBILE_MONEY" && (
                  <p className="mt-2 text-sm text-amber-300">
                    Over ${KPAY_CARD_MAX_USD} USD — card checkout blocked; customer
                    can pay with Mobile Money only.
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Email payment link to customer
              </label>
            </div>
          </section>

          {error && (
            <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading || items.length === 0}
              onClick={() => submit(false)}
              className="rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Creating…" : sendEmail ? "Create & send" : "Create link"}
            </button>
            <button
              type="button"
              disabled={loading || items.length === 0}
              onClick={() => submit(true)}
              className="rounded-lg border border-line px-4 py-2 transition hover:bg-panel-hover disabled:opacity-50"
            >
              Save as draft
            </button>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-medium">Live preview</h2>
              <p className="text-xs text-muted">Updates as you edit the form</p>
            </div>
            <div className="flex shrink-0 rounded-lg border border-line bg-background p-1 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode("invoice")}
                className={`rounded-md px-3 py-1.5 transition ${
                  previewMode === "invoice"
                    ? "bg-panel font-medium text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Invoice
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("receipt")}
                className={`rounded-md px-3 py-1.5 transition ${
                  previewMode === "receipt"
                    ? "bg-panel font-medium text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Receipt
              </button>
            </div>
          </div>
          {previewLink ? (
            <div className="overflow-hidden rounded-xl border border-line bg-[#eef2f6] p-3 shadow-inner sm:p-4">
              {fxLoading && totalUsd > 0 && (
                <p className="mb-3 text-center text-xs text-muted">
                  Updating converted total…
                </p>
              )}
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain">
                <InvoiceView
                  link={previewLink}
                  showStatus={previewMode === "invoice"}
                  variant={previewMode}
                  compact
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-panel p-8 text-center text-sm text-muted">
              Add services to preview the invoice.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
