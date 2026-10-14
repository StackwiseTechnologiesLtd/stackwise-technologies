"use client";

import Image from "next/image";

export function AdminUserAvatar({
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl: string;
}) {
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        title={email}
        className="relative flex size-9 touch-manipulation items-center justify-center overflow-hidden rounded-lg ring-2 ring-[var(--admin-border)] transition-shadow hover:ring-accent/50 focus-visible:outline-none focus-visible:ring-accent"
        aria-label={`Signed in as ${email}`}
      >
        <Image
          src={avatarUrl}
          alt=""
          width={36}
          height={36}
          className="size-9 object-cover"
        />
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-50 hidden max-w-[min(20rem,calc(100vw-2rem))] truncate rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-xs text-foreground shadow-lg group-hover:block group-focus-within:block"
      >
        {email}
      </div>
    </div>
  );
}
