"use client";

import { useEffect, useRef, useState } from "react";

export function FlipClockDigits({
  value,
  pad = 2,
  className = "",
  period,
}: {
  value: number;
  pad?: number;
  className?: string;
  period?: "AM" | "PM";
}) {
  const text = String(value).padStart(pad, "0");
  const prev = useRef(text);
  const [animFrom, setAnimFrom] = useState<string | null>(null);

  useEffect(() => {
    if (text === prev.current) return;
    const from = prev.current;
    prev.current = text;
    setAnimFrom(from);
    const t = window.setTimeout(() => setAnimFrom(null), 280);
    return () => window.clearTimeout(t);
  }, [text]);

  return (
    <div className={`sw-flip-unit ${className}`.trim()}>
      <Card period={period} text={text} animFrom={animFrom} />
    </div>
  );
}

function Card({
  text,
  period,
  animFrom,
}: {
  text: string;
  period?: "AM" | "PM";
  animFrom: string | null;
}) {
  return (
    <div className={`sw-flip-card ${period ? "sw-flip-card--period" : ""}`}>
      <span className="sr-only">{text}</span>
      <div className="sw-flip-top">
        <span className="sw-flip-digit" aria-hidden>
          {text}
        </span>
        {animFrom ? (
          <div className="sw-flip-leaf" aria-hidden>
            <span className="sw-flip-digit">{animFrom}</span>
          </div>
        ) : null}
      </div>
      <div className="sw-flip-divider" aria-hidden />
      <div className="sw-flip-bottom">
        <span className="sw-flip-digit" aria-hidden>
          {text}
        </span>
        {period ? <span className="sw-flip-period">{period}</span> : null}
      </div>
    </div>
  );
}

export function FlipStepChevron({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      className="sw-flip-step-icon"
      viewBox="0 0 12 8"
      width="12"
      height="8"
      aria-hidden
    >
      {direction === "up" ? (
        <path fill="currentColor" d="M6 0 12 8H0z" />
      ) : (
        <path fill="currentColor" d="M6 8 0 0h12z" />
      )}
    </svg>
  );
}