import { isSmtpConfigured } from "@/lib/emails/deliveryConfig";
import { renderEmailTemplate } from "@/lib/emails/renderTemplate";
import { sendViaSmtp } from "@/lib/emails/sendViaSmtp";

type SendEmailParams = {
  to: string;
  bcc?: string[];
  template: string;
  version: string;
  metadata: Record<string, string | number | boolean | undefined>;
  attachment?: { filename: string; data: Buffer | string };
};

export async function sendEmail({
  to,
  bcc,
  template,
  version,
  metadata,
  attachment,
}: SendEmailParams): Promise<{ id?: string; provider: string } | null> {
  const { textBody, subjectLine, htmlBody } = renderEmailTemplate(
    template,
    version,
    metadata,
  );

  if (!isSmtpConfigured()) {
    console.info("[email:dev] SMTP not configured:", {
      to,
      bcc,
      subject: subjectLine,
      template,
    });
    return null;
  }

  return sendViaSmtp({
    to,
    bcc,
    subject: subjectLine,
    text: textBody,
    html: htmlBody,
    attachment,
  });
}
