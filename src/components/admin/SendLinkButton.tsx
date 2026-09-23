"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { BTN_SECONDARY } from "@/lib/ui/buttons";

export function SendLinkButton({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment-links/${id}/send`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      toast.success("Payment link emailed to customer.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={send}
      disabled={loading}
      className={BTN_SECONDARY}
    >
      {loading ? "Sending…" : "Email payment link"}
    </button>
  );
}
