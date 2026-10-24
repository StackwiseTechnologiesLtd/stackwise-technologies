import { buildMarketingJsonLd } from "@/lib/site-knowledge";

export default function MarketingStructuredData() {
  const json = JSON.stringify(buildMarketingJsonLd());
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
