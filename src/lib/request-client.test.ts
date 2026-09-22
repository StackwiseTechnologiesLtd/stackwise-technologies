import { describe, expect, it } from "vitest";
import { getClientIp, getUserAgent } from "@/lib/request-client";

describe("getClientIp", () => {
  it("prefers cf-connecting-ip", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1",
    });
    expect(getClientIp(headers)).toBe("203.0.113.10");
  });

  it("uses first x-forwarded-for hop", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    expect(getClientIp(headers)).toBe("198.51.100.1");
  });
});

describe("getUserAgent", () => {
  it("truncates long user agents", () => {
    const headers = new Headers({
      "user-agent": "x".repeat(600),
    });
    expect(getUserAgent(headers)).toHaveLength(512);
  });
});
