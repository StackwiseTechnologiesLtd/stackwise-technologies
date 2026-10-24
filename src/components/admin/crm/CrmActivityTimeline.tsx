"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type { CrmActivity } from "@/lib/crm/types";
import { useState } from "react";

export function CrmActivityTimeline({
  opportunityId,
  activities,
  onAdded,
}: {
  opportunityId: string;
  activities: CrmActivity[];
  onAdded: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitNote() {
    const body = note.trim();
    if (!body) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/crm/opportunities/${opportunityId}/activities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body, activityType: "note" }),
        },
      );
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Could not save note");
      }
      setNote("");
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-black/30 p-4">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          Add note
        </label>
        <textarea
          className="mt-2 min-h-[5rem] w-full rounded-lg border border-line bg-black/45 px-3 py-2 text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Called — left VM"
          disabled={busy}
        />
        <AdminActionButton
          className="mt-2"
          busy={busy}
          busyLabel="Saving…"
          onClick={() => void submitNote()}
        >
          Save note
        </AdminActionButton>
      </div>

      <ul className="space-y-3">
        {activities.length === 0 ? (
          <li className="text-sm text-muted">No activity yet.</li>
        ) : (
          activities.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-line bg-panel/40 px-3 py-2.5 text-sm"
            >
              <p className="text-[10px] uppercase text-muted">
                {a.activityType.replace("_", " ")} ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 break-words text-foreground">{a.body}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
