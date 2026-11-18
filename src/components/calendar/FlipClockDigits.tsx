"use client";

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

  return (
    <div className={`sw-flip-unit ${className}`.trim()}>
      <div className="sw-flip-card" key={text}>
        <div className="sw-flip-face sw-flip-top">
          <span>{text}</span>
        </div>
        <div className="sw-flip-divider" aria-hidden />
        <div className="sw-flip-face sw-flip-bottom">
          <span>{text}</span>
        </div>
        {period ? <span className="sw-flip-period">{period}</span> : null}
      </div>
    </div>
  );
}