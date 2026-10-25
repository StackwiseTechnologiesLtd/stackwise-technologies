import Link from "next/link";
import { listBrands } from "@/lib/branding/brands";

export const metadata = {
  title: "Brand guidelines",
  robots: { index: false, follow: false },
};

export default function BrandingIndexPage() {
  const brands = listBrands();

  return (
    <main style={{ padding: "2rem", fontFamily: "var(--font-geist-sans), system-ui" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Brand guidelines</h1>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {brands.map((brand) => (
          <li key={brand.slug} style={{ marginBottom: "0.5rem" }}>
            <Link href={`/branding/${brand.slug}`}>{brand.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
