"use client";

import Link from "next/link";
import { useCallback, useEffect, type ReactNode } from "react";
import type { PaymentAuditLog, PaymentAuditLogWithLink } from "@/lib/db/payment-audit";
import { ipGeoDetailRows } from "@/lib/ip-geo";
import {
  formatPaymentInitAuditDetail,
  PAYMENT_AUDIT_EVENT_LABELS,
} from "@/lib/payments/audit-labels";

type AuditRow = PaymentAuditLog | PaymentAuditLogWithLink;

function hasLinkContext(log: AuditRow): log is PaymentAuditLogWithLink {
  return "invoiceNumber" in log && "customerName" in log;
}

function formatDetailTimestamp(timestamp: number): string {
  return new Date(timestamp)
    .toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
      hour12: false,
      timeZoneName: "short",
    })
    .toUpperCase();
}

function metadataTags(log: AuditRow): { key: string; value: string }[] {
  const tags: { key: string; value: string }[] = [
    { key: "event", value: log.event },
  ];
  if (log.ipAddress) tags.push({ key: "ip", value: log.ipAddress });
  if (log.metadata && typeof log.metadata === "object") {
    for (const [key, value] of Object.entries(log.metadata)) {
      if (value === null || value === undefined) continue;
      tags.push({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      });
    }
  }
  const initDetail = formatPaymentInitAuditDetail(log.metadata);
  if (initDetail) tags.push({ key: "processor", value: initDetail });
  return tags;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
      <dt className="font-mono text-[11px] uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function AuditLogDetailDialog({
  log,
  onClose,
}: {
  log: AuditRow | null;
  onClose: () => void;
}) {
  const copyPayload = useCallback(() => {
    if (!log) return;
    void navigator.clipboard.writeText(JSON.stringify(log, null, 2));
  }, [log]);

  useEffect(() => {
    if (!log) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [log, onClose]);

  if (!log) return null;

  const eventLabel = PAYMENT_AUDIT_EVENT_LABELS[log.event] ?? log.event;
  const tags = metadataTags(log);
  const geoRows = ipGeoDetailRows(log.ipGeo);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-log-detail-title"
        className="relative flex max-h-[min(90dvh,640px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl sm:rounded-2xl"
        style={{
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        }}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="audit-log-detail-title"
                className="font-mono text-sm font-medium text-foreground"
              >
                payment.audit
              </h2>
              <span className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-canvas)] px-2 py-0.5 text-[11px] text-muted">
                {log.event}
              </span>
              <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                {eventLabel}
              </span>
            </div>
            {hasLinkContext(log) ? (
              <p className="mt-1 truncate text-xs text-muted">
                Invoice {log.invoiceNumber} · {log.customerName}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={copyPayload}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-[var(--admin-border)] text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
              aria-label="Copy event JSON"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-[var(--admin-border)] text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted">
            <span className="font-medium text-foreground">Event started</span>
            <time className="font-mono text-[11px] tabular-nums">
              {formatDetailTimestamp(log.createdAt)}
            </time>
          </div>

          <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] p-4">
            <dl className="space-y-3">
              <DetailRow label="Event ID">
                <span className="font-mono text-xs break-all">{log.id}</span>
              </DetailRow>
              <DetailRow label="Payment link">
                <Link
                  href={`/admin/payment-links/${log.paymentLinkId}`}
                  className="font-mono text-xs text-accent hover:underline break-all"
                >
                  {log.paymentLinkId}
                </Link>
              </DetailRow>
              {hasLinkContext(log) && (
                <DetailRow label="Invoice">
                  <Link
                    href={`/admin/payment-links/${log.paymentLinkId}`}
                    className="text-accent hover:underline"
                  >
                    {log.invoiceNumber}
                  </Link>
                </DetailRow>
              )}
              <DetailRow label="IP address">
                <span className="font-mono text-sm">{log.ipAddress ?? "—"}</span>
              </DetailRow>
              {geoRows.length > 0 ? (
                <div className="border-t border-dashed border-[var(--admin-border)] pt-3">
                  <p className="mb-2 text-xs font-medium text-foreground">
                    IP geolocation &amp; network
                  </p>
                  <dl className="space-y-2">
                    {geoRows.map((row) => (
                      <DetailRow key={row.label} label={row.label}>
                        <span className="font-mono text-xs break-all">{row.value}</span>
                      </DetailRow>
                    ))}
                  </dl>
                </div>
              ) : null}
              <DetailRow label="User agent">
                <p className="font-mono text-xs leading-relaxed break-all text-muted">
                  {log.userAgent ?? "—"}
                </p>
              </DetailRow>
            </dl>

            <div className="mt-4 border-t border-dashed border-[var(--admin-border)] pt-4">
              <p className="mb-2 text-xs font-medium text-foreground">Metadata</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={`${tag.key}-${tag.value}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1 font-mono text-[11px]"
                  >
                    <span className="text-muted">{tag.key}:</span>
                    <span className="truncate text-foreground">{tag.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-emerald-500/80" aria-hidden />
            Event recorded
          </p>
        </div>
      </div>
    </div>
  );
}
