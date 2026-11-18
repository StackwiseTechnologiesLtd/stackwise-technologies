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
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import "./stackwise-calendar.css";

function defaultDraft(): { hour12: number; minutes: number; pm: boolean } {
  const now = new Date();
  const { hour12, pm } = to12Hour(now.getHours());
  return { hour12, minutes: now.getMinutes(), pm };
}

type ActiveField = "hour" | "minute";

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
  const [active, setActive] = useState<ActiveField>("hour");
  const [digitBuffer, setDigitBuffer] = useState("");
  const [draft, setDraft] = useState(() => {
    const p = parseTime24(value);
    if (p) {
      const { hour12, pm } = to12Hour(p.hours);
      return { hour12, minutes: p.minutes, pm };
    }
    return defaultDraft();
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => popRef.current?.focus());
    return () => cancelAnimationFrame(t);
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
    setDigitBuffer("");
    setActive("hour");
  }

  const commit = useCallback(
    (next: { hour12: number; minutes: number; pm: boolean }) => {
      setDraft(next);
      const hours = from12Hour(next.hour12, next.pm);
      onChange(formatTime24(hours, next.minutes));
    },
    [onChange],
  );

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

  function applyTypedHour(n: number) {
    if (n < 1 || n > 12) return false;
    commit({ ...draft, hour12: n });
    setActive("minute");
    return true;
  }

  function applyTypedMinute(n: number) {
    if (n < 0 || n > 59) return false;
    commit({ ...draft, minutes: n });
    return true;
  }

  function onDigit(ch: string) {
    const next = `${digitBuffer}${ch}`.slice(-2);
    setDigitBuffer(next);
    const n = Number(next);

    if (active === "hour") {
      if (next.length === 1 && n >= 2 && n <= 9) {
        applyTypedHour(n);
        setDigitBuffer("");
        return;
      }
      if (next.length === 2) {
        if (applyTypedHour(n)) setDigitBuffer("");
        else setDigitBuffer(ch);
      }
      return;
    }

    if (next.length === 2) {
      if (applyTypedMinute(n)) setDigitBuffer("");
      else setDigitBuffer(ch);
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (active === "hour") stepHour(1);
      else stepMinute(1);
      setDigitBuffer("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (active === "hour") stepHour(-1);
      else stepMinute(-1);
      setDigitBuffer("");
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive("hour");
      setDigitBuffer("");
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive("minute");
      setDigitBuffer("");
      return;
    }
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      onDigit(e.key);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      setOpen(false);
    }
  };

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
        <div
          ref={popRef}
          id={listId}
          className="sw-cal-time-pop"
          role="dialog"
          aria-label="Choose time"
          tabIndex={-1}
          onKeyDown={onKeyDown}
        >
          <p className="sw-cal-time-hint">
            Click hour or minute · ↑↓ to flip · 0–9 to type
          </p>
          <div className="sw-flip-clock">
            <button
              type="button"
              className={`sw-flip-select ${active === "hour" ? "sw-flip-select--active" : ""}`}
              aria-pressed={active === "hour"}
              aria-label="Hours"
              onClick={() => {
                setActive("hour");
                setDigitBuffer("");
              }}
              onWheel={(e) => {
                e.preventDefault();
                setActive("hour");
                setDigitBuffer("");
                stepHour(e.deltaY > 0 ? -1 : 1);
              }}
            >
              <FlipClockDigits value={draft.hour12} pad={2} period={period} />
            </button>
            <span className="sw-flip-colon" aria-hidden>
              :
            </span>
            <button
              type="button"
              className={`sw-flip-select ${active === "minute" ? "sw-flip-select--active" : ""}`}
              aria-pressed={active === "minute"}
              aria-label="Minutes"
              onClick={() => {
                setActive("minute");
                setDigitBuffer("");
              }}
              onWheel={(e) => {
                e.preventDefault();
                setActive("minute");
                setDigitBuffer("");
                stepMinute(e.deltaY > 0 ? -1 : 1);
              }}
            >
              <FlipClockDigits value={draft.minutes} pad={2} />
            </button>
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
              className="sw-cal-time-done"
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