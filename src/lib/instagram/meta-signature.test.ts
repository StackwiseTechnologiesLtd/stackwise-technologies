import { describe, expect, it } from "vitest";
import { verifyMetaWebhookSignature } from "@/lib/instagram/meta-signature";

describe("verifyMetaWebhookSignature", () => {
  it("accepts valid sha256 signatures", async () => {
    const secret = "test-secret";
    const body = '{"object":"instagram"}';
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const hex = [...new Uint8Array(mac)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const ok = await verifyMetaWebhookSignature(body, `sha256=${hex}`, secret);
    expect(ok).toBe(true);
  });

  it("rejects bad signatures", async () => {
    const ok = await verifyMetaWebhookSignature("{}", "sha256=00", "secret");
    expect(ok).toBe(false);
  });
});