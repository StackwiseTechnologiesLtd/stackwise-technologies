"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  CONTRACT_DELIVERY_PHASES,
  contractDeliveryPhaseLabel,
  type ContractEngagement,
} from "@/lib/contracts/types";
import type { ContractMilestone } from "@/lib/contracts/milestones";
import type { PaymentLink } from "@/lib/payments/types";
import { SERVICES_CATALOG } from "@/lib/services-catalog";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui/buttons";

export function ContractEngagementOpsPanel({
  engagement,
  paymentLinks,
}: {
  engagement: ContractEngagement;
  paymentLinks: PaymentLink[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [headline, setHeadline] = useState(engagement.progressHeadline ?? "");
  const [detail, setDetail] = useState(engagement.progressDetail ?? "");
  const [phase, setPhase] = useState(engagement.deliveryPhase);
  const [milestones, setMilestones] = useState<ContractMilestone[]>(
    engagement.milestones,
  );
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const catalogItem = SERVICES_CATALOG[0]!;

  async function saveTracking() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contracts/${engagement.id}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryPhase: phase,
          progressHeadline: headline || null,
          progressDetail: detail || null,
          milestones,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast.success("Engagement updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function createDepositInvoice() {
    setInvoiceLoading(true);
    try {
      const res = await fetch(
        `/api/admin/contracts/${engagement.id}/payment-links`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currency: "KES",
            sendEmail: true,
            lineItems: [
              {
                serviceId: catalogItem.id,
                name: `Deposit — ${engagement.reference}`,
                quantity: 1,
                unitPriceUsd: catalogItem.defaultPriceUsd,
              },
            ],
          }),
        },
      );
      const data = (await res.json()) as { error?: string; link?: { id: string } };
      if (!res.ok) throw new Error(data.error ?? "Failed to create invoice");
      toast.success("Payment link created and emailed.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setInvoiceLoading(false);
    }
  }

  function updateMilestone(id: string, patch: Partial<ContractMilestone>) {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  }

  const showOps =
    engagement.status === "SENT" ||
    engagement.status === "FEEDBACK_RECEIVED" ||
    engagement.status === "ACCEPTED" ||
    engagement.status === "IN_PROGRESS" ||
    engagement.status === "COMPLETED";

  if (!showOps) return null;

  return (
    <div className="space-y-6 rounded-xl border border-line bg-panel p-5">
      <div>
        <h2 className="text-lg font-semibold">Engagement hub</h2>
        <p className="mt-1 text-sm text-muted">
          Progress and billing appear on the client portal after acceptance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-muted">Client-facing headline</span>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Delivery phase</span>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as typeof phase)}
            className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
          >
            {CONTRACT_DELIVERY_PHASES.map((p) => (
              <option key={p} value={p}>{contractDeliveryPhaseLabel(p)}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-muted">Status update (client sees on Progress tab)</span>
        <textarea
          rows={3}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      {milestones.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Milestones</p>
          {milestones.map((m) => (
            <div
              key={m.id}
              className="grid gap-2 rounded-lg border border-line bg-background p-3 sm:grid-cols-[1fr_auto]"
            >
              <input
                value={m.title}
                onChange={(e) => updateMilestone(m.id, { title: e.target.value })}
                className="rounded border border-line px-2 py-1 text-sm"
              />
              <select
                value={m.status}
                onChange={(e) =>
                  updateMilestone(m.id, {
                    status: e.target.value as ContractMilestone["status"],
                  })
                }
                className="rounded border border-line px-2 py-1 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={saveTracking} disabled={saving} className={BTN_PRIMARY}>
          {saving ? "Saving…" : "Save engagement"}
        </button>
        <button
          type="button"
          onClick={createDepositInvoice}
          disabled={invoiceLoading}
          className={BTN_SECONDARY}
        >
          {invoiceLoading ? "Creating…" : "Create deposit invoice & email"}
        </button>
      </div>

      {paymentLinks.length > 0 && (
        <div>
          <p className="text-sm font-medium">Linked invoices</p>
          <ul className="mt-2 space-y-2">
            {paymentLinks.map((link) => (
              <li key={link.id}>
                <Link
                  href={`/admin/payment-links/${link.id}`}
                  className="text-sm text-accent hover:underline"
                >
                  {link.invoiceNumber} — {link.status}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
