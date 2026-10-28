import { describe, expect, it } from "vitest";
import {
  isTestIngestUrl,
  testIngestAllowed,
} from "@/lib/growth/is-test-ingest-url";

describe("isTestIngestUrl", () => {
  it("flags example.com", () => {
    expect(isTestIngestUrl("https://example.com/jobs/1")).toBe(true);
  });

  it("allows real hosts", () => {
    expect(isTestIngestUrl("https://www.linkedin.com/posts/foo")).toBe(false);
  });

  it("testIngestAllowed respects env", () => {
    const prev = process.env.ALLOW_TEST_INGEST;
    delete process.env.ALLOW_TEST_INGEST;
    expect(testIngestAllowed()).toBe(false);
    process.env.ALLOW_TEST_INGEST = "1";
    expect(testIngestAllowed()).toBe(true);
    if (prev === undefined) delete process.env.ALLOW_TEST_INGEST;
    else process.env.ALLOW_TEST_INGEST = prev;
  });
});
