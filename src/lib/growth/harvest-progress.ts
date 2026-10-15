import type { GrowthPlatform } from "@/lib/growth/types";

export type HarvestProgressEvent =
  | { type: "progress"; phase: string; message: string; at: string }
  | {
      type: "complete";
      platform: GrowthPlatform;
      captured: number;
      ingested: number;
      at: string;
    }
  | { type: "error"; message: string; at: string };

export type HarvestReporter = (
  phase: string,
  message: string,
) => void | Promise<void>;

export function progressLine(
  phase: string,
  message: string,
): HarvestProgressEvent {
  return { type: "progress", phase, message, at: new Date().toISOString() };
}

export function encodeHarvestEvent(event: HarvestProgressEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}
