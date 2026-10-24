import { afterEach, describe, expect, it } from "vitest";
import { isCrmAutoPipelineEnabled } from "@/lib/crm/auto-sync";

describe("isCrmAutoPipelineEnabled", () => {
  const prev = process.env.CRM_AUTO_PIPELINE;

  afterEach(() => {
    if (prev === undefined) delete process.env.CRM_AUTO_PIPELINE;
    else process.env.CRM_AUTO_PIPELINE = prev;
  });

  it("is on by default", () => {
    delete process.env.CRM_AUTO_PIPELINE;
    expect(isCrmAutoPipelineEnabled()).toBe(true);
  });

  it("can be disabled", () => {
    process.env.CRM_AUTO_PIPELINE = "false";
    expect(isCrmAutoPipelineEnabled()).toBe(false);
  });
});
