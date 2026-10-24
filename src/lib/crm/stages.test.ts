import { describe, expect, it } from "vitest";
import { crmStageLabels } from "@/lib/crm/types";
import { pipelineStatuses } from "@/lib/growth/types";

describe("crmStageLabels", () => {
  it("labels every growth pipeline status", () => {
    for (const status of pipelineStatuses) {
      expect(crmStageLabels[status]).toBeTruthy();
    }
  });
});
