import { describe, expect, it } from "vitest";
import { commentMatchesKeyword, renderInstagramTemplate } from "@/lib/instagram/keyword";

describe("commentMatchesKeyword", () => {
  it("matches standalone keyword", () => {
    expect(commentMatchesKeyword("GUIDE", "GUIDE")).toBe(true);
    expect(commentMatchesKeyword("guide please", "GUIDE")).toBe(true);
    expect(commentMatchesKeyword("I need GUIDE!", "GUIDE")).toBe(true);
  });

  it("rejects unrelated text", () => {
    expect(commentMatchesKeyword("guidelines", "GUIDE")).toBe(false);
    expect(commentMatchesKeyword("hello", "GUIDE")).toBe(false);
  });
});

describe("renderInstagramTemplate", () => {
  it("substitutes username", () => {
    expect(renderInstagramTemplate("Hi {username}", { username: "maya.creates" })).toBe(
      "Hi maya.creates",
    );
  });
});