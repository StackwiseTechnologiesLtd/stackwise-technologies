"use client";

import {
  ContentCalendarDayItems,
  type ContentCalendarDayEntry,
  type ContentCalendarDragCallbacks,
} from "@/components/admin/content-calendar/ContentCalendarDayItems";
import { formatCalendarDayTitle } from "@/lib/content-calendar/dates";
import { ADMIN_BTN_GHOST, ADMIN_BTN_PRIMARY } from "@/lib/ui/admin";
import { useEffect } from "react";

export function ContentCalendarDayExpandModal({
  dayIso,
  items,
  drag,
  onClose,
  onOpenPost,
  onNewPost,
}: {
  dayIso: string;
  items: ContentCalendarDayEntry[];
  drag: ContentCalendarDragCallbacks;
  onClose: () => void;
  onOpenPost: (id: string) => void;
  onNewPost: (iso: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close day view"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-cal-day-expand-title"
        className="content-cal-day-expand content-cal-scrapbook relative flex max-h-[min(88vh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl sm:max-w-2xl sm:rounded-2xl"
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
      >
        <header className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-canvas)] px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2
              id="content-cal-day-expand-title"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              {formatCalendarDayTitle(dayIso)}
            </h2>
            <p className="text-xs text-muted">
              {items.length} post{items.length === 1 ? "" : "s"} · scrapbook view
            </p>
          </div>
          <button type="button" className={ADMIN_BTN_GHOST} onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className={ADMIN_BTN_PRIMARY}
            onClick={() => {
              onNewPost(dayIso);
              onClose();
            }}
          >
            + New
          </button>
        </header>
        <div className="content-cal-day-expand-scroll min-h-0 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-sm text-muted">No posts on this day.</p>
          ) : (
            <div className="content-cal-day-expand-grid p-4 sm:p-5">
              <ContentCalendarDayItems
                items={items}
                visual="scrapbook"
                drag={drag}
                onOpen={(id) => {
                  onOpenPost(id);
                  onClose();
                }}
                maxVisible={items.length}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}