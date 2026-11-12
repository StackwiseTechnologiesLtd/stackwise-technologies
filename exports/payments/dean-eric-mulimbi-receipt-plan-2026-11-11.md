# Receipt plan — Ir. Dean Eric Mulimbi (installment 2)

**Status:** Draft — pending approval before send  
**Prepared:** 2026-11-11  
**Customer email:** deancin@gmail.com  

Internal checklist and customer copy for recording an M-Pesa payment and issuing the official Stackwise receipt (`/pay/[slug]/receipt` + `payment-receipt` email).

See [docs/PAYMENTS.md](../../docs/PAYMENTS.md) for admin flow (manual payment, resend receipt).

---

## Assumptions to confirm

| Field | Draft value | Confirmed |
| --- | --- | --- |
| Customer | Ir. Dean Eric Mulimbi | |
| Email | deancin@gmail.com | |
| This payment | **USD 200.00** | |
| Method | M-Pesa (manual — Mobile Money) | |
| Engagement total | **USD 600.00** (3 × USD 200) | |
| Paid to date (after this receipt) | **USD 400.00** | |
| Balance remaining | **USD 200.00** | |
| M-Pesa confirmation code | `[INSERT CODE]` | |
| KES received | `[INSERT KES AMOUNT]` | |
| Collection date | **11 November 2026** | |

If totals differ (e.g. USD 400 total with USD 200 left after this payment), update installment wording and the balance block below before send.

---

## Admin steps (after approval)

Create a **new payment link** for this installment only, or **record manual payment** on an existing USD invoice.

### Customer and line item

- **Bill to:** Ir. Dean Eric Mulimbi  
- **Email:** deancin@gmail.com  
- **Line item:** Software development commitment — **installment 2 of 3** (USD 200.00 × 1)  
- **Invoice total (this receipt):** USD 200.00  

### Manual payment recording

- **Payment source:** Manual  
- **Method:** Mobile Money  
- **Amount received (USD):** 200.00  
- **Amount received (local):** `[KES as received]`  
- **Payment reference:** `[M-Pesa transaction ID]`  
- **Collected at:** `[date/time verified on phone]`  
- **Notes (suggested):**  
  `M-Pesa payment received for software development commitment (installment 2 of 3). Engagement total USD 600; USD 400 received to date; USD 200 balance due on final installment.`

Then mark paid and resend receipt (or rely on finalize to send the receipt email).

---

## Customer email

### Subject

`Receipt [INVOICE-NO] — payment received`

Replace `[INVOICE-NO]` with the invoice number from admin.

### Body

Hi Ir. Dean Eric Mulimbi,

Thank you — we've received your **USD 200.00** payment for your software development commitment with Stackwise Technologies Limited.

**Receipt summary**

- **Description:** Software development commitment — installment 2 of 3  
- **Amount received:** USD 200.00 (`[KES amount]` via M-Pesa)  
- **Payment reference:** `[M-Pesa confirmation code]`  
- **Collected:** 11 November 2026  

**Engagement balance (for your records)**

- **Total commitment:** USD 600.00  
- **Received to date:** USD 400.00  
- **Remaining:** USD 200.00 (final installment, as agreed)

Open the link below to **view and print your receipt** (A4):

`https://stackwisetechnologies.com/pay/[SLUG]/receipt`

If anything on the receipt does not match your M-Pesa message, reply to this email with the confirmation text and we will correct it.

Kind regards,  
**Stackwise Technologies Limited**  
RC: 9398438  
info@stackwisetechnologies.com

---

## Printable receipt — payment details block

Matches fields on `/pay/.../receipt`:

| Field | Value |
| --- | --- |
| Method | Mobile Money |
| Collected | `[datetime]` |
| Amount received | USD 200.00 · `[KES]` |
| Reference | `[M-Pesa code]` |
| Notes | Installment 2 of 3; USD 200 balance remaining on engagement |

---

## Sign-off before send

- [ ] M-Pesa transaction ID and exact KES amount filled in  
- [ ] Totals confirmed (USD 600 / USD 400 paid / USD 200 remaining, or corrected)  
- [ ] New invoice vs. reuse of prior payment link decided  
- [ ] Customer email wording approved  
- [ ] Payment recorded in admin; receipt URL tested  
- [ ] Receipt email sent to deancin@gmail.com
