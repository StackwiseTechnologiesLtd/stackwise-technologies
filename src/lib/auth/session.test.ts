import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";

describe("session tokens", () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  afterEach(() => {
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.KPAY_WEBHOOK_SECRET;
  });

  it("creates and verifies a valid token", async () => {
    const token = await createSessionToken("admin@test.com");
    const payload = await verifySessionToken(token);
    expect(payload?.email).toBe("admin@test.com");
  });

  it("rejects tokens signed with a different admin session secret", async () => {
    const token = await createSessionToken("admin@test.com");
    process.env.ADMIN_SESSION_SECRET =
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const payload = await verifySessionToken(token);
    expect(payload).toBeNull();
  });
});
