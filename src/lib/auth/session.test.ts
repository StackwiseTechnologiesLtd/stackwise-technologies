import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";

describe("session tokens", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-key-at-least-32-characters-long";
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("creates and verifies a valid token", async () => {
    const token = await createSessionToken("admin@test.com");
    const payload = await verifySessionToken(token);
    expect(payload?.email).toBe("admin@test.com");
  });
});
