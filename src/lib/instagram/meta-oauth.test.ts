import { describe, expect, it } from "vitest";
import { normalizeInstagramOAuthCode } from "./meta-oauth";

describe("normalizeInstagramOAuthCode", () => {
  it("strips Meta #_ suffix", () => {
    expect(normalizeInstagramOAuthCode("abc123#_")).toBe("abc123");
  });

  it("returns null for empty", () => {
    expect(normalizeInstagramOAuthCode(null)).toBeNull();
    expect(normalizeInstagramOAuthCode("")).toBeNull();
  });
});