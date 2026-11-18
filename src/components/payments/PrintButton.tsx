"use client";

import { ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import { BTN_SECONDARY } from "@/lib/ui/buttons";

export function PrintButton({ admin = false }: { admin?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`text-sm ${admin ? ADMIN_BTN_SECONDARY : BTN_SECONDARY}`}
    >
      Print
    </button>
  );
}