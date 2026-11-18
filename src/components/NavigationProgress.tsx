"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function routeKey(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeRef = useRef(routeKey(pathname, search));
  const firstPaint = useRef(true);

  useEffect(() => {
    const stopTrickle = () => {
      if (trickleRef.current) {
        clearInterval(trickleRef.current);
        trickleRef.current = null;
      }
    };

    const start = () => {
      if (hideRef.current) {
        clearTimeout(hideRef.current);
        hideRef.current = null;
      }
      stopTrickle();
      setActive(true);
      setProgress(14);
      trickleRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 88) return p;
          return p + Math.max(1, Math.random() * 6);
        });
      }, 350);
    };

    const finish = () => {
      stopTrickle();
      setProgress(100);
      hideRef.current = setTimeout(() => {
        setActive(false);
        setProgress(0);
        hideRef.current = null;
      }, 320);
    };

    const key = routeKey(pathname, search);
    if (firstPaint.current) {
      firstPaint.current = false;
      routeRef.current = key;
    } else if (key !== routeRef.current) {
      routeRef.current = key;
      finish();
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (anchor.hasAttribute("download")) return;
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const next = routeKey(url.pathname, url.search.replace(/^\?/, ""));
      const current = routeKey(pathname, search);
      if (next === current) return;
      start();
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      stopTrickle();
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, [pathname, search]);

  const visible = active || progress > 0;

  return (
    <div className="navigation-progress" aria-hidden data-active={active ? "true" : undefined}>
      <div
        className="navigation-progress-bar"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}