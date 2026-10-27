"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import type { BrandGuidelines } from "@/lib/branding/types";
import { BTN_PRIMARY } from "@/lib/ui/buttons";
import { useToast } from "@/components/ToastProvider";

type AssetSlot = { path: string; label: string; uploaded: boolean };

type EditorProps = {
  slug: string;
};

export function BrandGuidelinesAdminEditor({ slug }: EditorProps) {
  const toast = useToast();
  const [brand, setBrand] = useState<BrandGuidelines | null>(null);
  const [published, setPublished] = useState(false);
  const [assetSlots, setAssetSlots] = useState<AssetSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/brand-guidelines/${slug}`);
      if (!res.ok) throw new Error("Could not load brand");
      const data = (await res.json()) as {
        brand: BrandGuidelines;
        assetSlots: AssetSlot[];
      };
      setBrand(data.brand);
      setPublished(data.brand.published ?? false);
      setAssetSlots(data.assetSlots);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [slug, toast]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  async function saveConfig() {
    if (!brand) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/brand-guidelines/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published, config: brand }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }
      toast.toast("Brand guidelines saved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAsset(assetPath: string, file: File) {
    const form = new FormData();
    form.set("assetPath", assetPath);
    form.set("file", file);
    const res = await fetch(`/api/admin/brand-guidelines/${slug}/assets`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Upload failed");
    }
    toast.toast(`Uploaded ${assetPath}`);
    await load();
  }

  function patchBrand(patch: Partial<BrandGuidelines>) {
    setBrand((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }
  if (!brand) {
    return <p className="text-sm text-muted">Brand not found.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin/brand-guidelines" className="text-sm text-muted underline">
          ← All brands
        </Link>
        <Link
          href={`/branding/${slug}`}
          className="text-sm underline"
          target="_blank"
          rel="noreferrer"
        >
          Preview portal
        </Link>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published (visible to customers on picker)
        </label>
        <button
          type="button"
          className={BTN_PRIMARY}
          disabled={saving}
          onClick={() => void saveConfig()}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Identity</h2>
        <label className="flex flex-col gap-1 text-sm">
          Display name
          <input
            className="rounded border border-[var(--admin-border)] px-3 py-2"
            value={brand.name}
            onChange={(e) => patchBrand({ name: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hero title
          <input
            className="rounded border border-[var(--admin-border)] px-3 py-2"
            value={brand.heroTitle}
            onChange={(e) => patchBrand({ heroTitle: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hero subtitle
          <textarea
            className="min-h-[4rem] rounded border border-[var(--admin-border)] px-3 py-2"
            value={brand.heroSubtitle}
            onChange={(e) => patchBrand({ heroSubtitle: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Introduction body
          <textarea
            className="min-h-[8rem] rounded border border-[var(--admin-border)] px-3 py-2"
            value={brand.introduction.body}
            onChange={(e) =>
              setBrand((prev) =>
                prev
                  ? {
                      ...prev,
                      introduction: { ...prev.introduction, body: e.target.value },
                    }
                  : prev,
              )
            }
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Core colors</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {brand.colors.palette.swatches.map((swatch, index) => (
            <div
              key={swatch.name}
              className="flex flex-col gap-2 rounded border border-[var(--admin-border)] p-3 text-sm"
            >
              <span className="font-medium">{swatch.name}</span>
              <label className="flex flex-col gap-1">
                HEX
                <input
                  className="rounded border border-[var(--admin-border)] px-2 py-1 font-mono"
                  value={swatch.hex}
                  onChange={(e) => {
                    const hex = e.target.value;
                    setBrand((prev) => {
                      if (!prev) return prev;
                      const swatches = [...prev.colors.palette.swatches];
                      swatches[index] = { ...swatches[index], hex };
                      return {
                        ...prev,
                        colors: {
                          ...prev.colors,
                          palette: { ...prev.colors.palette, swatches },
                        },
                      };
                    });
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Assets</h2>
        <p className="text-sm text-muted">
          Upload files to match the Opsis portal layout. Paths are stored in Neon, not the repo.
        </p>
        <ul className="flex flex-col gap-3">
          {assetSlots.map((slot) => (
            <li
              key={slot.path}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--admin-border)] px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{slot.label}</p>
                <p className="font-mono text-xs text-muted">{slot.path}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    slot.uploaded ? "text-emerald-600" : "text-muted"
                  }
                >
                  {slot.uploaded ? "Uploaded" : "Missing"}
                </span>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void uploadAsset(slot.path, file).catch((err) =>
                      toast.error(err instanceof Error ? err.message : "Upload failed"),
                    );
                    e.target.value = "";
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Advanced config</h2>
        <p className="text-sm text-muted">
          Full portal JSON (nav, exports, tone). Edit only if you know the Opsis-shaped schema.
        </p>
        <textarea
          className="min-h-[240px] rounded border border-[var(--admin-border)] px-3 py-2 font-mono text-xs"
          value={JSON.stringify(brand, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value) as BrandGuidelines;
              setBrand(parsed);
            } catch {
              /* wait for valid JSON */
            }
          }}
        />
      </section>
    </div>
  );
}
