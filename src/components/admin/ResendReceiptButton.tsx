"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { BTN_SECONDARY } from "@/lib/ui/buttons";

export function ResendReceiptButton({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment-links/${id}/resend-receipt`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send receipt");
      toast.success("Receipt emailed to customer.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send receipt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={resend}
      disabled={loading}
      className={`text-sm ${BTN_SECONDARY}`}
    >
      {loading ? "Sending…" : "Email receipt"}
    </button>
  );
}
