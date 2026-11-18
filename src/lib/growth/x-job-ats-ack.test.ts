import { describe, expect, it } from "vitest";
import {
  applyUrlAckLabel,
  buildXJobAtsAckReply,
} from "@/lib/growth/personalized-x-job-apply";

describe("x-job-ats-ack", () => {
  it("names Ashby in ack copy", () => {
    expect(
      applyUrlAckLabel("https://jobs.ashbyhq.com/quora/full-stack"),
    ).toBe("Ashby posting");
    const body = buildXJobAtsAckReply({
      roleTitle: "Full Stack Engineer",
      applyUrl: "https://jobs.ashbyhq.com/quora/full-stack",
    });
    expect(body).toContain("Ashby");
    expect(body).not.toMatch(/—/);
    expect(body.toLowerCase()).not.toContain("dm");
  });
});