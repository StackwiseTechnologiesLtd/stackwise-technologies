import { Suspense } from "react";
import { BrandPortalLogin } from "@/components/branding/BrandPortalLogin";

export const metadata = {
  title: "Brand guidelines sign in",
  robots: { index: false, follow: false },
};

export default function BrandPortalLoginPage() {
  return (
    <Suspense>
      <BrandPortalLogin />
    </Suspense>
  );
}
