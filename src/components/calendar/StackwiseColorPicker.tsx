"use client";

import { hexToRgb, hslToRgb, normalizeHex6, rgbToHex, rgbToHsl } from "@/lib/color/hex";
import { ADMIN_INPUT } from "@/lib/ui/admin";
import { useCallback, useId, useRef, useState, type CSSProperties } from "react";

import "./stackwise-color-picker.css";

const PRESETS = [
  "#1e293b",
  "#e85d8a",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f8fafc",
] as const;

export function StackwiseColorPicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  const hex = normalizeHex6(value);
  const [expanded, setExpanded] = useState(false);
  const rgb = hexToRgb(hex) ?? { r: 232, g: 93, b: 138 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const panelId = useId();

  const setFromHsl = useCallback(
    (h: number, s: number, l: number) => {
      const { r, g, b } = hslToRgb(h, s, l);
      onChange(rgbToHex(r, g, b));
    },
    [onChange],
  );

  return (
    <div className={`sw-color-picker ${className}`.trim()}>
      <div className="sw-color-toolbar">
        <div className="sw-color-swatches" role="listbox" aria-label="Preset colors">
          {PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              role="option"
              aria-selected={hex === c}
              className={`sw-color-swatch ${hex === c ? "selected" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => onChange(c)}
            />
          ))}
          <button
            type="button"
            className={`sw-color-swatch sw-color-swatch-custom ${expanded ? "selected" : ""}`}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((v) => !v)}
            title="Custom color"
          >
            +
          </button>
        </div>
        <span
          className="sw-color-preview-pill"
          style={{ backgroundColor: hex }}
          title={hex}
          aria-hidden
        />
      </div>

      {expanded ? (
        <div id={panelId} className="sw-color-panel">
          <SvPlane
            hue={hsl.h}
            s={hsl.s}
            l={hsl.l}
            onPick={setFromHsl}
          />
          <HueSlider hue={hsl.h} onChange={(h) => setFromHsl(h, hsl.s, hsl.l)} />
          <label className="block space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted">Hex</span>
            <input
              className={`${ADMIN_INPUT} font-mono text-xs`}
              value={hex}
              onChange={(e) => onChange(normalizeHex6(e.target.value, hex))}
              spellCheck={false}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function SvPlane({
  hue,
  s,
  l,
  onPick,
}: {
  hue: number;
  s: number;
  l: number;
  onPick: (h: number, s: number, l: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const pick = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    onPick(hue, x * 100, (1 - y) * 100);
  };

  return (
    <div
      ref={ref}
      className="sw-color-sv"
      style={{ "--sw-hue": String(hue) } as CSSProperties}
      onPointerDown={(e) => {
        e.preventDefault();
        pick(e.clientX, e.clientY);
        const move = (ev: PointerEvent) => pick(ev.clientX, ev.clientY);
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
    >
      <span
        className="sw-color-sv-handle"
        style={{
          left: `${s}%`,
          top: `${100 - l}%`,
        }}
      />
    </div>
  );
}

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  return (
    <input
      type="range"
      min={0}
      max={360}
      value={Math.round(hue)}
      className="sw-color-hue"
      aria-label="Hue"
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}