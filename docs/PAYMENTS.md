# Payments — legal, receipts, and customer flow

## Customer payment pages

Public routes under `/pay/[slug]`:

| Route | Purpose |
| --- | --- |
| `/pay/[slug]` | Invoice + pay (Card / Mobile Money via KPay) |
| `/pay/[slug]/return` | KPay return handler |
| `/pay/[slug]/receipt` | **Paid only** — printable receipt (A4) |
| `/pay/legal` | Payment processing & data notice |

Every pay page includes a **PaymentLegalNotice** footer linking to `/pay/legal`.

## Payment processor

- **KPay** handles checkout (card + Mobile Money).
- Stackwise stores invoice metadata and payment status in Neon Postgres.
- Card numbers and mobile-money PINs are never stored by Stackwise.

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

See `.env.example` for `KPAY_*`, `DATABASE_URL`, `SMTP_*`, and `ADMIN_EMAILS`.
