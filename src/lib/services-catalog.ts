export type CatalogService = {
  id: string;
  name: string;
  description: string;
  defaultPriceUsd: number;
  category: "consulting" | "development" | "advisory" | "other";
};

/** Default USD prices kept below KPay card limit ($874.50). Adjust per invoice as needed. */
export const SERVICES_CATALOG: CatalogService[] = [
  {
    id: "discovery-workshop",
    name: "Discovery Workshop",
    description: "Half-day scoped discovery session for product or platform initiatives.",
    defaultPriceUsd: 99,
    category: "consulting",
  },
  {
    id: "architecture-review",
    name: "Architecture Review",
    description: "Technical architecture assessment with written recommendations.",
    defaultPriceUsd: 149,
    category: "advisory",
  },
  {
    id: "technical-advisory",
    name: "Technical Advisory (Monthly)",
    description: "Ongoing senior engineering advisory and decision support.",
    defaultPriceUsd: 499,
    category: "advisory",
  },
  {
    id: "consulting-day",
    name: "Consulting Day",
    description: "Full day of senior engineering consulting.",
    defaultPriceUsd: 199,
    category: "consulting",
  },
  {
    id: "custom-platform",
    name: "Custom Platform Build",
    description: "Scoped custom software platform development engagement.",
    defaultPriceUsd: 749,
    category: "development",
  },
  {
    id: "ai-integration",
    name: "AI Integration Sprint",
    description: "Two-week sprint to integrate AI capabilities into your product.",
    defaultPriceUsd: 499,
    category: "development",
  },
  {
    id: "cloud-migration",
    name: "Cloud Migration Assessment",
    description: "Migration planning, cost modeling, and execution roadmap.",
    defaultPriceUsd: 349,
    category: "consulting",
  },
  {
    id: "devops-setup",
    name: "DevOps & CI/CD Setup",
    description: "Pipeline, observability, and deployment infrastructure setup.",
    defaultPriceUsd: 399,
    category: "development",
  },
  {
    id: "dedicated-team",
    name: "Dedicated Team (Monthly)",
    description: "Embedded engineering team allocation per month.",
    defaultPriceUsd: 799,
    category: "development",
  },
  {
    id: "codebase-audit",
    name: "Codebase Audit",
    description: "Security, performance, and maintainability audit with action plan.",
    defaultPriceUsd: 199,
    category: "advisory",
  },
  {
    id: "api-design",
    name: "API Design & Implementation",
    description: "REST or GraphQL API design and initial implementation.",
    defaultPriceUsd: 449,
    category: "development",
  },
  {
    id: "custom",
    name: "Custom Service",
    description: "Ad-hoc service — set your own price and description.",
    defaultPriceUsd: 0,
    category: "other",
  },
];

export function getServiceById(id: string): CatalogService | undefined {
  return SERVICES_CATALOG.find((s) => s.id === id);
}

export function sumLineItemsUsd(
  items: { quantity: number; unitPriceUsd: number }[],
): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPriceUsd, 0);
}
