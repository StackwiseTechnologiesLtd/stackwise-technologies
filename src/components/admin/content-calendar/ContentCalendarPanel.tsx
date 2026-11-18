"use client";

import { ContentCalendarPostSheet } from "@/components/admin/content-calendar/ContentCalendarPostSheet";
import {
  addDays,
  formatMonthYear,
  formatWeekRange,
  isoDateLocal,
  monthGridDays,
  rangeForMonth,
  rangeForWeek,
  startOfDay,
  weekdayHeaders,
  weekDays,
} from "@/lib/content-calendar/dates";
import {
  contentCalendarChannelLabels,
  type ContentCalendarPostDetail,
} from "@/lib/content-calendar/types";
import { useToast } from "@/components/ToastProvider";
import { ADMIN_BTN_PRIMARY, ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MutableRefObject,
} from "react";
import { useDeferredEffect } from "@/lib/use-deferred-effect";

import "./content-calendar.css";

type CalMode = "month" | "week";
type VisualMode = "studio" | "scrapbook";

const TODAY = startOfDay(new Date());
const TODAY_ISO = isoDateLocal(TODAY);
const DRAG_MIME = "application/x-stackwise-content-post";

function calendarDragId(event: DragEvent): string | null {
  const id = event.dataTransfer.getData(DRAG_MIME) || event.dataTransfer.getData("text/plain");
  return id.trim() || null;
}

function firstImageAsset(post: ContentCalendarPostDetail) {
  return post.assets.find((a) => a.contentType.startsWith("image/"));
}

function assetThumbUrl(assetId: string): string {
  return `/api/admin/content-calendar/assets/${assetId}/file`;
}

export function ContentCalendarPanel() {
  const toast = useToast();
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [mode, setMode] = useState<CalMode>("month");
  const [visual, setVisual] = useState<VisualMode>("studio");
  const [posts, setPosts] = useState<ContentCalendarPostDetail[]>([]);
  const [loading, setLoading] = useState(true);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ from: range.from, to: range.to });
      const res = await fetch(`/api/admin/content-calendar?${q}`);
      if (!res.ok) throw new Error("Could not load calendar");
      const data = (await res.json()) as { posts: ContentCalendarPostDetail[] };
      setPosts(data.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

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
    if (!types.includes(DRAG_MIME) && !types.includes("text/plain")) return;
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

  const dragCallbacks = {
    dropTargetDay,
    draggingPostId,
    setDraggingPostId,
    skipClickRef,
    onDayDragOver,
    onDayDrop,
    clearDropTarget,
    dragMime: DRAG_MIME,
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

        <div className={`content-cal-surface ${loading ? "opacity-60" : ""}`}>
          {mode === "month" ? (
            <MonthGrid
              cursor={cursor}
              postsByDay={postsByDay}
              visual={visual}
              onNew={openNew}
              onOpen={openEdit}
              drag={dragCallbacks}
            />
          ) : (
            <WeekGrid
              postsByDay={postsByDay}
              cursor={cursor}
              onNew={openNew}
              onOpen={openEdit}
              drag={dragCallbacks}
            />
          )}
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
            void load();
          }}
          onDeleted={() => {
            setEditId(null);
            void load();
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
  visual: VisualMode;
  loading: boolean;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onMode: (m: CalMode) => void;
  onVisual: (v: VisualMode) => void;
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
          {loading ? <span className="ml-2 text-xs font-normal text-muted">Loading…</span> : null}
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

type DragCallbacks = {
  dropTargetDay: string | null;
  draggingPostId: string | null;
  setDraggingPostId: (id: string | null) => void;
  skipClickRef: MutableRefObject<boolean>;
  onDayDragOver: (event: DragEvent, dayIso: string) => void;
  onDayDrop: (event: DragEvent, dayIso: string) => void;
  clearDropTarget: () => void;
  dragMime: string;
};

function MonthGrid({
  cursor,
  postsByDay,
  visual,
  onNew,
  onOpen,
  drag,
}: {
  cursor: Date;
  postsByDay: Map<string, ContentCalendarPostDetail[]>;
  visual: VisualMode;
  onNew: (iso: string) => void;
  onOpen: (id: string) => void;
  drag: DragCallbacks;
}) {
  const days = monthGridDays(cursor);
  const headers = weekdayHeaders(1);

  return (
    <>
      <div className="content-cal-h">
        {headers.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div
        className="content-cal-g"
        style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(7.5rem, 1fr))` }}
      >
        {days.map((d) => {
          const iso = isoDateLocal(d);
          const items = postsByDay.get(iso) ?? [];
          const today = iso === TODAY_ISO;
          const out = d.getMonth() !== cursor.getMonth();
          return (
            <DayCell
              key={iso}
              iso={iso}
              dayNum={d.getDate()}
              today={today}
              out={out}
              items={items}
              visual={visual}
              onNew={() => onNew(iso)}
              onOpen={onOpen}
              drag={drag}
            />
          );
        })}
      </div>
    </>
  );
}

function WeekGrid({
  cursor,
  postsByDay,
  onNew,
  onOpen,
  drag,
}: {
  cursor: Date;
  postsByDay: Map<string, ContentCalendarPostDetail[]>;
  onNew: (iso: string) => void;
  onOpen: (id: string) => void;
  drag: DragCallbacks;
}) {
  const days = weekDays(cursor);
  return (
    <div className="content-cal-week">
      {days.map((d) => {
        const iso = isoDateLocal(d);
        const items = postsByDay.get(iso) ?? [];
        const today = iso === TODAY_ISO;
        const dropActive = drag.dropTargetDay === iso;
        return (
          <div key={iso} className="content-cal-wcol">
            <div className={`content-cal-wcol-h ${today ? "today" : ""}`}>
              <span className="n">{d.getDate()}</span>
              <span className="muted text-xs">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
              <span className="flex-1" />
              <button
                type="button"
                className="content-cal-day-add"
                onClick={() => onNew(iso)}
                aria-label={`Add post on ${iso}`}
              >
                +
              </button>
            </div>
            <div
              className={`content-cal-wcol-b ${dropActive ? "drop-target" : ""}`}
              onDragOver={(e) => drag.onDayDragOver(e, iso)}
              onDragLeave={drag.clearDropTarget}
              onDrop={(e) => drag.onDayDrop(e, iso)}
            >
              {items.length === 0 ? (
                <span className="px-2 py-1 text-xs text-muted">No posts</span>
              ) : (
                items.map((p) => (
                  <PostChip
                    key={p.id}
                    post={p}
                    scrapbook={false}
                    dragging={drag.draggingPostId === p.id}
                    drag={drag}
                    onClick={() => {
                      if (drag.skipClickRef.current) {
                        drag.skipClickRef.current = false;
                        return;
                      }
                      onOpen(p.id);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayCell({
  iso,
  dayNum,
  today,
  out,
  items,
  visual,
  onNew,
  onOpen,
  drag,
}: {
  iso: string;
  dayNum: number;
  today: boolean;
  out: boolean;
  items: ContentCalendarPostDetail[];
  visual: VisualMode;
  onNew: () => void;
  onOpen: (id: string) => void;
  drag: DragCallbacks;
}) {
  const scrapbook = visual === "scrapbook";
  const dropActive = drag.dropTargetDay === iso;
  return (
    <div
      className={`content-cal-day ${out ? "out" : ""} ${today ? "today" : ""} ${dropActive ? "drop-target" : ""}`}
      onDragOver={(e) => drag.onDayDragOver(e, iso)}
      onDragLeave={drag.clearDropTarget}
      onDrop={(e) => drag.onDayDrop(e, iso)}
    >
      <span className="dn" {...(today ? { "aria-current": "date" as const } : {})}>
        {dayNum}
      </span>
      <button type="button" className="content-cal-day-add" onClick={onNew} aria-label={`Add post on ${iso}`}>
        +
      </button>
      {scrapbook && items.length > 0 ? (
        <PolaroidStack items={items} onOpen={onOpen} />
      ) : null}
      {items.slice(0, scrapbook ? 2 : 3).map((p) => (
        <PostChip
          key={p.id}
          post={p}
          scrapbook={scrapbook}
          compact={scrapbook}
          dragging={drag.draggingPostId === p.id}
          drag={drag}
          onClick={() => {
            if (drag.skipClickRef.current) {
              drag.skipClickRef.current = false;
              return;
            }
            onOpen(p.id);
          }}
        />
      ))}
      {items.length > (scrapbook ? 2 : 3) ? (
        <button type="button" className="content-cal-more" onClick={() => onOpen(items[0].id)}>
          +{items.length - (scrapbook ? 2 : 3)} more
        </button>
      ) : null}
    </div>
  );
}

function PolaroidStack({
  items,
  onOpen,
}: {
  items: ContentCalendarPostDetail[];
  onOpen: (id: string) => void;
}) {
  const withImage = items.find((p) => firstImageAsset(p));
  const asset = withImage ? firstImageAsset(withImage) : null;
  if (!asset) return null;
  return (
    <button
      type="button"
      className="content-cal-polaroid"
      onClick={() => onOpen(withImage!.id)}
      title={withImage!.title}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={assetThumbUrl(asset.id)} alt="" />
      <span className="content-cal-polaroid-cap">{withImage!.title}</span>
    </button>
  );
}

function PostChip({
  post,
  scrapbook,
  compact,
  dragging,
  drag,
  onClick,
}: {
  post: ContentCalendarPostDetail;
  scrapbook: boolean;
  compact?: boolean;
  dragging?: boolean;
  drag: DragCallbacks;
  onClick: () => void;
}) {
  const c = post.accent || channelColor(post.channel);
  const thumb = firstImageAsset(post);
  return (
    <button
      type="button"
      draggable
      className={`content-cal-chip ${post.status === "draft" ? "draft" : ""} ${scrapbook && compact ? "scrap" : ""} ${dragging ? "dragging" : ""}`}
      style={{ "--post-accent": c } as React.CSSProperties}
      onClick={onClick}
      onDragStart={(e) => {
        e.dataTransfer.setData(drag.dragMime, post.id);
        e.dataTransfer.setData("text/plain", post.id);
        e.dataTransfer.effectAllowed = "move";
        drag.setDraggingPostId(post.id);
      }}
      onDragEnd={() => {
        drag.setDraggingPostId(null);
        drag.clearDropTarget();
      }}
      title={post.title}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="content-cal-chip-thumb" src={assetThumbUrl(thumb.id)} alt="" />
      ) : null}
      <span className="trunc">
        {post.scheduledTime ? (
          <span className="content-cal-chip-time">{post.scheduledTime}</span>
        ) : null}
        {post.title}
      </span>
    </button>
  );
}