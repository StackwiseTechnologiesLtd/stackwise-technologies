"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ADMIN_BTN_GHOST } from "@/lib/ui/admin";
import { useEffect, type ReactNode } from "react";

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  busy,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close"
        disabled={busy}
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="relative w-full max-w-md rounded-t-2xl border border-line bg-panel p-5 shadow-2xl sm:rounded-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <h2 id="admin-confirm-title" className="text-base font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-3 text-sm text-muted">{children}</div> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={ADMIN_BTN_GHOST}
            disabled={busy}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <AdminActionButton
            variant="primary"
            busy={busy}
            className={
              destructive ? "border-red-600 bg-red-600 hover:bg-red-500" : ""
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </AdminActionButton>
        </div>
      </div>
    </div>
  );
}