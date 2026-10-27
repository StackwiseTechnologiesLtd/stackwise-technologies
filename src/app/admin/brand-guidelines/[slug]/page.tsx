import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BrandGuidelinesAdminEditor } from "@/components/admin/BrandGuidelinesAdminEditor";

type PageProps = { params: Promise<{ slug: string }> };

export default async function AdminBrandGuidelineEditPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`Edit ${slug}`}
        description="Fill copy, colors, and upload assets for the guidelines portal."
      />
      <BrandGuidelinesAdminEditor slug={slug} />
    </div>
  );
}
