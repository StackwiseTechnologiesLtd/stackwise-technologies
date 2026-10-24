"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import type { CrmOpportunityDetail } from "@/lib/crm/types";
import Link from "next/link";
import { useState } from "react";

export function PromoteToCrmButton({
  leadId,
  className,
}: {
  leadId: string;
  className?: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [opportunityId, setOpportunityId] = useState<string | null>(null);

  async function promote() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/crm/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const json = (await res.json()) as CrmOpportunityDetail & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "Promote failed");
      }
      const id = json.opportunity?.id;
      if (id) setOpportunityId(id);
      toast.success("Lead promoted to CRM");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Promote failed");
    } finally {
      setBusy(false);
    }
  }

  if (opportunityId) {
    return (
      <Link
        href={`/admin/crm/opportunities/${opportunityId}`}
        className={
          className ??
          "text-xs font-medium text-accent hover:underline"
        }
        onClick={(e) => e.stopPropagation()}
      >
        View in CRM →
      </Link>
    );
  }

  return (
    <AdminActionButton
      className={className}
      busy={busy}
      busyLabel="Promoting…"
      onClick={() => void promote()}
    >
      Promote to CRM
    </AdminActionButton>
  );
}
