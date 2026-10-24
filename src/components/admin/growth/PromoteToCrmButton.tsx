"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import type { CrmOpportunityDetail } from "@/lib/crm/types";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { useCallback, useState } from "react";

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
  const [checked, setChecked] = useState(false);

  const resolveLinkedOpportunity = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/crm/opportunities/by-lead/${leadId}`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        opportunity?: { id: string } | null;
      };
      if (json.opportunity?.id) setOpportunityId(json.opportunity.id);
    } finally {
      setChecked(true);
    }
  }, [leadId]);

  useDeferredEffect(() => {
    void resolveLinkedOpportunity();
  }, [resolveLinkedOpportunity]);

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
        Open in CRM →
      </Link>
    );
  }

  if (!checked) {
    return null;
  }

  return (
    <AdminActionButton
      className={className}
      busy={busy}
      busyLabel="Adding…"
      onClick={() => void promote()}
    >
      Add to CRM
    </AdminActionButton>
  );
}
