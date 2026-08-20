import { describe, expect, it } from "vitest";
import {
  CALENDLY_URL,
  EMAIL,
  en,
  fr,
  getCopy,
  isLocale,
  launcherItemsFor,
  locales,
} from "./content";

describe("content catalogs", () => {
  it("exposes a reachable contact path", () => {
    expect(EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(CALENDLY_URL.startsWith("https://")).toBe(true);
  });

  it("supports english and french locales", () => {
    expect(locales).toEqual(["en", "fr"]);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(getCopy("en")).toBe(en);
    expect(getCopy("fr")).toBe(fr);
  });

  it("keeps navigation targets unique and on-page for both locales", () => {
    for (const locale of locales) {
      const hrefs = getCopy(locale).nav.links.map((link) => link.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      expect(hrefs.every((href) => href.startsWith("#"))).toBe(true);
    }
  });

  it("mirrors section structure across english and french", () => {
    expect(en.work.items).toHaveLength(fr.work.items.length);
    expect(en.features.cards).toHaveLength(fr.features.cards.length);
    expect(en.providers.inventory).toHaveLength(fr.providers.inventory.length);
    expect(en.compare.rows).toHaveLength(fr.compare.rows.length);
    expect(en.cost.rows).toHaveLength(fr.cost.rows.length);
    expect(en.architecture.steps).toHaveLength(fr.architecture.steps.length);
    expect(en.faq.items).toHaveLength(fr.faq.items.length);
    expect(launcherItemsFor("en")).toHaveLength(5);
    expect(launcherItemsFor("fr")).toHaveLength(5);
    expect(en.faq.items[0]?.points?.length).toBeGreaterThan(0);
    expect(fr.faq.items[0]?.points?.length).toBeGreaterThan(0);
  });
});
