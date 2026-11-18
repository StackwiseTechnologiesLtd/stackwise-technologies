"use client";

import { ContentCalendarPostSheet } from "@/components/admin/content-calendar/ContentCalendarPostSheet";
import {
  CONTENT_CAL_DRAG_MIME,
  ContentCalendarDayItems,
} from "@/components/admin/content-calendar/ContentCalendarDayItems";
import {
  CalendarDayAddButton,
  StackwiseCalendar,
  type CalendarVisual,
} from "@/components/calendar";
import {
  fetchContentCalendarRange,
  invalidateContentCalendarCache,
  isContentCalendarCacheFresh,
  prefetchContentCalendarRange,
  readContentCalendarCache,
} from "@/lib/content-calendar/client-cache";
import {
  addDays,
  formatMonthYear,
  formatWeekRange,
  isoDateLocal,
  rangeForMonth,
  rangeForWeek,
  startOfDay,
  weekDays,
} from "@/lib/content-calendar/dates";
import {
  contentCalendarChannelLabels,
  type ContentCalendarPostDetail,
} from "@/lib/content-calendar/types";
import { useToast } from "@/components/ToastProvider";
import { ADMIN_BTN_PRIMARY, ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import { useCallback, useMemo, useRef, useState, type DragEvent } from "react";
import { useDeferredEffect } from "@/lib/use-deferred-effect";

import "./content-calendar.css";
import "@/components/calendar/stackwise-calendar.css";

type CalMode = "month" | "week";

const TODAY = startOfDay(new Date());
const TODAY_ISO = isoDateLocal(TODAY);

function calendarDragId(event: DragEvent): string | null {
  const id =
    event.dataTransfer.getData(CONTENT_CAL_DRAG_MIME) || event.dataTransfer.getData("text/plain");
  return id.trim() || null;
}

function channelColor(channel: ContentCalendarPostDetail["channel"]): string {
  switch (channel) {
    case "instagram":
      return "#e85d8a";
    case "linkedin":
      return "#3b82f6";
    case "x":
      return "#a855f7";
    case "tiktok":
      return "#f97316";
    default:
      return "#94a3b8";
  }
}

export function ContentCalendarPanel() {
  const toast = useToast();
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [mode, setMode] = useState<CalMode>("month");
  const [visual, setVisual] = useState<CalendarVisual>("studio");
  const [posts, setPosts] = useState<ContentCalendarPostDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropTargetDay, setDropTargetDay] = useState<string | null>(null);
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null);
  const skipClickRef = useRef(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState(TODAY_ISO);

  const range = useMemo(
    () => (mode === "month" ? rangeForMonth(cursor) : rangeForWeek(cursor)),
    [cursor, mode],
  );

  const postsByDay = useMemo(() => {
    const map = new Map<string, ContentCalendarPostDetail[]>();
    for (const p of posts) {
      const list = map.get(p.scheduledOn) ?? [];
      list.push(p);
      map.set(p.scheduledOn, list);
    }
    return map;
  }, [posts]);

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      const cached = readContentCalendarCache(range.from, range.to);
      const fresh = isContentCalendarCacheFresh(range.from, range.to);
      if (cached && !options?.force) {
        setPosts(cached);
        setLoading(false);
        if (fresh) return;
        setRefreshing(true);
      } else {
        setLoading(!cached);
      }
      setError(null);
      try {
        const next = await fetchContentCalendarRange(range.from, range.to, {
          force: options?.force,
        });
        setPosts(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range.from, range.to],
  );

  useDeferredEffect(() => {
    void load();
  }, [load]);

  useDeferredEffect(() => {
    const prevCursor =
      mode === "month"
        ? new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
        : addDays(cursor, -7);
    const nextCursor =
      mode === "month"
        ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
        : addDays(cursor, 7);
    const prev = mode === "month" ? rangeForMonth(prevCursor) : rangeForWeek(prevCursor);
    const next = mode === "month" ? rangeForMonth(nextCursor) : rangeForWeek(nextCursor);
    prefetchContentCalendarRange(prev.from, prev.to);
    prefetchContentCalendarRange(next.from, next.to);
  }, [cursor, mode]);

  function openNew(iso: string) {
    setEditId(null);
    setDraftDate(iso);
    setSheetOpen(true);
  }

  function openEdit(id: string) {
    setEditId(id);
    setSheetOpen(true);
  }

  function nav(step: number) {
    if (mode === "month") {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + step, 1));
    } else {
      setCursor((c) => addDays(c, step * 7));
    }
  }

  const headerLabel =
    mode === "month" ? formatMonthYear(cursor) : formatWeekRange(weekDays(cursor));

  const channelsInView = useMemo(() => {
    const set = new Set(posts.map((p) => p.channel));
    return [...set];
  }, [posts]);

  const postsById = useMemo(() => new Map(posts.map((p) => [p.id, p])), [posts]);

  const reschedulePost = useCallback(
    async (postId: string, scheduledOn: string) => {
      const post = postsById.get(postId);
      if (!post || post.scheduledOn === scheduledOn) return;

      const previous = posts;
      setPosts((list) =>
        list.map((p) => (p.id === postId ? { ...p, scheduledOn } : p)),
      );

      try {
        const res = await fetch(`/api/admin/content-calendar/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledOn }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "Move failed");
        }
        toast.toast(`Moved to ${scheduledOn}`);
      } catch (e) {
        setPosts(previous);
        toast.error(e instanceof Error ? e.message : "Could not move post");
      }
    },
    [posts, postsById, toast],
  );

  const onDayDragOver = useCallback((event: DragEvent, dayIso: string) => {
    const types = [...event.dataTransfer.types];
    if (!types.includes(CONTENT_CAL_DRAG_MIME) && !types.includes("text/plain")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetDay(dayIso);
  }, []);

  const onDayDrop = useCallback(
    (event: DragEvent, dayIso: string) => {
      event.preventDefault();
      setDropTargetDay(null);
      const postId = calendarDragId(event);
      if (!postId) return;
      skipClickRef.current = true;
      void reschedulePost(postId, dayIso);
    },
    [reschedulePost],
  );

  const clearDropTarget = useCallback(() => {
    setDropTargetDay(null);
  }, []);

  const drag = {
    dropTargetDay,
    draggingPostId,
    setDraggingPostId,
    skipClickRef,
    onDayDragOver,
    onDayDrop,
    clearDropTarget,
    dragMime: CONTENT_CAL_DRAG_MIME,
  };

  const dnd = {
    dropTargetDay,
    onDayDragOver,
    onDayDrop,
    clearDropTarget,
  };

  return (
    <div
      className={`content-cal-root ${visual === "scrapbook" ? "content-cal-scrapbook" : ""}`}
    >
      <section className="content-cal-panel">
        <CalendarToolbar
          headerLabel={headerLabel}
          mode={mode}
          visual={visual}
          loading={loading}
          onToday={() => setCursor(startOfDay(new Date()))}
          onPrev={() => nav(-1)}
          onNext={() => nav(1)}
          onMode={setMode}
          onVisual={setVisual}
          onNew={() => openNew(TODAY_ISO)}
          channels={channelsInView}
        />

        {error ? (
          <p className="border-b border-red-500/25 bg-red-500/10 px-4 py-3 text-sm sm:px-5">
            {error}
          </p>
        ) : null}

        <div
          className={`content-cal-surface ${loading && posts.length === 0 ? "opacity-60" : ""} ${refreshing ? "opacity-[0.97]" : ""}`}
        >
          <StackwiseCalendar
            cursor={cursor}
            view={mode}
            visual={visual}
            minMonthRowHeight={visual === "scrapbook" ? "12.5rem" : "7.5rem"}
            dayActions={(iso) => <CalendarDayAddButton iso={iso} onNew={openNew} />}
            renderDayBody={(ctx) => {
              const items = postsByDay.get(ctx.iso) ?? [];
              if (mode === "week" && items.length === 0) {
                return <span className="px-2 py-1 text-xs text-muted">No posts</span>;
              }
              return (
                <ContentCalendarDayItems
                  items={items}
                  visual={visual}
                  drag={drag}
                  onOpen={openEdit}
                  maxVisible={mode === "week" ? 12 : 3}
                />
              );
            }}
            dnd={dnd}
          />
        </div>
      </section>

      {sheetOpen ? (
        <ContentCalendarPostSheet
          key={editId ?? `new-${draftDate}`}
          postId={editId}
          scheduledOn={draftDate}
          onClose={() => setSheetOpen(false)}
          onSaved={(createdId) => {
            if (createdId) setEditId(createdId);
            invalidateContentCalendarCache(range.from, range.to);
            void load({ force: true });
          }}
          onDeleted={() => {
            setEditId(null);
            invalidateContentCalendarCache(range.from, range.to);
            void load({ force: true });
          }}
        />
      ) : null}
    </div>
  );
}

function CalendarToolbar({
  headerLabel,
  mode,
  visual,
  loading,
  onToday,
  onPrev,
  onNext,
  onMode,
  onVisual,
  onNew,
  channels,
}: {
  headerLabel: string;
  mode: CalMode;
  visual: CalendarVisual;
  loading: boolean;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onMode: (m: CalMode) => void;
  onVisual: (v: CalendarVisual) => void;
  onNew: () => void;
  channels: ContentCalendarPostDetail["channel"][];
}) {
  return (
    <div className="content-cal-panel-head">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ADMIN_BTN_SECONDARY} onClick={onToday}>
          Today
        </button>
        <div className="flex overflow-hidden rounded-md border border-[var(--admin-border)]">
          <button type="button" className="content-cal-nav-btn" onClick={onPrev} aria-label="Previous">
            ‹
          </button>
          <button type="button" className="content-cal-nav-btn" onClick={onNext} aria-label="Next">
            ›
          </button>
        </div>
        <p className="text-sm font-semibold tracking-tight text-foreground" aria-live="polite">
          {headerLabel}
          {loading ? (
            <span className="ml-2 text-xs font-normal text-muted">Loading…</span>
          ) : refreshing ? (
            <span className="ml-2 text-xs font-normal text-muted">Updating…</span>
          ) : null}
        </p>
        {channels.length > 0 ? (
          <div className="hidden flex-wrap items-center gap-3 text-[11px] text-muted lg:flex">
            {channels.slice(0, 5).map((ch) => (
              <span key={ch} className="inline-flex items-center gap-1.5">
                <span className="content-cal-legend-dot" style={{ background: channelColor(ch) }} />
                {contentCalendarChannelLabels[ch]}
              </span>
            ))}
          </div>
        ) : null}
        <div className="content-cal-seg flex overflow-hidden rounded-md border border-[var(--admin-border)] text-xs">
          <button
            type="button"
            className={mode === "month" ? "on" : ""}
            onClick={() => onMode("month")}
          >
            Month
          </button>
          <button
            type="button"
            className={mode === "week" ? "on" : ""}
            onClick={() => onMode("week")}
          >
            Week
          </button>
        </div>
        <div className="content-cal-seg flex overflow-hidden rounded-md border border-[var(--admin-border)] text-xs">
          <button
            type="button"
            className={visual === "studio" ? "on" : ""}
            onClick={() => onVisual("studio")}
          >
            Studio
          </button>
          <button
            type="button"
            className={visual === "scrapbook" ? "on" : ""}
            onClick={() => onVisual("scrapbook")}
          >
            Scrapbook
          </button>
        </div>
      </div>
      <span className="flex-1" />
      <button type="button" className={ADMIN_BTN_PRIMARY} onClick={onNew}>
        + New post
      </button>
    </div>
  );
}