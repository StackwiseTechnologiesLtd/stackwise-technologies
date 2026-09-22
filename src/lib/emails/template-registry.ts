export type EmailTemplateParts = {
  html: string;
  txt: string;
  subject: string;
};

const loginOtp001: EmailTemplateParts = {
  subject: "Your Stackwise code: {{otp}}",
  txt: `Your Stackwise verification code is {{otp}}.

It expires in 10 minutes. If you did not request this, you can ignore this email.

— Stackwise Technologies`,
  html: `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:350px;margin:0 auto;">
      <tr>
        <td style="background:#ffffff;border-radius:16px;padding:32px 24px;">
          <div style="border-bottom:1px solid #f1f5f9;padding-bottom:24px;margin-bottom:20px;">
            <div style="font-size:20px;font-weight:700;color:#541111;">Stackwise</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">Engineering that delivers.</div>
          </div>
          <div style="font-size:14px;font-weight:700;margin-bottom:8px;">Your verification code</div>
          <div style="font-size:12px;margin-bottom:16px;">Hi {{displayName}}, use this code to sign in to Stackwise Payments admin.</div>
          <div style="font-size:32px;font-weight:700;letter-spacing:6px;text-align:center;color:#541111;padding:16px 0;">{{otp}}</div>
          <div style="font-size:12px;color:#64748b;line-height:18px;border-top:1px solid #f1f5f9;padding-top:16px;">
            Expires in 10 minutes. If you did not request this, ignore this email.
          </div>
          <div style="font-size:12px;margin-top:8px;">
            Best regards,<br /><strong>Stackwise Technologies</strong>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 2px;font-size:12px;color:#64748b;line-height:18px;">
          Stackwise Technologies Limited · RC: 9398438<br />
          info@stackwisetechnologies.com
        </td>
      </tr>
    </table>
  </body>
</html>`,
};

const paymentLink001: EmailTemplateParts = {
  subject: "Payment request {{invoiceNumber}} — Stackwise",
  txt: `{{headline}}

{{body}}

Amount: {{amountUsd}} USD ({{amountLocal}})

Pay here: {{paymentUrl}}

Invoice: {{invoiceNumber}}

— Stackwise Technologies`,
  html: `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:350px;margin:0 auto;">
      <tr>
        <td style="background:#ffffff;border-radius:16px;padding:32px 24px;">
          <div style="border-bottom:1px solid #f1f5f9;padding-bottom:24px;margin-bottom:20px;">
            <div style="font-size:20px;font-weight:700;color:#541111;">Stackwise</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">Engineering that delivers.</div>
          </div>
          <div style="font-size:14px;font-weight:700;color:#541111;">{{headline}}</div>
          <div style="font-size:12px;margin:8px 0;">{{body}}</div>
          <div style="font-size:12px;color:#64748b;margin:8px 0;">{{lineItemsSummary}}</div>
          <div style="font-size:14px;font-weight:700;margin:8px 0;">{{amountUsd}} USD · {{amountLocal}}</div>
          <a href="{{paymentUrl}}" style="display:block;text-align:center;background:#541111;color:#ffffff;text-decoration:none;font-weight:700;border-radius:6px;padding:16px 24px;margin:16px 0;">{{ctaLabel}}</a>
          <div style="font-size:12px;color:#64748b;">Invoice {{invoiceNumber}}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 2px;font-size:12px;color:#64748b;">Stackwise Technologies Limited · RC: 9398438</td>
      </tr>
    </table>
  </body>
</html>`,
};

const paymentReceipt001: EmailTemplateParts = {
  subject: "{{headline}}",
  txt: `{{headline}}

{{body}}

Amount: {{amountUsd}} USD ({{amountLocal}})
Reference: {{reference}}
Invoice: {{invoiceNumber}}

View & print your receipt (A4): {{receiptUrl}}

— Stackwise Technologies`,
  html: `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:350px;margin:0 auto;">
      <tr>
        <td style="background:#ffffff;border-radius:16px;padding:32px 24px;">
          <div style="border-bottom:1px solid #f1f5f9;padding-bottom:24px;margin-bottom:20px;">
            <div style="font-size:20px;font-weight:700;color:#541111;">Stackwise</div>
          </div>
          <div style="font-size:14px;font-weight:700;color:#541111;">{{headline}}</div>
          <div style="font-size:12px;margin:8px 0;">{{body}}</div>
          <div style="font-size:12px;color:#64748b;margin:8px 0;">{{lineItemsSummary}}</div>
          <div style="font-size:14px;font-weight:700;margin:8px 0;">{{amountUsd}} USD · {{amountLocal}}</div>
          <div style="font-size:12px;color:#64748b;">Reference: {{reference}}</div>
          <a href="{{receiptUrl}}" style="display:block;text-align:center;background:#541111;color:#ffffff;text-decoration:none;font-weight:700;border-radius:6px;padding:16px 24px;margin:16px 0;">View &amp; print receipt</a>
          <p style="font-size:12px;color:#64748b;margin:8px 0 0;">Save or print this receipt for your records. Link: {{receiptUrl}}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 2px;font-size:12px;color:#64748b;">Stackwise Technologies Limited · RC: 9398438</td>
      </tr>
    </table>
  </body>
</html>`,
};

const TEMPLATES: Record<string, Record<string, EmailTemplateParts>> = {
  "login-otp": { "0.0.1": loginOtp001 },
  "payment-link": { "0.0.1": paymentLink001 },
  "payment-receipt": { "0.0.1": paymentReceipt001 },
};

export function getEmailTemplate(
  template: string,
  version: string,
): EmailTemplateParts {
  const parts = TEMPLATES[template]?.[version];
  if (!parts) {
    throw new Error(`Unknown email template: ${template}@${version}`);
  }
  return parts;
}
