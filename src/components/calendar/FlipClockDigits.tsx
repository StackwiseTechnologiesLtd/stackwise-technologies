"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const TOP_FLIP_MS = 360;
const BOTTOM_FLIP_MS = 360;

type FlipPhase = "idle" | "top-out" | "bottom-in";

type DisplayState = {
  shown: string;
  phase: FlipPhase;
  from: string;
  to: string;
};

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function idleState(value: string): DisplayState {
  return { shown: value, phase: "idle", from: value, to: value };
}

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
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  const [display, setDisplay] = useState<DisplayState>(() => idleState(text));
  const machine = useRef({ shown: text, busy: false, target: text });
  const timers = useRef<number[]>([]);

  useEffect(() => {
    machine.current.target = text;

    const clearTimers = () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };

    if (reduceMotion) {
      clearTimers();
      machine.current = { shown: text, busy: false, target: text };
      return;
    }

    const finishOrChain = (latest: string) => {
      machine.current.shown = latest;
      machine.current.busy = false;
      const pending = machine.current.target;
      if (pending !== latest) {
        startFlip(latest, pending);
      } else {
        setDisplay(idleState(latest));
      }
    };

    const startFlip = (from: string, to: string) => {
      if (from === to) {
        setDisplay(idleState(to));
        machine.current.shown = to;
        machine.current.busy = false;
        return;
      }
      clearTimers();
      machine.current.busy = true;
      setDisplay({ shown: from, phase: "top-out", from, to });

      const t1 = window.setTimeout(() => {
        machine.current.shown = to;
        setDisplay((prev) => ({ ...prev, shown: to, phase: "bottom-in" }));
      }, TOP_FLIP_MS);
      timers.current.push(t1);

      const t2 = window.setTimeout(() => finishOrChain(to), TOP_FLIP_MS + BOTTOM_FLIP_MS);
      timers.current.push(t2);
    };

    if (text === machine.current.shown && !machine.current.busy) {
      return clearTimers;
    }

    if (machine.current.busy) {
      return clearTimers;
    }

    const frame = requestAnimationFrame(() => startFlip(machine.current.shown, text));

    return () => {
      cancelAnimationFrame(frame);
      clearTimers();
    };
  }, [text, reduceMotion]);

  const { shown, phase, from, to } = reduceMotion ? idleState(text) : display;
  const topDigit = phase === "idle" ? shown : to;
  const bottomDigit = phase === "idle" ? shown : from;

  return (
    <div className={`sw-flip-unit ${className}`.trim()}>
      <div
        className={`sw-flip-card ${period ? "sw-flip-card--period" : ""} ${phase !== "idle" ? "sw-flip-card--animating" : ""}`}
      >
        <span className="sr-only">{text}</span>

        <div className="sw-flip-static sw-flip-static-top">
          <span className="sw-flip-digit" aria-hidden>
            {topDigit}
          </span>
        </div>

        <div className="sw-flip-static sw-flip-static-bottom">
          <span className="sw-flip-digit" aria-hidden>
            {bottomDigit}
          </span>
          {period ? <span className="sw-flip-period">{period}</span> : null}
        </div>

        {phase === "top-out" ? (
          <div className="sw-flip-leaf-top" aria-hidden>
            <span className="sw-flip-digit">{from}</span>
          </div>
        ) : null}

        {phase === "bottom-in" ? (
          <div className="sw-flip-leaf-bottom" aria-hidden>
            <span className="sw-flip-digit">{to}</span>
          </div>
        ) : null}

        <div className="sw-flip-divider" aria-hidden />
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