import { describe, expect, it } from "vitest";
import {
  commentMatchesKeyword,
  renderInstagramTemplate,
  triggerMatchesKeyword,
} from "@/lib/instagram/keyword";

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

describe("triggerMatchesKeyword", () => {
  it("matches DM keywords case-insensitively", () => {
    expect(triggerMatchesKeyword("dm", "LOOIAL", "looial")).toBe(true);
    expect(triggerMatchesKeyword("dm", "hey LOOIAL there", "looial")).toBe(true);
    expect(triggerMatchesKeyword("story_reply", "LoOiAl", "looial")).toBe(true);
  });
});

describe("renderInstagramTemplate", () => {
  it("substitutes username", () => {
    expect(renderInstagramTemplate("Hi {username}", { username: "maya.creates" })).toBe(
      "Hi maya.creates",
    );
  });
});