import { describe, expect, it } from "vitest";
import { parseLinkedInJobCardText } from "@/lib/growth/harvest-extract-jobs";

describe("parseLinkedInJobCardText", () => {
  it("parses title company location from new Jobs card text", () => {
    const parsed = parseLinkedInJobCardText(
      "Full-Stack Developer (m/f/d) (Verified job) Full-Stack Developer (m/f/d) Statkraft Düsseldorf (Hybrid) Posted 3 weeks ago 3 weeks ago · Easy Apply",
    );
    expect(parsed.title).toBe("Full-Stack Developer (m/f/d)");
    expect(parsed.company).toBe("Statkraft");
    expect(parsed.location).toContain("Hybrid");
    expect(parsed.snippet).toMatch(/Easy Apply/);
  });

  it("parses city-only location without workplace type", () => {
    const parsed = parseLinkedInJobCardText(
      "DevOps Engineer (all genders) PRODYNA Düsseldorf 1 month ago · Be an early applicant",
    );
    expect(parsed.title).toBe("DevOps Engineer (all genders)");
    expect(parsed.company).toBe("PRODYNA");
    expect(parsed.location).toBe("Düsseldorf");
  });
});
