"use client";

import { useToast } from "@/components/ToastProvider";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type { IntegrationServiceStatus } from "@/lib/integrations/repository";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useState } from "react";

type StatusResponse = {
  services: IntegrationServiceStatus[];
  ingestSecretConfigured: boolean;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function GrowthIntegrationsPanel() {
  const toast = useToast();
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations/status");
      if (!res.ok) throw new Error("Could not load integrations");
      setData((await res.json()) as StatusResponse);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <p className="text-sm text-muted">Loading integrations…</p>;
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Integrations</h3>
          <p className="mt-1 text-sm text-muted">
            Huginn and freehire send leads to{" "}
            <code className="text-foreground">/api/admin/integrations/ingest</code>.
            See{" "}
            <code className="text-foreground">docs/INTEGRATIONS_BUILD_PLAN.md</code>.
          </p>
          <p className="mt-2 text-xs text-muted">
            Ingest secret:{" "}
            {data?.ingestSecretConfigured
              ? "configured (INTEGRATIONS_INGEST_SECRET or GROWTH_CONNECTOR_SECRET)"
              : "not set — webhooks will return 401"}
          </p>
        </div>
        <AdminActionButton busy={loading} busyLabel="Refreshing…" onClick={() => void load()}>
          Refresh
        </AdminActionButton>
      </div>

      <ul className="mt-4 space-y-2">
        {data?.services.map((svc) => (
          <li
            key={svc.id}
            className="rounded-lg border border-line bg-black/30 px-4 py-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-foreground">{svc.label}</span>
              <span
                className={`text-xs ${svc.configured ? "text-emerald-400" : "text-amber-300"}`}
              >
                {svc.id === "crm"
                  ? "Planned"
                  : svc.configured
                    ? svc.lastSuccessAt
                      ? "Active"
                      : "Ready"
                    : "Not configured"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Last event: {formatWhen(svc.lastEventAt)}
              {svc.lastDetail ? ` · ${svc.lastDetail}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
