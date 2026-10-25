import { describe, expect, it } from "vitest";
import { hashPortalPassword, verifyPortalPassword } from "./password";

describe("portal password", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPortalPassword("test-portal-secret");
    expect(hash.startsWith("pbkdf2-sha256:")).toBe(true);
    await expect(verifyPortalPassword("test-portal-secret", hash)).resolves.toBe(true);
    await expect(verifyPortalPassword("wrong", hash)).resolves.toBe(false);
  });
});
