import { EMAIL, SITE_NAME } from "@/lib/content";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
  replyTo: string;
};

export function resolveSmtpConfig(): Partial<SmtpConfig> {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure:
      process.env.SMTP_SECURE === "true" ||
      Number(process.env.SMTP_PORT ?? 587) === 465,
    user: process.env.SMTP_FROM_ADDRESS ?? EMAIL,
    password: process.env.SMTP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME ?? SITE_NAME,
    fromAddress: process.env.SMTP_FROM_ADDRESS ?? EMAIL,
    replyTo: process.env.SMTP_REPLY_TO ?? EMAIL,
  };
}

export function isSmtpConfigured(): boolean {
  const cfg = resolveSmtpConfig();
  return Boolean(cfg.host && cfg.user && cfg.password);
}

export function getFromEmail(): string {
  const cfg = resolveSmtpConfig();
  if (cfg.fromAddress) {
    const name = (cfg.fromName ?? "").trim();
    return name ? `${name} <${cfg.fromAddress}>` : cfg.fromAddress;
  }
  return `${SITE_NAME} <${EMAIL}>`;
}

export function getReplyToEmail(): string {
  const cfg = resolveSmtpConfig();
  return cfg.replyTo || cfg.fromAddress || EMAIL;
}

export function parseNotifyEmails(): string[] {
  return String(process.env.ADMIN_NOTIFY_EMAILS ?? process.env.ADMIN_EMAILS ?? "")
    .split(/[,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}
