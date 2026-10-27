"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BTN_PRIMARY } from "@/lib/ui/buttons";
import { useToast } from "@/components/ToastProvider";

type BrandRow = { slug: string; name: string; published: boolean };

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
        description="Create DB-backed brand portals with the same Opsis shell. Assets live in Neon, not git."
      />

      <form
        onSubmit={createBrand}
        className="flex max-w-xl flex-col gap-3 rounded-lg border border-[var(--admin-border)] p-4"
      >
        <h2 className="text-sm font-semibold">New brand</h2>
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

      <section>
        <h2 className="mb-3 text-sm font-semibold">Database brands</h2>
        {brands.length === 0 ? (
          <p className="text-sm text-muted">No DB brands yet. Opsis and Aetheri remain in-repo.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/admin/brand-guidelines/${b.slug}`}
                  className="flex items-center justify-between rounded border border-[var(--admin-border)] px-3 py-2 text-sm hover:bg-[var(--admin-surface)]"
                >
                  <span>
                    <span className="font-medium">{b.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{b.slug}</span>
                  </span>
                  <span className="text-xs text-muted">
                    {b.published ? "Published" : "Draft"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted">
        Customer access:{" "}
        <Link href="/admin/brand-portal" className="underline">
          Brand access
        </Link>
      </p>
    </div>
  );
}
