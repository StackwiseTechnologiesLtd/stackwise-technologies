"use client";

import type { CalendarVisual } from "@/components/calendar/types";
import type { ContentCalendarPostDetail } from "@/lib/content-calendar/types";
import type { CSSProperties, DragEvent, MutableRefObject } from "react";

export const CONTENT_CAL_DRAG_MIME = "application/x-stackwise-content-post";

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
  maxVisible = 3,
}: {
  items: ContentCalendarPostDetail[];
  visual: CalendarVisual;
  drag: ContentCalendarDragCallbacks;
  onOpen: (id: string) => void;
  maxVisible?: number;
}) {
  if (items.length === 0) return null;

  const scrapbook = visual === "scrapbook";
  const scrapbookCap = 4;
  const visible = items.slice(0, scrapbook ? scrapbookCap : maxVisible);

  return (
    <>
      {visible.map((post) =>
        scrapbook ? (
          <ScrapbookPostCard
            key={post.id}
            post={post}
            drag={drag}
            onOpen={() => {
              if (drag.skipClickRef.current) {
                drag.skipClickRef.current = false;
                return;
              }
              onOpen(post.id);
            }}
          />
        ) : (
          <StudioPostChip
            key={post.id}
            post={post}
            drag={drag}
            onOpen={() => {
              if (drag.skipClickRef.current) {
                drag.skipClickRef.current = false;
                return;
              }
              onOpen(post.id);
            }}
          />
        ),
      )}
      {items.length > visible.length ? (
        <button
          type="button"
          className="text-left text-[10px] text-muted hover:text-foreground"
          onClick={() => onOpen(items[0].id)}
        >
          +{items.length - visible.length} more
        </button>
      ) : null}
    </>
  );
}

function ScrapbookPostCard({
  post,
  drag,
  onOpen,
}: {
  post: ContentCalendarPostDetail;
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
        draggable
        className={`sw-cal-polaroid ${dragging ? "dragging" : ""}`}
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
        <img src={assetThumbUrl(thumb.id)} alt="" />
        <span className="sw-cal-polaroid-cap">{post.title.replace(/^\[sample\]\s*/, "")}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      draggable
      className={`sw-cal-scrap-note ${dragging ? "opacity-45" : ""}`}
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
  drag,
  onOpen,
}: {
  post: ContentCalendarPostDetail;
  drag: ContentCalendarDragCallbacks;
  onOpen: () => void;
}) {
  const c = post.accent || channelColor(post.channel);
  const thumb = firstImageAsset(post);
  const dragging = drag.draggingPostId === post.id;

  return (
    <button
      type="button"
      draggable
      className={`sw-cal-chip ${post.status === "draft" ? "draft" : ""} ${dragging ? "dragging" : ""}`}
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
        <img className="sw-cal-chip-thumb" src={assetThumbUrl(thumb.id)} alt="" />
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