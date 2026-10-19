"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  CONTRACT_DOCUMENT_KINDS,
  contractDocumentKindLabel,
  type ContractDocumentKind,
} from "@/lib/contracts/types";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui/buttons";

type Props = {
  initialCustomerName?: string;
  initialCustomerEmail?: string;
  initialCompanyName?: string;
  initialBrief?: string;
  leadId?: string;
};

export function ContractBuilder({
  initialCustomerName = "",
  initialCustomerEmail = "",
  initialCompanyName = "",
  initialBrief = "",
  leadId,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [documentKind, setDocumentKind] = useState<ContractDocumentKind>("sow");
  const [servicesBrief, setServicesBrief] = useState(initialBrief);
  const [commercialNotes, setCommercialNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          companyName: companyName || undefined,
          documentKind,
          servicesBrief,
          commercialNotes: commercialNotes || undefined,
          leadId,
        }),
      });
      const data = (await res.json()) as { error?: string; engagement?: { id: string } };
      if (!res.ok) throw new Error(data.error ?? "Failed to create agreement");
      toast.success("Draft generated — review before sending to the client.");
      router.push(`/admin/contracts/${data.engagement!.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-muted">Contact name</span>
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Email</span>
          <input
            required
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-muted">Company / party name (optional)</span>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Legal entity name on the agreement"
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted">Document type</span>
        <select
          value={documentKind}
          onChange={(e) => setDocumentKind(e.target.value as ContractDocumentKind)}
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
        >
          {CONTRACT_DOCUMENT_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {contractDocumentKindLabel(kind)}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-muted">What the client needs (scope & services)</span>
        <textarea
          required
          rows={8}
          value={servicesBrief}
          onChange={(e) => setServicesBrief(e.target.value)}
          placeholder="Describe deliverables, timeline, tech stack, team involvement, success criteria…"
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 font-mono text-xs leading-relaxed"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted">Commercial notes for AI (optional)</span>
        <textarea
          rows={3}
          value={commercialNotes}
          onChange={(e) => setCommercialNotes(e.target.value)}
          placeholder="Budget range, payment terms, jurisdiction, start date…"
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={loading} className={BTN_PRIMARY}>
          {loading ? "Generating draft…" : "Generate with AI"}
        </button>
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={() => router.push("/admin/contracts")}
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-muted">
        You will receive an email with a link to review the draft. Nothing is sent to the
        client until you approve.
      </p>
    </form>
  );
}
