import type { GrowthOutreachItem, GrowthOutreachRun } from "@/lib/growth/outreach-types";

function csvEscape(value: string | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function formatOutreachCsv(
  run: GrowthOutreachRun,
  items: GrowthOutreachItem[],
): string {
  const headers = [
    "recipient_name",
    "recipient_email",
    "company_name",
    "profile_url",
    "subject_line",
    "status",
    "used_ai",
    "error_message",
    "body_text",
  ];
  const lines = [headers.join(",")];
  for (const item of items) {
    lines.push(
      headers.map((h) => csvEscape(item[h as keyof GrowthOutreachItem] as string)).join(","),
    );
  }
  lines.push("");
  lines.push(`# run_id,${run.id}`);
  lines.push(`# started_at,${run.startedAt}`);
  lines.push(`# totals,${JSON.stringify(run.totals)}`);
  return lines.join("\n");
}

export function formatOutreachMarkdown(
  run: GrowthOutreachRun,
  items: GrowthOutreachItem[],
): string {
  const t = run.totals;
  const lines: string[] = [
    "# Growth cold email outreach report",
    "",
    `**Run ID:** \`${run.id}\`  `,
    `**Started:** ${run.startedAt}  `,
    `**Completed:** ${run.completedAt ?? "—"}  `,
    `**Status:** ${run.status}  `,
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Recipients processed | ${t.processed ?? 0} |`,
    `| Sent (SMTP) | ${t.sent ?? 0} |`,
    `| Draft ready (no email on file) | ${t.no_email ?? 0} |`,
    `| Failed | ${t.failed ?? 0} |`,
    `| AI-tailored | ${t.used_ai ?? 0} |`,
    "",
  ];

  const byStatus = new Map<string, GrowthOutreachItem[]>();
  for (const item of items) {
    const list = byStatus.get(item.status) ?? [];
    list.push(item);
    byStatus.set(item.status, list);
  }

  for (const [status, group] of [...byStatus.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    lines.push(`## ${status.replace(/_/g, " ")} (${group.length})`, "");
    for (const item of group.slice(0, 50)) {
      lines.push(`### ${item.recipientName || "Unknown"}`, "");
      if (item.companyName) lines.push(`- **Company:** ${item.companyName}`);
      if (item.profileUrl) lines.push(`- **Profile:** ${item.profileUrl}`);
      if (item.recipientEmail) lines.push(`- **Email:** ${item.recipientEmail}`);
      lines.push(`- **Subject:** ${item.subjectLine}`, "");
      lines.push("```text");
      lines.push(item.bodyText.trim());
      lines.push("```", "");
    }
    if (group.length > 50) {
      lines.push(`_…and ${group.length - 50} more in CSV export._`, "");
    }
  }

  return lines.join("\n");
}
