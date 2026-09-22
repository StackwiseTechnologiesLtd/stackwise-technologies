import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";

describe("session tokens", () => {
  beforeEach(() => {
    process.env.KPAY_WEBHOOK_SECRET =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  afterEach(() => {
    delete process.env.KPAY_WEBHOOK_SECRET;
  });

  it("creates and verifies a valid token", async () => {
    const token = await createSessionToken("admin@test.com");
    const payload = await verifySessionToken(token);
    expect(payload?.email).toBe("admin@test.com");
  });
});
