import { afterEach, describe, expect, it } from "vitest";
import {
  adminCheckoutStatus,
  isCheckoutTestMode,
} from "@/lib/payments/admin-checkout";

describe("isCheckoutTestMode", () => {
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  const kpayKey = process.env.KPAY_API_KEY;

  afterEach(() => {
    if (paystackKey === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = paystackKey;
    if (kpayKey === undefined) delete process.env.KPAY_API_KEY;
    else process.env.KPAY_API_KEY = kpayKey;
  });

  it("follows Paystack when configured", () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_example";
    process.env.KPAY_API_KEY = "kpay_live_example";
    expect(isCheckoutTestMode()).toBe(true);
    expect(adminCheckoutStatus().cardProcessor).toBe("PAYSTACK");
  });

  it("falls back to KPay when Paystack is not configured", () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    process.env.KPAY_API_KEY = "kpay_test_example";
    expect(isCheckoutTestMode()).toBe(true);
    expect(adminCheckoutStatus().cardProcessor).toBe("KPAY");
  });
});
