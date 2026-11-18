"use client";

import {
  isoDateLocal,
  monthGridDays,
  startOfDay,
  weekdayHeaders,
} from "@/lib/content-calendar/dates";

import "./stackwise-calendar.css";

const TODAY_ISO = isoDateLocal(startOfDay(new Date()));

export function StackwisePickerMonth({
  cursor,
  selectedIso,
  onSelect,
}: {
  cursor: Date;
  selectedIso: string | null;
  onSelect: (iso: string) => void;
}) {
  const days = monthGridDays(cursor);
  const headers = weekdayHeaders(1);
  const inMonth = cursor.getMonth();

  return (
    <div className="sw-cal-picker-month">
      <div className="sw-cal-picker-weekdays" aria-hidden>
        {headers.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="sw-cal-picker-days" role="grid" aria-label="Pick a date">
        {days.map((d) => {
          const iso = isoDateLocal(d);
          const out = d.getMonth() !== inMonth;
          const today = iso === TODAY_ISO;
          const selected = selectedIso === iso;
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              className={`sw-cal-picker-day ${out ? "out" : ""} ${today ? "today" : ""} ${selected ? "selected" : ""}`}
              onClick={() => onSelect(iso)}
              aria-label={d.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}