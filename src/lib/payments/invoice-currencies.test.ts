import { describe, expect, it } from "vitest";
import {
  invoiceUsesPaystackCard,
  selectableInvoiceCurrencies,
} from "@/lib/payments/invoice-currencies";

describe("selectableInvoiceCurrencies", () => {
  it("limits to Paystack currencies when card uses Paystack", () => {
    expect(
      selectableInvoiceCurrencies("BOTH", "PAYSTACK", ["KES"]).map(
        (c) => c.code,
      ),
    ).toEqual(["KES"]);
    expect(
      selectableInvoiceCurrencies("CARD", "PAYSTACK", ["KES", "NGN"]).map(
        (c) => c.code,
      ),
    ).toEqual(["KES"]);
  });

  it("allows all KPay currencies for Mobile Money only", () => {
    expect(
      selectableInvoiceCurrencies("MOBILE_MONEY", "PAYSTACK", ["KES"]).length,
    ).toBeGreaterThan(1);
  });

  it("detects Paystack card on invoice", () => {
    expect(invoiceUsesPaystackCard("BOTH", "PAYSTACK")).toBe(true);
    expect(invoiceUsesPaystackCard("MOBILE_MONEY", "PAYSTACK")).toBe(false);
    expect(invoiceUsesPaystackCard("BOTH", "KPAY")).toBe(false);
  });
});
