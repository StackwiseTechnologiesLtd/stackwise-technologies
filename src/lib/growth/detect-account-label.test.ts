import { describe, expect, it } from "vitest";
import { platformAccountDisplay } from "@/lib/growth/detect-account-label";
import type { PlatformCredentialStatus } from "@/lib/growth/types";

function status(
  partial: Partial<PlatformCredentialStatus> & { platform: "x" | "linkedin" },
): PlatformCredentialStatus {
  return {
    connected: true,
    updatedAt: null,
    lastSyncAt: null,
    displayLabel: null,
    sessionStatus: "active",
    lastHealthCheckAt: null,
    lastError: null,
    connectedAccountLabel: null,
    ...partial,
  };
}

describe("platformAccountDisplay", () => {
  it("prefers connectedAccountLabel over displayLabel", () => {
    expect(
      platformAccountDisplay(
        status({
          platform: "x",
          connectedAccountLabel: "@stackwise",
          displayLabel: "old",
        }),
      ),
    ).toBe("@stackwise");
  });
});
