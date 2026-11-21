"use client";

import {
  assetLinkUrl,
  canQuickViewAsset,
  contentCalendarAssetMediaUrl,
  displayAssetName,
  formatFileBytes,
  getAssetUiKind,
  isAttachmentListAsset,
  isGalleryImageAsset,
  type AssetUiKind,
} from "@/lib/content-calendar/asset-ui";
import { contentCalendarAssetDownloadUrl } from "@/lib/content-calendar/asset-download";
import { CONTENT_CALENDAR_MAX_BYTES } from "@/lib/content-calendar/media-storage";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

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
  const [preview, setPreview] = useState<StackwiseFilePickerAsset | null>(null);

  const listAssets = assets.filter((a) => isAttachmentListAsset(a));
  const galleryImages = assets.filter((a) => isGalleryImageAsset(a));
  const maxLabel = formatFileBytes(maxBytes);

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
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sw-file-input-hidden"
        tabIndex={-1}
        multiple
        disabled={disabled || uploading}
        accept="image/*,video/*,audio/*,application/pdf,.pdf"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <label
        htmlFor={disabled || uploading ? undefined : inputId}
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
        aria-disabled={disabled}
      >
        <span className="sw-file-drop-icon" aria-hidden>
          <IconUpload />
        </span>
        <p className="sw-file-drop-title">
          {uploading ? "Uploading…" : "Drag and drop or browse files"}
        </p>
        <p className="sw-file-drop-hint">Maximum {maxLabel} file size</p>
      </label>

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
                onQuickView={() => setPreview(a)}
              />
            ))}
          </ul>
        </>
      ) : null}

      {galleryImages.length > 0 ? (
        <ul className="sw-file-gallery" aria-label="Images">
          {galleryImages.map((a) => (
            <li key={a.id} className="sw-file-gallery-item">
              <button
                type="button"
                className="sw-file-gallery-remove"
                aria-label="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  void onRemove(a.id);
                }}
              >
                ×
              </button>
              <button
                type="button"
                className="sw-file-gallery-open"
                onClick={() => setPreview(a)}
                aria-label={`Preview ${a.filename}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={contentCalendarAssetMediaUrl(a, assetUrl)}
                  alt=""
                  className="sw-file-gallery-media"
                  loading="lazy"
                />
                <span className="sw-file-gallery-size">{formatFileBytes(a.byteSize)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {preview ? (
        <QuickViewModal
          asset={preview}
          assetUrl={assetUrl}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}

function QuickViewModal({
  asset,
  assetUrl,
  onClose,
}: {
  asset: StackwiseFilePickerAsset;
  assetUrl: (id: string) => string;
  onClose: () => void;
}) {
  const kind = getAssetUiKind(asset.contentType, asset.filename);
  const src = contentCalendarAssetMediaUrl(asset, assetUrl);
  const isExternalImage =
    kind === "image" && src.startsWith("http");
  const downloadHref = isExternalImage
    ? src
    : contentCalendarAssetDownloadUrl(assetUrl(asset.id));
  const title = asset.filename;
  const pdfSrc = `${src}#toolbar=0&navpanes=0&scrollbar=1`;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("sw-file-quickview-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      document.body.classList.remove("sw-file-quickview-open");
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="sw-file-quickview" role="dialog" aria-modal="true" aria-label={`Preview ${title}`}>
      <button type="button" className="sw-file-quickview-backdrop" aria-label="Close preview" onClick={onClose} />
      <div className="sw-file-quickview-panel">
        <header className="sw-file-quickview-header">
          <div className="sw-file-quickview-heading">
            <span className={`sw-file-quickview-kind sw-file-quickview-kind--${kind}`}>{kindLabel(kind)}</span>
            <span className="sw-file-quickview-title" title={title}>
              {title}
            </span>
            <span className="sw-file-quickview-meta">{formatFileBytes(asset.byteSize)}</span>
          </div>
          <div className="sw-file-quickview-header-actions">
            <a
              className="sw-file-quickview-download"
              href={downloadHref}
              download={asset.filename}
            >
              <IconDownload />
              <span>Download</span>
            </a>
            <button type="button" className="sw-file-quickview-close" onClick={onClose} aria-label="Close">
              <IconClose />
            </button>
          </div>
        </header>
        <div className={`sw-file-quickview-stage sw-file-quickview-stage--${kind}`}>
          <div className={`sw-file-quickview-canvas sw-file-quickview-canvas--${kind}`}>
            {kind === "pdf" ? (
              <iframe className="sw-file-quickview-iframe" src={pdfSrc} title={title} />
            ) : null}
            {kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="sw-file-quickview-image" src={src} alt={title} />
            ) : null}
            {kind === "video" ? (
              <video className="sw-file-quickview-video" src={src} controls playsInline preload="metadata" />
            ) : null}
            {kind === "audio" ? (
              <div className="sw-file-quickview-audio-wrap">
                <span className="sw-file-quickview-audio-icon" aria-hidden>
                  <IconMic />
                </span>
                <audio className="sw-file-quickview-audio" src={src} controls preload="metadata" />
              </div>
            ) : null}
            {kind === "file" || kind === "link" ? (
              <p className="sw-file-quickview-fallback">
                No inline preview. Use download or open from the attachment row.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AttachmentRow({
  asset,
  assetUrl,
  onRemove,
  onQuickView,
}: {
  asset: StackwiseFilePickerAsset;
  assetUrl: (id: string) => string;
  onRemove: (id: string) => void | Promise<void>;
  onQuickView: () => void;
}) {
  const kind = getAssetUiKind(asset.contentType, asset.filename);
  const name = displayAssetName(asset.filename, kind);
  const mediaSrc = contentCalendarAssetMediaUrl(asset, assetUrl);
  const href = kind === "link" ? assetLinkUrl(asset.filename) : mediaSrc;
  const fileDownloadHref =
    kind === "link" || (kind === "image" && mediaSrc.startsWith("http"))
      ? href
      : contentCalendarAssetDownloadUrl(assetUrl(asset.id));

  if (kind === "audio") {
    return (
      <li className="sw-file-row sw-file-row--audio">
        <span className="sw-file-row-icon sw-file-row-icon--chip" aria-hidden>
          <IconMic />
        </span>
        <AudioInline src={href} title={asset.filename} onOpen={onQuickView} />
        <span className="sw-file-row-actions-divider" aria-hidden />
        <button
          type="button"
          className="sw-file-row-action sw-file-row-remove"
          aria-label="Remove"
          onClick={() => void onRemove(asset.id)}
        >
          <IconClose />
        </button>
      </li>
    );
  }

  return (
    <li className={`sw-file-row sw-file-row--${kind}`}>
      <span className="sw-file-row-icon sw-file-row-icon--chip" aria-hidden>
        <RowIcon kind={kind} />
      </span>
      <div className="sw-file-row-main">
        {canQuickViewAsset(asset.contentType, asset.filename) ? (
          <button type="button" className="sw-file-row-name-btn" title={asset.filename} onClick={onQuickView}>
            {name}
          </button>
        ) : (
          <span className="sw-file-row-name" title={asset.filename}>
            {name}
          </span>
        )}
      </div>
      <span className="sw-file-row-size">
        {kind === "link" ? kindLabel(kind) : formatFileBytes(asset.byteSize)}
      </span>
      <span className="sw-file-row-actions-divider" aria-hidden />
      <div className="sw-file-row-actions">
        {kind === "link" ? (
          <a
            className="sw-file-row-action"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open link"
          >
            <IconExternal />
          </a>
        ) : (
          <a
            className="sw-file-row-action"
            href={fileDownloadHref}
            download={asset.filename}
            aria-label="Download"
          >
            <IconDownload />
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

function AudioInline({
  src,
  title,
  onOpen,
}: {
  src: string;
  title: string;
  onOpen: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  function fmt(sec: number): string {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  function seek(clientX: number) {
    const el = waveRef.current;
    const audio = audioRef.current;
    if (!el || !audio || !Number.isFinite(audio.duration)) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = x * audio.duration;
  }

  return (
    <div className="sw-file-audio">
      <button type="button" className="sw-file-audio-title" title={title} onClick={onOpen}>
        <span className="sw-file-audio-name">{title}</span>
      </button>
      <span className="sw-file-audio-time sw-file-audio-time--current">{fmt(current)}</span>
      <button
        ref={waveRef}
        type="button"
        className="sw-file-audio-wave"
        style={{ "--sw-audio-progress": `${progress}%` } as CSSProperties}
        aria-label="Seek"
        onClick={(e) => seek(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.preventDefault();
        }}
      />
      <span className="sw-file-audio-time sw-file-audio-time--total">{fmt(duration)}</span>
      <button
        type="button"
        className="sw-file-audio-play"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          if (playing) el.pause();
          else void el.play();
        }}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="sw-file-input-hidden"
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
  if (kind === "video") return <IconVideo />;
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m16 6-8.38 8.38a3 3 0 1 0 4.24 4.24L20.24 10.1a5 5 0 0 0-7.07-7.07L4.9 11.3a7 7 0 0 0 9.9 9.9l9.2-9.19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconVideo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 10.5 21 8v8l-5-2.5v-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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