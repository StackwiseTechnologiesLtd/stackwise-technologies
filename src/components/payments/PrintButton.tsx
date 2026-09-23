"use client";

import { BTN_SECONDARY } from "@/lib/ui/buttons";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`text-sm ${BTN_SECONDARY}`}
    >
      Print
    </button>
  );
}
