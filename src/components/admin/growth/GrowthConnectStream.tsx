"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  sessionId: string;
  viewerBase: string;
  label: string;
  onComplete: () => void;
  onError: (message: string) => void;
};

export function GrowthConnectStream({
  sessionId,
  viewerBase,
  label,
  onComplete,
  onError,
}: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Starting browser…");
  const imgRef = useRef<HTMLImageElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      if (cancelled) return;
      try {
        const stRes = await fetch(`${viewerBase}/v1/status/${sessionId}`, {
          credentials: "include",
        });
        if (stRes.ok) {
          const st = (await stRes.json()) as {
            status: string;
            lastError?: string | null;
          };
          if (st.status === "complete") {
            setStatusText("Connected.");
            onComplete();
            return;
          }
          if (st.status === "error") {
            onError(st.lastError ?? "Connection failed");
            return;
          }
          if (st.status === "login") {
            setStatusText(`Sign in to ${label} below (click the image, then type).`);
          } else if (st.status === "syncing") {
            setStatusText("Saving your session…");
          }
        }

        const frameRes = await fetch(`${viewerBase}/v1/frame/${sessionId}`, {
          credentials: "include",
        });
        if (frameRes.ok && frameRes.status !== 204) {
          const blob = await frameRes.blob();
          revokeObjectUrl();
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setImageUrl(url);
        }
      } catch {
        /* retry */
      }
      timer = setTimeout(tick, 280);
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      revokeObjectUrl();
    };
  }, [
    sessionId,
    viewerBase,
    label,
    onComplete,
    onError,
    revokeObjectUrl,
  ]);

  async function sendInput(payload: {
    type: string;
    x?: number;
    y?: number;
    key?: string;
  }) {
    await fetch(`${viewerBase}/v1/input/${sessionId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  function onImageClick(e: React.MouseEvent<HTMLImageElement>) {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const scaleX = 1100 / rect.width;
    const scaleY = 720 / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    void sendInput({ type: "click", x, y });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    void sendInput({ type: "key", key: e.key });
    e.preventDefault();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{statusText}</p>
      <div
        className="relative overflow-hidden rounded-lg border border-white/10 bg-black"
        tabIndex={0}
        role="application"
        aria-label={`${label} sign-in`}
        onKeyDown={onKeyDown}
      >
        {imageUrl ? (
          <img
            ref={imgRef}
            src={imageUrl}
            alt={`${label} login`}
            className="block w-full cursor-crosshair"
            onClick={onImageClick}
          />
        ) : (
          <div className="flex aspect-[1100/720] w-full items-center justify-center text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
              Loading browser view…
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted">
        Click the page to focus, then type your password. Use the image like a remote screen.
      </p>
    </div>
  );
}
