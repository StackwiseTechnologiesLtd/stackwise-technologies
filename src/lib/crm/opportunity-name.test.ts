import { describe, expect, it } from "vitest";
import { crmOpportunityDisplayName } from "@/lib/crm/opportunity-name";

describe("crmOpportunityDisplayName", () => {
  it("formats freehire jobs", () => {
    expect(
      crmOpportunityDisplayName({
        leadSource: "freehire",
        fullName: "Acme SaaS Ltd",
        roleTitle: "Senior Developer",
        companyName: "Acme SaaS Ltd",
      }),
    ).toBe("Hiring: Senior Developer @ Acme SaaS Ltd");
  });

  it("formats harvest leads with company", () => {
    expect(
      crmOpportunityDisplayName({
        leadSource: "harvest",
        fullName: "Jane Doe",
        roleTitle: "CTO",
        companyName: "Startup",
      }),
    ).toBe("Jane Doe @ Startup");
  });
});
