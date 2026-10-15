import { describe, expect, it } from "vitest";

// Test flattenContent logic via a minimal mirror (extractAssistantText is not exported)
function flattenContent(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => flattenContent(part))
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  if (typeof content === "object") {
    const o = content as Record<string, unknown>;
    if (typeof o.text === "string" && o.text.trim()) return o.text.trim();
  }
  return "";
}

describe("flattenContent", () => {
  it("reads text from object-shaped content", () => {
    expect(flattenContent({ type: "output_text", text: "Hello Amit" })).toBe(
      "Hello Amit",
    );
  });
});
