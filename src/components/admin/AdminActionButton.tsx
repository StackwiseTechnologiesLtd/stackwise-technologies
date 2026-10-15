"use client";

import { ADMIN_BTN_PRIMARY, ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function AdminSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

type AdminActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  busy?: boolean;
  busyLabel?: ReactNode;
};

export function AdminActionButton({
  variant = "secondary",
  busy = false,
  busyLabel,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: AdminActionButtonProps) {
  const base = variant === "primary" ? ADMIN_BTN_PRIMARY : ADMIN_BTN_SECONDARY;
  const isDisabled = disabled || busy;

  return (
    <button
      type={type}
      {...props}
      disabled={isDisabled}
      aria-busy={busy}
      className={`${base} gap-2 ${busy ? "cursor-wait opacity-90" : ""} ${className}`}
    >
      {busy ? (
        <>
          <AdminSpinner />
          <span>{busyLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
