import { listBrands } from "@/lib/branding/brands";
import { getBrandingViewer } from "@/lib/branding-portal/access";
import { BrandingPickerPage } from "@/components/branding/BrandingPickerPage";

export const metadata = {
  title: "Brand guidelines",
  robots: { index: false, follow: false },
};

export default async function BrandingIndexPage() {
  const viewer = await getBrandingViewer();
  if (!viewer) return null;

  return <BrandingPickerPage brands={listBrands()} viewer={viewer} />;
}
