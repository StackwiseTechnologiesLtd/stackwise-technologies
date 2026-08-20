import { describe, expect, it } from "vitest";
import {
  CALENDLY_URL,
  EMAIL,
  capabilities,
  compareRows,
  faqs,
  launcherItems,
  navLinks,
  processSteps,
  stats,
  workItems,
} from "./site";

describe("site content", () => {
  it("exposes a reachable contact path", () => {
    expect(EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(CALENDLY_URL.startsWith("https://")).toBe(true);
  });

  it("keeps navigation targets unique and on-page", () => {
    const hrefs = navLinks.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.every((href) => href.startsWith("#"))).toBe(true);
  });

  it("has complete marketing sections", () => {
    expect(stats.length).toBeGreaterThanOrEqual(3);
    expect(workItems.length).toBe(8);
    expect(launcherItems.length).toBeGreaterThanOrEqual(5);
    expect(capabilities.length).toBeGreaterThanOrEqual(12);
    expect(compareRows.length).toBe(4);
    expect(processSteps.map((step) => step.n)).toEqual([
      "01",
      "02",
      "03",
      "04",
    ]);
    expect(faqs.length).toBe(6);
    expect(new Set(faqs.map((item) => item.q)).size).toBe(faqs.length);
  });
});
