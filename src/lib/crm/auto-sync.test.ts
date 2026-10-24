import { afterEach, describe, expect, it } from "vitest";
import {
  crmAutoPipelineMinScore,
  isCrmAutoPipelineEnabled,
  shouldAutoSyncLeadToCrm,
} from "@/lib/crm/auto-sync";
import { HARVEST_MIN_COMPOSITE_SCORE } from "@/lib/growth/harvest-config";

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

describe("shouldAutoSyncLeadToCrm", () => {
  const prevMin = process.env.CRM_AUTO_PIPELINE_MIN_SCORE;
  const prevAuto = process.env.CRM_AUTO_PIPELINE;

  afterEach(() => {
    if (prevMin === undefined) delete process.env.CRM_AUTO_PIPELINE_MIN_SCORE;
    else process.env.CRM_AUTO_PIPELINE_MIN_SCORE = prevMin;
    if (prevAuto === undefined) delete process.env.CRM_AUTO_PIPELINE;
    else process.env.CRM_AUTO_PIPELINE = prevAuto;
  });

  it("uses harvest min score by default", () => {
    delete process.env.CRM_AUTO_PIPELINE_MIN_SCORE;
    expect(crmAutoPipelineMinScore()).toBe(HARVEST_MIN_COMPOSITE_SCORE);
    expect(shouldAutoSyncLeadToCrm(HARVEST_MIN_COMPOSITE_SCORE - 1)).toBe(
      false,
    );
    expect(shouldAutoSyncLeadToCrm(HARVEST_MIN_COMPOSITE_SCORE)).toBe(true);
  });
});
