export type SubscriptionPaystackMetadata = {
  subscriptionId?: string;
  slug?: string;
  kind?: "maintenance_subscription";
};

export function readSubscriptionId(metadata: unknown): string | null {
  let value = metadata;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const record = value as SubscriptionPaystackMetadata;
  if (record.kind && record.kind !== "maintenance_subscription") return null;
  return typeof record.subscriptionId === "string" ? record.subscriptionId : null;
}
