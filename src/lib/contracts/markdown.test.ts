import { describe, expect, it } from "vitest";
import { markdownToContractHtml } from "@/lib/contracts/markdown";

describe("markdownToContractHtml", () => {
  it("renders headings and lists", () => {
    const html = markdownToContractHtml(
      "## Scope\n\n- Item one\n- Item two\n\nPlain paragraph.",
    );
    expect(html).toContain("<h2>Scope</h2>");
    expect(html).toContain("<li>Item one</li>");
    expect(html).toContain("<p>Plain paragraph.</p>");
  });

  it("escapes HTML in source", () => {
    const html = markdownToContractHtml("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
