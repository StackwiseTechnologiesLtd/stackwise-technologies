import { describe, expect, it } from "vitest";
import { parseIntegrationIngestBody } from "@/lib/integrations/ingest-payload";

describe("parseIntegrationIngestBody", () => {
  it("accepts a minimal huginn payload", () => {
    const result = parseIntegrationIngestBody({
      source: "huginn",
      platform: "linkedin",
      authorName: "Jane Doe",
      bodyText: "Looking for a dev team",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.leadSource).toBe("huginn");
      expect(result.input.platform).toBe("linkedin");
    }
  });

  it("rejects missing source", () => {
    const result = parseIntegrationIngestBody({
      platform: "x",
      authorName: "A",
      bodyText: "B",
    });
    expect(result).toEqual({
      ok: false,
      error:
        "Invalid source (huginn, freehire, linkedin_jobs, manual, harvest, firecrawl)",
    });
  });

  it("accepts linkedin_jobs", () => {
    const result = parseIntegrationIngestBody({
      source: "linkedin_jobs",
      platform: "linkedin",
      authorName: "Acme",
      roleTitle: "Engineer",
      companyName: "Acme",
      bodyText: "Remote full-stack role shipping product.",
      sourceUrl: "https://www.linkedin.com/jobs/view/123",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.leadSource).toBe("linkedin_jobs");
    }
  });

  it("rejects empty author", () => {
    const result = parseIntegrationIngestBody({
      source: "manual",
      platform: "linkedin",
      authorName: "  ",
      bodyText: "hello",
    });
    expect(result.ok).toBe(false);
  });
});
