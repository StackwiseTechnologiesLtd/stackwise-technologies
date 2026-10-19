"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ContractStatusBadge } from "@/components/admin/ContractStatusBadge";
import { contractDocumentKindLabel, type ContractEngagement } from "@/lib/contracts/types";
import { formatDateTime } from "@/lib/format-datetime";

export function ContractsList({ engagements }: { engagements: ContractEngagement[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return engagements;
    return engagements.filter(
      (e) =>
        e.reference.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.customerName.toLowerCase().includes(q) ||
        e.customerEmail.toLowerCase().includes(q),
    );
  }, [engagements, query]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search reference, client, or title…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-md rounded-lg border border-line bg-background px-3 py-2 text-sm"
      />

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-panel text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5">Reference</th>
              <th className="px-4 py-2.5">Client</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/contracts/${e.id}`}
                    className="font-mono text-xs font-medium text-accent hover:underline"
                  >
                    {e.reference}
                  </Link>
                  <p className="mt-0.5 max-w-[200px] truncate text-muted">{e.title}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{e.customerName}</p>
                  <p className="text-xs text-muted">{e.customerEmail}</p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {contractDocumentKindLabel(e.documentKind)}
                </td>
                <td className="px-4 py-3">
                  <ContractStatusBadge status={e.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {formatDateTime(e.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted">No agreements match.</p>
        )}
      </div>
    </div>
  );
}
