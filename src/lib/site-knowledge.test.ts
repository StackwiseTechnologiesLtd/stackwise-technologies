import { describe, expect, it } from "vitest";
import {
  buildLlmsFullDocument,
  buildLlmsTxt,
  buildMarketingJsonLd,
} from "@/lib/site-knowledge";

describe("site-knowledge", () => {
  it("llms.txt points at the full brief and contact", () => {
    const text = buildLlmsTxt();
    expect(text).toContain("llms-full.txt");
    expect(text).toContain("info@stackwisetechnologies.com");
  });

  it("llms-full includes FAQ and portfolio", () => {
    const text = buildLlmsFullDocument();
    expect(text).toContain("Why hire Stackwise");
    expect(text).toContain("Alemnet");
    expect(text).toContain("How do we get started?");
  });

  it("JSON-LD graph includes FAQPage and Organization", () => {
    const graph = buildMarketingJsonLd();
    expect(graph["@context"]).toBe("https://schema.org");
    const nodes = graph["@graph"] as { "@type": string }[];
    const types = nodes.map((n) => n["@type"]);
    expect(types).toContain("FAQPage");
    expect(types).toContain("Organization");
  });
});
