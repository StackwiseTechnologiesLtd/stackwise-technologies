import { getEmailTemplate } from "@/lib/emails/template-registry";

function interpolate(source: string, metadata: Record<string, unknown>) {
  return source.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = metadata[key];
    return value == null ? "" : String(value);
  });
}

export function renderEmailTemplate(
  template: string,
  version: string,
  metadata: Record<string, unknown>,
) {
  const enriched = { ...metadata };
  const parts = getEmailTemplate(template, version);
  const textBody = interpolate(parts.txt, enriched);
  const subjectLine = interpolate(parts.subject, enriched);
  const htmlBody = interpolate(parts.html, enriched);

  return { textBody, subjectLine, htmlBody };
}
