import Link from "next/link";

export function GrowthCrmPipelineBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-sm">
      <p className="text-muted">
        Pipeline stages and notes live in{" "}
        <span className="font-medium text-foreground">CRM</span>. Use this area
        for inbox, harvest, and replies.
      </p>
      <Link
        href="/admin/crm"
        className="shrink-0 font-medium text-accent hover:underline"
      >
        Open pipeline →
      </Link>
    </div>
  );
}
