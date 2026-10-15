const LOG_PREFIX = "[growth-ai]";

export function isGrowthAiDebug(): boolean {
  if (process.env.GROWTH_AI_DEBUG === "1") return true;
  if (process.env.GROWTH_AI_DEBUG === "0") return false;
  return process.env.NODE_ENV === "development";
}

export function growthAiLog(message: string, detail?: Record<string, unknown>) {
  if (!isGrowthAiDebug()) return;
  if (detail && Object.keys(detail).length > 0) {
    console.log(`${LOG_PREFIX} ${message}`, detail);
  } else {
    console.log(`${LOG_PREFIX} ${message}`);
  }
}

export function growthAiLogMultiline(label: string, text: string) {
  if (!isGrowthAiDebug()) return;
  console.log(`${LOG_PREFIX} ${label}\n${text}\n${"—".repeat(48)}`);
}
