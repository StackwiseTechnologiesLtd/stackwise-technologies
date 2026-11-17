import {
  buildAgencyAttentionItems,
  type AgencyAttentionItem,
} from "@/lib/admin/agency-attention";
import {
  agencyAlertRecipients,
  publicSiteBase,
} from "@/lib/admin/agency-alert-config";
import { getAgencyOverview } from "@/lib/admin/agency-overview";
import { sendEmail } from "@/lib/emails/sendEmail";

function formatItemLines(items: AgencyAttentionItem[], base: string): {
  bodyText: string;
  bodyHtml: string;
} {
  const lines = items.map((item) => {
    const url = `${base}${item.href}`;
    return `- ${item.label}\n  ${url}`;
  });
  const bodyText = lines.join("\n\n");

  const lis = items
    .map((item) => {
      const url = `${base}${item.href}`;
      const weight = item.tone === "danger" ? "700" : "600";
      const color = item.tone === "danger" ? "#b91c1c" : "#541111";
      return `<li style="margin:0 0 12px;font-size:13px;line-height:1.45;">
  <span style="font-weight:${weight};color:${color};">${escapeHtml(item.label)}</span><br />
  <a href="${escapeHtml(url)}" style="color:#64748b;font-size:12px;">${escapeHtml(url)}</a>
</li>`;
    })
    .join("");

  const bodyHtml = `<ul style="margin:0;padding-left:18px;">${lis}</ul>`;
  return { bodyText, bodyHtml };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type AgencyAlertDigestResult =
  | { ok: true; sent: boolean; itemCount: number; recipients: string[] }
  | { ok: false; error: string };

export async function runAgencyAlertDigest(): Promise<AgencyAlertDigestResult> {
  const recipients = agencyAlertRecipients();
  if (recipients.length === 0) {
    return { ok: false, error: "No AGENCY_ALERT_EMAILS or ADMIN_NOTIFY_EMAILS" };
  }

  const overview = await getAgencyOverview();
  const items = buildAgencyAttentionItems(overview);
  if (items.length === 0) {
    return { ok: true, sent: false, itemCount: 0, recipients };
  }

  const base = publicSiteBase();
  const overviewUrl = `${base}/admin`;
  const { bodyText, bodyHtml } = formatItemLines(items, base);

  await sendEmail({
    to: recipients[0]!,
    bcc: recipients.length > 1 ? recipients.slice(1) : undefined,
    template: "agency-attention",
    version: "0.0.1",
    metadata: {
      itemCount: items.length,
      overviewUrl,
      bodyText,
      bodyHtml,
    },
  });

  return { ok: true, sent: true, itemCount: items.length, recipients };
}