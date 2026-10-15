import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import {
  getFromEmail,
  getReplyToEmail,
  isSmtpConfigured,
  resolveSmtpConfig,
} from "@/lib/emails/deliveryConfig";

let transport: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null =
  null;

function getTransport() {
  if (!transport) {
    if (!isSmtpConfigured()) {
      throw new Error("SMTP is not configured");
    }
    const cfg = resolveSmtpConfig();
    transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.password,
      },
    });
  }
  return transport;
}

export async function sendViaSmtp({
  to,
  bcc,
  subject,
  text,
  html,
  attachment,
}: {
  to: string;
  bcc?: string[];
  subject: string;
  text: string;
  html: string;
  attachment?: { filename: string; data: Buffer | string };
}) {
  const result = await getTransport().sendMail({
    from: getFromEmail(),
    to,
    bcc: bcc?.length ? bcc.join(", ") : undefined,
    replyTo: getReplyToEmail(),
    subject,
    text,
    html,
    attachments: attachment
      ? [{ filename: attachment.filename, content: attachment.data }]
      : undefined,
  });

  return { id: result.messageId, provider: "smtp" as const };
}
