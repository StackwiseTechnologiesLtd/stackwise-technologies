"use client";

import Link from "next/link";
import { useState } from "react";
import { ContractAcceptForm } from "@/components/contracts/ContractAcceptForm";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { ContractFeedbackForm } from "@/components/contracts/ContractFeedbackForm";
import { BRAND_BURGUNDY } from "@/lib/company";
import type { ContractMilestone } from "@/lib/contracts/milestones";
import {
  contractDeliveryPhaseLabel,
  type ContractEngagement,
} from "@/lib/contracts/types";
import type { PaymentLink } from "@/lib/payments/types";
import { formatMoney } from "@/lib/currency";

type Tab = "agreement" | "progress" | "billing";

function milestoneLabel(status: ContractMilestone["status"]): string {
  switch (status) {
    case "done":
      return "Done";
    case "in_progress":
      return "In progress";
    default:
      return "Pending";
  }
}

export function EngagementPublicPortal({
  engagement,
  paymentLinks,
}: {
  engagement: ContractEngagement;
  paymentLinks: PaymentLink[];
}) {
  const [tab, setTab] = useState<Tab>("agreement");
  const canAccept =
    engagement.status === "SENT" || engagement.status === "FEEDBACK_RECEIVED";
  const alreadyAccepted =
    engagement.status === "ACCEPTED" ||
    engagement.status === "IN_PROGRESS" ||
    engagement.status === "COMPLETED";
  const showProgress =
    engagement.status === "ACCEPTED" ||
    engagement.status === "IN_PROGRESS" ||
    engagement.status === "COMPLETED";

  const tabs: { id: Tab; label: string }[] = [
    { id: "agreement", label: "Agreement" },
    ...(showProgress ? [{ id: "progress" as Tab, label: "Progress" }] : []),
    ...(paymentLinks.length > 0 ? [{ id: "billing" as Tab, label: "Billing" }] : []),
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
          Stackwise engagement
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{engagement.reference}</h1>
        {engagement.progressHeadline && (
          <p className="text-sm text-[#475569]">{engagement.progressHeadline}</p>
        )}
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[#541111] text-white"
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            }`}
            style={tab === t.id ? { backgroundColor: BRAND_BURGUNDY } : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "agreement" && (
        <div className="space-y-6">
          <ContractDocumentView engagement={engagement} variant="client" />
          {canAccept && <ContractAcceptForm slug={engagement.slug} />}
          {alreadyAccepted && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Accepted
              {engagement.acceptedByName ? ` by ${engagement.acceptedByName}` : ""}
              {engagement.acceptedAt
                ? ` on ${new Date(engagement.acceptedAt).toLocaleDateString()}`
                : ""}
              .
            </p>
          )}
          <ContractFeedbackForm slug={engagement.slug} />
        </div>
      )}

      {tab === "progress" && showProgress && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
              Phase
            </p>
            <p className="mt-1 text-lg font-semibold">
              {contractDeliveryPhaseLabel(engagement.deliveryPhase)}
            </p>
            {engagement.progressDetail && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#475569]">
                {engagement.progressDetail}
              </p>
            )}
          </div>

          {engagement.milestones.length > 0 && (
            <ol className="space-y-3">
              {engagement.milestones.map((m, i) => (
                <li
                  key={m.id}
                  className="flex gap-4 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-xs font-semibold text-[#64748b]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#0f172a]">{m.title}</p>
                      <span className="rounded-full bg-[#f8fafc] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#64748b] ring-1 ring-[#e2e8f0]">
                        {milestoneLabel(m.status)}
                      </span>
                    </div>
                    {m.note && (
                      <p className="mt-1 text-sm text-[#64748b]">{m.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {tab === "billing" && paymentLinks.length > 0 && (
        <ul className="space-y-3">
          {paymentLinks.map((link) => (
            <li
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-mono text-sm font-medium">{link.invoiceNumber}</p>
                <p className="text-sm text-[#64748b]">
                  {formatMoney(link.amountLocal, link.currency)} · {link.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/pay/${link.slug}`}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: BRAND_BURGUNDY }}
                >
                  {link.status === "PAID" ? "View" : "Pay"}
                </Link>
                {link.status === "PAID" && (
                  <Link
                    href={`/pay/${link.slug}/receipt`}
                    className="rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm font-medium text-[#334155]"
                  >
                    Receipt
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
