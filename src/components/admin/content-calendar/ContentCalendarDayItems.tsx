"use client";

import type { CalendarVisual } from "@/components/calendar/types";
import type { ContentCalendarPostDetail } from "@/lib/content-calendar/types";
import type { CSSProperties, DragEvent, MutableRefObject } from "react";

export const CONTENT_CAL_DRAG_MIME = "application/x-stackwise-content-post";

export type ContentCalendarPlacement = "work" | "due";

export type ContentCalendarDayEntry = {
  post: ContentCalendarPostDetail;
  placement: ContentCalendarPlacement;
};

export type ContentCalendarDragCallbacks = {
  dropTargetDay: string | null;
  draggingPostId: string | null;
  setDraggingPostId: (id: string | null) => void;
  skipClickRef: MutableRefObject<boolean>;
  onDayDragOver: (event: DragEvent, dayIso: string) => void;
  onDayDrop: (event: DragEvent, dayIso: string) => void;
  clearDropTarget: () => void;
  dragMime: string;
};

function tiltFromId(id: string, span = 7): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h + id.charCodeAt(i) * 17) % 100;
  return `${(h % span) - Math.floor(span / 2)}deg`;
}

function firstImageAsset(post: ContentCalendarPostDetail) {
  return post.assets.find((a) => a.contentType.startsWith("image/"));
}

function assetThumbUrl(assetId: string): string {
  return `/api/admin/content-calendar/assets/${assetId}/file`;
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

export function ContentCalendarDayItems({
  items,
  visual,
  drag,
  onOpen,
  onExpand,
  maxVisible = 3,
}: {
  items: ContentCalendarDayEntry[];
  visual: CalendarVisual;
  drag: ContentCalendarDragCallbacks;
  onOpen: (id: string) => void;
  /** Opens scrapbook day modal instead of jumping to the first post. */
  onExpand?: () => void;
  maxVisible?: number;
}) {
  if (items.length === 0) return null;

  const scrapbook = visual === "scrapbook";
  const scrapbookCap = 4;
  const visibleLimit = scrapbook
    ? Math.min(items.length, Math.max(maxVisible, scrapbookCap))
    : Math.min(items.length, maxVisible);
  const visible = items.slice(0, visibleLimit);

  return (
    <>
      {visible.map((entry) =>
        scrapbook ? (
          <ScrapbookPostCard
            key={`${entry.post.id}-${entry.placement}`}
            post={entry.post}
            placement={entry.placement}
            drag={drag}
            onOpen={() => {
              if (drag.skipClickRef.current) {
                drag.skipClickRef.current = false;
                return;
              }
              onOpen(entry.post.id);
            }}
          />
        ) : (
          <StudioPostChip
            key={`${entry.post.id}-${entry.placement}`}
            post={entry.post}
            placement={entry.placement}
            drag={drag}
            onOpen={() => {
              if (drag.skipClickRef.current) {
                drag.skipClickRef.current = false;
                return;
              }
              onOpen(entry.post.id);
            }}
          />
        ),
      )}
      {items.length > visible.length ? (
        <button
          type="button"
          className="text-left text-[10px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => (onExpand ? onExpand() : onOpen(items[0].post.id))}
        >
          +{items.length - visible.length} more
        </button>
      ) : null}
    </>
  );
}

function placementClass(placement: ContentCalendarPlacement): string {
  return placement === "due" ? "sw-cal-placement--due" : "sw-cal-placement--work";
}

function ScrapbookPostCard({
  post,
  placement,
  drag,
  onOpen,
}: {
  post: ContentCalendarPostDetail;
  placement: ContentCalendarPlacement;
  drag: ContentCalendarDragCallbacks;
  onOpen: () => void;
}) {
  const thumb = firstImageAsset(post);
  const accent = post.accent || channelColor(post.channel);
  const dragging = drag.draggingPostId === post.id;

  if (thumb) {
    return (
      <button
        type="button"
        draggable={placement === "due"}
        className={`sw-cal-polaroid ${placementClass(placement)} ${dragging ? "dragging" : ""}`}
        style={
          {
            "--polaroid-tilt": tiltFromId(post.id),
            opacity: dragging ? 0.45 : 1,
          } as CSSProperties
        }
        onClick={onOpen}
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetThumbUrl(thumb.id)} alt="" loading="lazy" decoding="async" />
        <span className="sw-cal-polaroid-cap">{post.title.replace(/^\[sample\]\s*/, "")}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      draggable={placement === "due"}
      className={`sw-cal-scrap-note ${placementClass(placement)} ${dragging ? "opacity-45" : ""}`}
      style={
        {
          "--post-accent": accent,
          "--note-tilt": tiltFromId(post.id, 5),
        } as CSSProperties
      }
      onClick={onOpen}
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
    >
      {post.scheduledTime ? (
        <span className="sw-cal-scrap-note-time">{post.scheduledTime}</span>
      ) : null}
      {post.title.replace(/^\[sample\]\s*/, "")}
    </button>
  );
}

function StudioPostChip({
  post,
  placement,
  drag,
  onOpen,
}: {
  post: ContentCalendarPostDetail;
  placement: ContentCalendarPlacement;
  drag: ContentCalendarDragCallbacks;
  onOpen: () => void;
}) {
  const c = post.accent || channelColor(post.channel);
  const thumb = firstImageAsset(post);
  const dragging = drag.draggingPostId === post.id;

  return (
    <button
      type="button"
      draggable={placement === "due"}
      className={`sw-cal-chip ${placementClass(placement)} ${post.status === "draft" && placement === "work" ? "draft" : ""} ${dragging ? "dragging" : ""}`}
      style={{ "--post-accent": c } as CSSProperties}
      onClick={onOpen}
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
        <img
          className="sw-cal-chip-thumb"
          src={assetThumbUrl(thumb.id)}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span className="min-w-0 flex-1 truncate">
        {post.scheduledTime ? (
          <span className="mr-1 tabular-nums opacity-75">{post.scheduledTime}</span>
        ) : null}
        {post.title}
      </span>
    </button>
  );
}