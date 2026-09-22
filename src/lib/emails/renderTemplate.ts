import fs from "node:fs";
import path from "node:path";

function templatePath(template: string, version: string, ext: string) {
  return path.join(
    process.cwd(),
    "src/lib/emails/templates",
    template,
    `${version}.${ext}`,
  );
}

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
  const textBody = interpolate(
    fs.readFileSync(templatePath(template, version, "txt"), "utf8"),
    enriched,
  );
  const subjectLine = interpolate(
    fs.readFileSync(templatePath(template, version, "subject"), "utf8"),
    enriched,
  );
  const htmlBody = interpolate(
    fs.readFileSync(templatePath(template, version, "html"), "utf8"),
    enriched,
  );

  return { textBody, subjectLine, htmlBody };
}
