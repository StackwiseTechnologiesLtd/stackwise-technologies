import { describe, expect, it } from "vitest";
import {
  parsePortalEmail,
  parsePortalMemberId,
  parsePortalOtp,
  parsePortalPassword,
  parsePortalPasswordForLogin,
} from "./validation";

describe("brand portal validation", () => {
  it("accepts normal emails and rejects injection-like input", () => {
    expect(parsePortalEmail("client@opsis.partners")).toBe("client@opsis.partners");
    expect(parsePortalEmail("bad'; DROP TABLE--@x.com")).toBeNull();
    expect(parsePortalEmail("a@b")).toBeNull();
    expect(parsePortalEmail(`${"a".repeat(300)}@example.com`)).toBeNull();
  });

  it("validates passwords", () => {
    expect(parsePortalPassword("short")).toBeNull();
    expect(parsePortalPassword("valid-pass-12")).toBe("valid-pass-12");
    expect(parsePortalPasswordForLogin("legacy1")).toBe("legacy1");
    expect(parsePortalPassword("has\x00null")).toBeNull();
  });

  it("validates otp and member ids", () => {
    expect(parsePortalOtp("123456")).toBe("123456");
    expect(parsePortalOtp("12a456")).toBeNull();
    expect(
      parsePortalMemberId("550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(parsePortalMemberId("not-a-uuid")).toBeNull();
  });
});
