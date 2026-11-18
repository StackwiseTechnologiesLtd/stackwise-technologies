"use client";

import {
  assetLinkUrl,
  displayAssetName,
  formatFileBytes,
  getAssetUiKind,
  isAttachmentListAsset,
  isGalleryImageAsset,
  type AssetUiKind,
} from "@/lib/content-calendar/asset-ui";
import { CONTENT_CALENDAR_MAX_BYTES } from "@/lib/content-calendar/media-storage";
import { useCallback, useId, useRef, useState } from "react";

import "./stackwise-file-picker.css";

export type StackwiseFilePickerAsset = {
  id: string;
  contentType: string;
  filename: string;
  byteSize: number;
};

function kindLabel(kind: AssetUiKind): string {
  if (kind === "link") return "Web";
  if (kind === "pdf") return "PDF";
  if (kind === "audio") return "Audio";
  if (kind === "image") return "Image";
  if (kind === "video") return "Video";
  return "File";
}

export function StackwiseFilePicker({
  assets,
  assetUrl,
  disabled = false,
  disabledHint,
  uploading = false,
  maxBytes = CONTENT_CALENDAR_MAX_BYTES,
  onUploadFiles,
  onAddLink,
  onRemove,
  className = "",
}: {
  assets: StackwiseFilePickerAsset[];
  assetUrl: (id: string) => string;
  disabled?: boolean;
  disabledHint?: string;
  uploading?: boolean;
  maxBytes?: number;
  onUploadFiles: (files: FileList) => void | Promise<void>;
  onAddLink: (url: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);

  const listAssets = assets.filter((a) => isAttachmentListAsset(a.contentType));
  const galleryImages = assets.filter((a) => isGalleryImageAsset(a.contentType));
  const maxLabel = formatFileBytes(maxBytes);

  const pickFiles = useCallback(() => {
    if (!disabled && !uploading) inputRef.current?.click();
  }, [disabled, uploading]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length || disabled || uploading) return;
      void onUploadFiles(files);
    },
    [disabled, onUploadFiles, uploading],
  );

  async function submitLink(e: React.FormEvent) {
    e.preventDefault();
    const url = linkDraft.trim();
    if (!url || disabled || linkBusy) return;
    setLinkBusy(true);
    try {
      await onAddLink(url);
      setLinkDraft("");
      setLinkOpen(false);
    } finally {
      setLinkBusy(false);
    }
  }

  return (
    <div className={`sw-file-picker ${className}`.trim()}>
      <div
        className={`sw-file-drop ${dragOver ? "sw-file-drop--active" : ""} ${disabled ? "sw-file-drop--disabled" : ""}`.trim()}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={pickFiles}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pickFiles();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
      >
        <span className="sw-file-drop-icon" aria-hidden>
          <IconUpload />
        </span>
        <p className="sw-file-drop-title">
          {uploading ? "Uploading…" : "Drop and drop or browse files"}
        </p>
        <p className="sw-file-drop-hint">Maximum {maxLabel} file size</p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          multiple
          disabled={disabled || uploading}
          accept="image/*,video/*,audio/*,application/pdf,.pdf"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {disabled && disabledHint ? <p className="sw-file-disabled-hint">{disabledHint}</p> : null}

      <div className="sw-file-link-row">
        <button
          type="button"
          className="sw-file-link-toggle"
          disabled={disabled || uploading}
          onClick={() => setLinkOpen((o) => !o)}
        >
          {linkOpen ? "Cancel link" : "Add website link"}
        </button>
      </div>

      {linkOpen ? (
        <form className="sw-file-link-form" onSubmit={(e) => void submitLink(e)}>
          <input
            className="sw-file-link-input"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder="https://example.com/reference"
            disabled={disabled || linkBusy}
            spellCheck={false}
          />
          <button type="submit" className="sw-file-link-add" disabled={disabled || linkBusy || !linkDraft.trim()}>
            {linkBusy ? "…" : "Add"}
          </button>
        </form>
      ) : null}

      {listAssets.length > 0 ? (
        <>
          <p className="sw-file-section-label">Attachments:</p>
          <ul className="sw-file-list">
            {listAssets.map((a) => (
              <AttachmentRow
                key={a.id}
                asset={a}
                assetUrl={assetUrl}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </>
      ) : null}

      {galleryImages.length > 0 || !disabled ? (
        <ul className="sw-file-gallery" aria-label="Images">
          {galleryImages.map((a) => (
            <li key={a.id} className="sw-file-gallery-item">
              <button
                type="button"
                className="sw-file-gallery-remove"
                aria-label="Remove"
                onClick={() => void onRemove(a.id)}
              >
                ×
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(a.id)} alt="" className="sw-file-gallery-media" loading="lazy" />
              <span className="sw-file-gallery-size">{formatFileBytes(a.byteSize)}</span>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="sw-file-gallery-add"
              disabled={disabled || uploading}
              onClick={pickFiles}
              aria-label="Add images"
            >
              +
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

function AttachmentRow({
  asset,
  assetUrl,
  onRemove,
}: {
  asset: StackwiseFilePickerAsset;
  assetUrl: (id: string) => string;
  onRemove: (id: string) => void | Promise<void>;
}) {
  const kind = getAssetUiKind(asset.contentType);
  const name = displayAssetName(asset.filename, kind);
  const href =
    kind === "link" ? assetLinkUrl(asset.filename) : assetUrl(asset.id);

  return (
    <li className={`sw-file-row sw-file-row--${kind}`}>
      <span className="sw-file-row-icon" aria-hidden>
        <RowIcon kind={kind} />
      </span>
      <div className="sw-file-row-main">
        <span className="sw-file-row-name" title={asset.filename}>
          {name}
        </span>
        <span className="sw-file-row-meta">
          {kind === "link" ? kindLabel(kind) : formatFileBytes(asset.byteSize)}
        </span>
      </div>
      <div className="sw-file-row-actions">
        {kind === "audio" ? (
          <AudioInline src={href} />
        ) : (
          <a
            className="sw-file-row-action"
            href={href}
            target={kind === "link" ? "_blank" : undefined}
            rel={kind === "link" ? "noopener noreferrer" : undefined}
            download={kind !== "link" ? asset.filename : undefined}
            aria-label={kind === "link" ? "Open link" : "Download"}
          >
            {kind === "link" ? <IconExternal /> : <IconDownload />}
          </a>
        )}
        <button
          type="button"
          className="sw-file-row-action sw-file-row-remove"
          aria-label="Remove"
          onClick={() => void onRemove(asset.id)}
        >
          <IconClose />
        </button>
      </div>
    </li>
  );
}

function AudioInline({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  function fmt(sec: number): string {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="sw-file-audio">
      <span className="sw-file-audio-time">{fmt(current)}</span>
      <span className="sw-file-audio-wave" aria-hidden />
      <span className="sw-file-audio-dur">{fmt(duration)}</span>
      <button
        type="button"
        className="sw-file-audio-play"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          if (playing) {
            el.pause();
          } else {
            void el.play();
          }
        }}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="sr-only"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
    </div>
  );
}

function RowIcon({ kind }: { kind: AssetUiKind }) {
  if (kind === "link") return <IconLink />;
  if (kind === "pdf") return <IconPaperclip />;
  if (kind === "image") return <IconImage />;
  if (kind === "audio") return <IconMic />;
  return <IconPaperclip />;
}

function IconUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 16V4m0 0l4 4m-4-4L8 8M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPaperclip() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 8.5l-9.5 9.5a5 5 0 01-7-7L15 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11 4.93"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07L13 19.07"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="M21 17l-5.5-5.5L7 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12m0 0l4-4m-4 4L8 11M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M14 3h7v7M10 14L21 3M21 14v7H3V3h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}