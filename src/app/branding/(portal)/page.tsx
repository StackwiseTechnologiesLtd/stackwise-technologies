import Link from "next/link";
import { getBrand } from "@/lib/branding/brands";
import { getBrandPortalSession } from "@/lib/branding-portal/session";

export const metadata = {
  title: "Brand guidelines",
  robots: { index: false, follow: false },
};

export default async function BrandingIndexPage() {
  const session = await getBrandPortalSession();
  if (!session) return null;

  const brand = getBrand(session.brandSlug);

  return (
    <main style={{ padding: "2rem", fontFamily: "var(--font-geist-sans), system-ui" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Brand guidelines</h1>
      {brand ? (
        <p style={{ marginBottom: "1rem", color: "var(--fg-3, #888)" }}>
          Signed in as {session.email}
        </p>
      ) : null}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {brand ? (
          <li style={{ marginBottom: "0.5rem" }}>
            <Link href={`/branding/${brand.slug}`}>{brand.name}</Link>
          </li>
        ) : null}
      </ul>
    </main>
  );
}
