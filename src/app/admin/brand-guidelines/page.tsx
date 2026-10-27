"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BTN_PRIMARY } from "@/lib/ui/buttons";
import { useToast } from "@/components/ToastProvider";

type BrandRow = {
  slug: string;
  name: string;
  published: boolean;
  storage: "code" | "database";
};

export default function AdminBrandGuidelinesPage() {
  const toast = useToast();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/brand-guidelines");
    if (!res.ok) return;
    const data = (await res.json()) as { brands: BrandRow[] };
    setBrands(data.brands);
  }, []);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  async function createBrand(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/brand-guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim(), name: name.trim() }),
      });
      const data = (await res.json()) as { error?: string; slug?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not create brand");
      toast.toast("Brand created — add copy and uploads");
      setSlug("");
      setName("");
      await load();
      if (data.slug) {
        window.location.href = `/admin/brand-guidelines/${data.slug}`;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Brand guidelines"
        description="Create and edit client brand portals. Database brands store assets in Neon; in-repo brands can be edited here and saved to the database when you’re ready."
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold">All brand systems</h2>
        {brands.length === 0 ? (
          <p className="text-sm text-muted">No brands registered yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/admin/brand-guidelines/${b.slug}`}
                  className="flex items-center justify-between gap-3 rounded border border-[var(--admin-border)] px-3 py-2.5 text-sm hover:bg-[var(--admin-surface)]"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{b.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{b.slug}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                    <span
                      className={
                        b.storage === "database"
                          ? "rounded bg-[var(--admin-surface)] px-1.5 py-0.5"
                          : "rounded border border-[var(--admin-border)] px-1.5 py-0.5"
                      }
                    >
                      {b.storage === "database" ? "Database" : "In repo"}
                    </span>
                    {b.published ? "Published" : "Draft"}
                    <span className="text-[var(--admin-fg)]">Edit →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        onSubmit={createBrand}
        className="flex max-w-xl flex-col gap-3 rounded-lg border border-[var(--admin-border)] p-4"
      >
        <h2 className="text-sm font-semibold">New brand</h2>
        <p className="text-xs text-muted">
          Uses the Opsis shell template. Slug must not match an existing brand.
        </p>
        <label className="flex flex-col gap-1 text-sm">
          Slug (lowercase, hyphens)
          <input
            className="rounded border border-[var(--admin-border)] px-3 py-2 font-mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="acme-corp"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Display name
          <input
            className="rounded border border-[var(--admin-border)] px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            required
          />
        </label>
        <button type="submit" className={BTN_PRIMARY} disabled={creating}>
          {creating ? "Creating…" : "Create from template"}
        </button>
      </form>

      <p className="text-sm text-muted">
        Customer access:{" "}
        <Link href="/admin/brand-portal" className="underline">
          Brand access
        </Link>
      </p>
    </div>
  );
}
