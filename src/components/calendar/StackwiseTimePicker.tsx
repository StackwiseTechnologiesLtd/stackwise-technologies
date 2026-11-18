"use client";

import { FlipClockDigits } from "@/components/calendar/FlipClockDigits";
import {
  formatTime24,
  formatTimeLabel,
  from12Hour,
  parseTime24,
  to12Hour,
} from "@/lib/calendar/time";
import { ADMIN_INPUT } from "@/lib/ui/admin";
import { useEffect, useId, useRef, useState } from "react";

import "./stackwise-calendar.css";

function defaultDraft(): { hour12: number; minutes: number; pm: boolean } {
  const now = new Date();
  const { hour12, pm } = to12Hour(now.getHours());
  return { hour12, minutes: now.getMinutes(), pm };
}

export function StackwiseTimePicker({
  value,
  onChange,
  placeholder = "No time",
  className = "",
}: {
  value: string;
  onChange: (hhmm: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => {
    const p = parseTime24(value);
    if (p) {
      const { hour12, pm } = to12Hour(p.hours);
      return { hour12, minutes: p.minutes, pm };
    }
    return defaultDraft();
  });
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

  const label = value ? formatTimeLabel(value) : "";

  function syncDraftFromValue() {
    const p = parseTime24(value);
    if (p) {
      const { hour12, pm } = to12Hour(p.hours);
      setDraft({ hour12, minutes: p.minutes, pm });
    } else {
      setDraft(defaultDraft());
    }
  }

  function commit(next: { hour12: number; minutes: number; pm: boolean }) {
    setDraft(next);
    const hours = from12Hour(next.hour12, next.pm);
    onChange(formatTime24(hours, next.minutes));
  }

  function stepHour(delta: number) {
    let hour12 = draft.hour12 + delta;
    if (hour12 > 12) hour12 = 1;
    if (hour12 < 1) hour12 = 12;
    commit({ ...draft, hour12 });
  }

  function stepMinute(delta: number) {
    let minutes = draft.minutes + delta;
    if (minutes > 59) minutes = 0;
    if (minutes < 0) minutes = 59;
    commit({ ...draft, minutes });
  }

  const period = draft.pm ? "PM" : "AM";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`${ADMIN_INPUT} sw-cal-picker-trigger text-left`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={listId}
        onClick={() =>
          setOpen((wasOpen) => {
            if (!wasOpen) syncDraftFromValue();
            return !wasOpen;
          })
        }
      >
        <span className="sw-cal-time-icon" aria-hidden />
        <span className={value ? "text-foreground" : "text-muted"}>
          {value ? label : placeholder}
        </span>
      </button>
      {open ? (
        <div id={listId} className="sw-cal-time-pop" role="dialog" aria-label="Choose time">
          <div className="sw-flip-clock">
            <div className="sw-flip-col">
              <button
                type="button"
                className="sw-flip-step"
                aria-label="Increase hour"
                onClick={() => stepHour(1)}
              >
                ▲
              </button>
              <FlipClockDigits value={draft.hour12} pad={2} period={period} />
              <button
                type="button"
                className="sw-flip-step"
                aria-label="Decrease hour"
                onClick={() => stepHour(-1)}
              >
                ▼
              </button>
            </div>
            <span className="sw-flip-colon" aria-hidden>
              :
            </span>
            <div className="sw-flip-col">
              <button
                type="button"
                className="sw-flip-step"
                aria-label="Increase minute"
                onClick={() => stepMinute(1)}
              >
                ▲
              </button>
              <FlipClockDigits value={draft.minutes} pad={2} />
              <button
                type="button"
                className="sw-flip-step"
                aria-label="Decrease minute"
                onClick={() => stepMinute(-1)}
              >
                ▼
              </button>
            </div>
          </div>
          <div className="sw-cal-time-actions">
            <button
              type="button"
              className={`sw-cal-time-ampm ${draft.pm ? "" : "on"}`}
              onClick={() => commit({ ...draft, pm: false })}
            >
              AM
            </button>
            <button
              type="button"
              className={`sw-cal-time-ampm ${draft.pm ? "on" : ""}`}
              onClick={() => commit({ ...draft, pm: true })}
            >
              PM
            </button>
            <span className="flex-1" />
            <button
              type="button"
              className="text-xs font-medium text-muted hover:text-foreground"
              onClick={() => {
                const n = defaultDraft();
                commit(n);
              }}
            >
              Now
            </button>
            <button
              type="button"
              className="text-xs font-medium text-muted hover:text-foreground"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs font-medium text-foreground"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}