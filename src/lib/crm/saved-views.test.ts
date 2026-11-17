import { describe, expect, it } from "vitest";
import { crmOpportunitiesQuery, parseCrmSavedView } from "@/lib/crm/saved-views";

describe("crm saved views", () => {
  it("parses known view ids", () => {
    expect(parseCrmSavedView("needs_action")).toBe("needs_action");
    expect(parseCrmSavedView("bogus")).toBe("all");
  });

  it("builds query string for API", () => {
    expect(crmOpportunitiesQuery("all")).toBe("");
    expect(crmOpportunitiesQuery("high_fit")).toBe("?view=high_fit");
  });
});