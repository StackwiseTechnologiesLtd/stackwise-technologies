"use client";

import {
  isoDateLocal,
  monthGridDays,
  startOfDay,
  weekdayHeaders,
  weekDays,
} from "@/lib/content-calendar/dates";
import type { CalendarDayContext, CalendarView, CalendarVisual } from "@/components/calendar/types";
import type { DragEvent, ReactNode } from "react";

import "./stackwise-calendar.css";

const TODAY_ISO = isoDateLocal(startOfDay(new Date()));

export type StackwiseCalendarDnD = {
  dropTargetDay: string | null;
  onDayDragOver: (event: DragEvent, dayIso: string) => void;
  onDayDrop: (event: DragEvent, dayIso: string) => void;
  clearDropTarget: () => void;
};

export function StackwiseCalendar({
  cursor,
  view = "month",
  visual = "studio",
  selectedIso,
  minMonthRowHeight = "7.5rem",
  onDayClick,
  dayActions,
  renderDayBody,
  dnd,
  className = "",
}: {
  cursor: Date;
  view?: CalendarView;
  visual?: CalendarVisual;
  selectedIso?: string | null;
  minMonthRowHeight?: string;
  onDayClick?: (iso: string) => void;
  dayActions?: (iso: string) => ReactNode;
  renderDayBody: (ctx: CalendarDayContext) => ReactNode;
  dnd?: StackwiseCalendarDnD;
  className?: string;
}) {
  const rootClass = `sw-cal sw-cal--${visual} ${className}`.trim();

  if (view === "week") {
    return (
      <div className={rootClass}>
        <WeekColumns
          cursor={cursor}
          onDayClick={onDayClick}
          dayActions={dayActions}
          renderDayBody={renderDayBody}
          dnd={dnd}
        />
      </div>
    );
  }

  const days = monthGridDays(cursor);
  const headers = weekdayHeaders(1);

  return (
    <div className={rootClass}>
      <div className="sw-cal-h">
        {headers.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div
        className="sw-cal-g"
        style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(${minMonthRowHeight}, 1fr))` }}
      >
        {days.map((d) => {
          const iso = isoDateLocal(d);
          const ctx: CalendarDayContext = {
            iso,
            dayNum: d.getDate(),
            today: iso === TODAY_ISO,
            outOfMonth: d.getMonth() !== cursor.getMonth(),
            dropActive: dnd?.dropTargetDay === iso,
          };
          return (
            <CalendarDayCell
              key={iso}
              ctx={ctx}
              selected={selectedIso === iso}
              onDayClick={onDayClick}
              dayActions={dayActions}
              renderDayBody={renderDayBody}
              dnd={dnd}
            />
          );
        })}
      </div>
    </div>
  );
}

function CalendarDayCell({
  ctx,
  selected,
  onDayClick,
  dayActions,
  renderDayBody,
  dnd,
}: {
  ctx: CalendarDayContext;
  selected?: boolean;
  onDayClick?: (iso: string) => void;
  dayActions?: (iso: string) => ReactNode;
  renderDayBody: (ctx: CalendarDayContext) => ReactNode;
  dnd?: StackwiseCalendarDnD;
}) {
  const interactive = Boolean(onDayClick);
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`sw-cal-day ${ctx.outOfMonth ? "out" : ""} ${ctx.today ? "today" : ""} ${ctx.dropActive ? "drop-target" : ""} ${selected ? "selected" : ""}`}
      onClick={interactive ? () => onDayClick?.(ctx.iso) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDayClick?.(ctx.iso);
              }
            }
          : undefined
      }
      onDragOver={dnd ? (e) => dnd.onDayDragOver(e, ctx.iso) : undefined}
      onDragLeave={dnd ? dnd.clearDropTarget : undefined}
      onDrop={dnd ? (e) => dnd.onDayDrop(e, ctx.iso) : undefined}
    >
      <span className="dn" {...(ctx.today ? { "aria-current": "date" as const } : {})}>
        {ctx.dayNum}
      </span>
      {dayActions ? dayActions(ctx.iso) : null}
      <div className="sw-cal-day-body">{renderDayBody(ctx)}</div>
    </div>
  );
}

function WeekColumns({
  cursor,
  onDayClick,
  dayActions,
  renderDayBody,
  dnd,
}: {
  cursor: Date;
  onDayClick?: (iso: string) => void;
  dayActions?: (iso: string) => ReactNode;
  renderDayBody: (ctx: CalendarDayContext) => ReactNode;
  dnd?: StackwiseCalendarDnD;
}) {
  const days = weekDays(cursor);
  return (
    <div className="sw-cal-week">
      {days.map((d) => {
        const iso = isoDateLocal(d);
        const ctx: CalendarDayContext = {
          iso,
          dayNum: d.getDate(),
          today: iso === TODAY_ISO,
          outOfMonth: false,
          dropActive: dnd?.dropTargetDay === iso,
        };
        const dropActive = dnd?.dropTargetDay === iso;
        return (
          <div key={iso} className="sw-cal-wcol">
            <div className={`sw-cal-wcol-h ${ctx.today ? "today" : ""}`}>
              <span className="n">{d.getDate()}</span>
              <span className="muted text-xs">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
              <span className="flex-1" />
              {dayActions?.(iso)}
            </div>
            <div
              className={`sw-cal-wcol-b ${dropActive ? "drop-target" : ""}`}
              onDragOver={dnd ? (e) => dnd.onDayDragOver(e, ctx.iso) : undefined}
              onDragLeave={dnd ? dnd.clearDropTarget : undefined}
              onDrop={dnd ? (e) => dnd.onDayDrop(e, ctx.iso) : undefined}
              onClick={onDayClick ? () => onDayClick(iso) : undefined}
              role={onDayClick ? "button" : undefined}
            >
              {renderDayBody(ctx)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CalendarDayAddButton({
  iso,
  onNew,
}: {
  iso: string;
  onNew: (iso: string) => void;
}) {
  return (
    <button
      type="button"
      className="sw-cal-day-add"
      onClick={(e) => {
        e.stopPropagation();
        onNew(iso);
      }}
      aria-label={`Add on ${iso}`}
    >
      +
    </button>
  );
}