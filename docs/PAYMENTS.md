# Payments — legal, receipts, and customer flow

## Customer payment pages

Public routes under `/pay/[slug]`:

| Route | Purpose |
| --- | --- |
| `/pay/[slug]` | Invoice + pay (card via Paystack when configured, Mobile Money via KPay) |
| `/pay/[slug]/return` | Paystack and KPay return handler |
| `/pay/[slug]/receipt` | **Paid only** — printable receipt (A4) |
| `/pay/legal` | Payment processing & data notice |

Every pay page includes a **PaymentLegalNotice** footer linking to `/pay/legal`.

## Payment processor

- **Paystack** is the primary card checkout when `PAYSTACK_SECRET_KEY` is set. Cards are charged in the invoice's local currency on Paystack's hosted page.
- **KPay** still handles Mobile Money. If Paystack is not configured, KPay also handles cards (including the existing USD card limit).
- Stackwise stores invoice metadata and payment status in Neon Postgres.
- Card numbers and mobile-money PINs are never stored by Stackwise.
- New invoices are tagged test or live from the Paystack key (`sk_test_` / `sk_live_`) when Paystack is configured, and from the KPay key otherwise.

## Audit logging

Customer interactions on pay pages log IP address and user agent to `payment_audit_logs`:

| Event | Trigger |
| --- | --- |
| `PAY_PAGE_VIEW` | Invoice page load |
| `PAYMENT_INIT` | Pay button / Paystack or KPay redirect |
| `RETURN_CALLBACK` | Paystack or KPay return URL |
| `RECEIPT_VIEW` | Receipt page (paid only) |

Logs are visible at `/admin/audit-logs` (latest 100 events) and on each payment-link detail page. Apply migration `0003_payment_audit_logs.sql` (or `npm run db:migrate`).

## Receipt access

Receipts are gated by payment status:

- `canAccessReceipt(link)` returns true only when `status === "PAID"`.
- Unpaid links redirect from `/pay/[slug]/receipt` to the pay page.
- Admin “View receipt” is shown only for paid links.

## Receipt email

When payment completes (webhook or return URL sync), `finalizePaidPayment`:

1. Marks the link `PAID`
2. Sends receipt email to the customer via `sendPaymentReceiptEmails`
3. Notifies admins listed in `ADMIN_NOTIFY_EMAILS`

The email includes a **receipt URL** (`/pay/[slug]/receipt`) for viewing and printing.

## Admin dashboard

- Live links: `kpay_is_test = false` only (production DB filter)
- Tables support **search** (invoice, customer, email) and **status filter**
- **10 rows per page** pagination

## Environment variables

See `.env.example` for `PAYSTACK_SECRET_KEY`, `KPAY_*`, `DATABASE_URL`, `SMTP_*`, and `ADMIN_EMAILS`.

Paystack dashboard (Settings → API Keys & Webhooks):

| Field | Value |
| --- | --- |
| **Webhook URL** (test and live) | `https://stackwisetechnologies.com/api/webhooks/paystack` |
| **Callback URL** (test and live) | Leave blank, or `https://stackwisetechnologies.com/pay` — **not** the webhook path. Customers return to `/pay/{slug}/return` because each `transaction/initialize` sets `callback_url`. |

Env: `PAYSTACK_SECRET_KEY` only (`sk_test_` / `sk_live_`). The public key is unused in the hosted-checkout flow.

Webhooks: listen for `charge.success`, `charge.failed`, `subscription.create`, and `subscription.disable`. The secret key signs payloads (`x-paystack-signature`); no separate webhook secret.

### Maintenance subscriptions (Paystack)

- Admin → **Subscriptions** creates a Paystack plan and customer link `/pay/subscribe/[slug]`.
- Customer authorizes recurring card billing (monthly / quarterly / annually).
- Invoice currency must match Paystack (`PAYSTACK_CURRENCIES`, default `KES`).
- Renewals and bank payouts are managed in the Paystack dashboard.
