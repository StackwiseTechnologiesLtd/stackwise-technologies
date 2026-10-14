import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-6 space-y-4 border-b border-[var(--admin-border)] pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <div className="max-w-3xl text-sm leading-relaxed text-muted">
              {description}
            </div>
          ) : null}
          {meta}
        </div>
        {actions ? (
          <div
            className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[10rem] sm:flex-row sm:flex-wrap sm:justify-end [&_a]:w-full [&_button]:w-full sm:[&_a]:w-auto sm:[&_button]:w-auto"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
