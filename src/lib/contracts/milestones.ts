export type ContractMilestoneStatus = "pending" | "in_progress" | "done";

export type ContractMilestone = {
  id: string;
  title: string;
  status: ContractMilestoneStatus;
  note: string | null;
};

export function createMilestoneId(): string {
  return crypto.randomUUID();
}

export function parseMilestones(raw: unknown): ContractMilestone[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const title = typeof o.title === "string" ? o.title.trim() : "";
      if (!title) return null;
      const status = o.status;
      const validStatus =
        status === "pending" || status === "in_progress" || status === "done"
          ? status
          : "pending";
      return {
        id: typeof o.id === "string" ? o.id : createMilestoneId(),
        title,
        status: validStatus,
        note: typeof o.note === "string" ? o.note : null,
      };
    })
    .filter(Boolean) as ContractMilestone[];
}

export function defaultMilestonesFromBrief(brief: string): ContractMilestone[] {
  const lines = brief
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter((l) => l.length > 4 && l.length < 120)
    .slice(0, 4);

  if (lines.length === 0) {
    return [
      { id: createMilestoneId(), title: "Kickoff & discovery", status: "pending", note: null },
      { id: createMilestoneId(), title: "Delivery", status: "pending", note: null },
      { id: createMilestoneId(), title: "Handoff", status: "pending", note: null },
    ];
  }

  return lines.map((title) => ({
    id: createMilestoneId(),
    title,
    status: "pending" as const,
    note: null,
  }));
}
