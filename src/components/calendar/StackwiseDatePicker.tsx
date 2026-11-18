"use client";

import { StackwiseCalendar } from "@/components/calendar/StackwiseCalendar";
import { formatMonthYear, isoDateLocal, parseIsoDay, startOfDay } from "@/lib/content-calendar/dates";
import { ADMIN_INPUT } from "@/lib/ui/admin";
import { useEffect, useId, useRef, useState } from "react";
import type { CalendarVisual } from "@/components/calendar/types";

import "./stackwise-calendar.css";

export function StackwiseDatePicker({
  value,
  onChange,
  visual = "studio",
  placeholder = "Pick a date",
  className = "",
}: {
  value: string;
  onChange: (iso: string) => void;
  visual?: CalendarVisual;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() =>
    value ? parseIsoDay(value) : startOfDay(new Date()),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const label = value
    ? parseIsoDay(value).toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`${ADMIN_INPUT} sw-cal-picker-trigger text-left`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() =>
          setOpen((wasOpen) => {
            if (!wasOpen && value) setCursor(parseIsoDay(value));
            return !wasOpen;
          })
        }
      >
        <span className={value ? "text-foreground" : "text-muted"}>
          {value ? label : placeholder}
        </span>
      </button>
      {open ? (
        <div id={listId} className="sw-cal-picker-pop">
          <div className="sw-cal-picker-head">
            <button
              type="button"
              className="sw-cal-nav-btn rounded-md border border-[var(--admin-border)]"
              aria-label="Previous month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <span className="sw-cal-picker-label">{formatMonthYear(cursor)}</span>
            <button
              type="button"
              className="sw-cal-nav-btn rounded-md border border-[var(--admin-border)]"
              aria-label="Next month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>
          <StackwiseCalendar
            cursor={cursor}
            view="month"
            visual={visual}
            selectedIso={value || null}
            minMonthRowHeight="3.25rem"
            onDayClick={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
            renderDayBody={() => null}
          />
          <div className="flex justify-between border-t border-[var(--admin-border)] px-3 py-2">
            <button
              type="button"
              className="text-xs font-medium text-muted hover:text-foreground"
              onClick={() => {
                const today = isoDateLocal(startOfDay(new Date()));
                onChange(today);
                setCursor(startOfDay(new Date()));
                setOpen(false);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="text-xs font-medium text-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}