"use client";

import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

export function AdminUserAvatar({
  email,
  avatarUrl,
  onSignOut,
}: {
  email: string;
  avatarUrl: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        title={email}
        className="relative flex size-9 touch-manipulation items-center justify-center overflow-hidden rounded-lg ring-2 ring-[var(--admin-border)] transition-shadow hover:ring-accent/50 focus-visible:outline-none focus-visible:ring-accent"
        aria-label={`Account menu for ${email}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Image
          src={avatarUrl}
          alt=""
          width={36}
          height={36}
          className="size-9 object-cover"
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[12rem] overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] py-1 shadow-lg"
        >
          <p className="truncate border-b border-[var(--admin-border)] px-3 py-2 text-xs text-muted">
            {email}
          </p>
          <button
            type="button"
            role="menuitem"
            className="flex w-full min-h-10 items-center gap-2.5 px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <AdminNavIcon name="logout" className="size-4 shrink-0" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
