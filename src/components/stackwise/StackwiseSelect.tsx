"use client";

import { DropdownChevron } from "@/components/stackwise/DropdownChevron";
import { useDismissable } from "@/components/stackwise/use-dismissable";
import { useId, useMemo, useRef, useState } from "react";

import "./stackwise-dropdown.css";

export type StackwiseSelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export function StackwiseSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchable = false,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
  leading,
}: {
  value: T | "";
  onChange: (v: T) => void;
  options: StackwiseSelectOption<T>[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  /** e.g. country flag slot in trigger (reference phone field) */
  leading?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useDismissable(open, () => setOpen(false), rootRef);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  return (
    <div
      ref={rootRef}
      className={`sw-dd-root ${open ? "sw-dd-root--open" : ""} ${className}`.trim()}
    >
      <button
        type="button"
        className="sw-dd-trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        {leading ?? (selected?.icon ? <span className="sw-dd-option-icon">{selected.icon}</span> : null)}
        <span
          className={`sw-dd-trigger-label ${selected ? "" : "sw-dd-trigger-placeholder"}`.trim()}
        >
          {selected ? selected.label : placeholder}
        </span>
        {selected?.description ? (
          <span className="sw-dd-option-desc">{selected.description}</span>
        ) : null}
        <span className="sw-dd-chevron-wrap">
          <DropdownChevron open={open} />
        </span>
      </button>
      {open ? (
        <div className="sw-dd-panel" role="presentation">
          {searchable ? (
            <div className="sw-dd-search">
              <span aria-hidden>⌕</span>
              <input
                className="sw-dd-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                autoFocus
              />
            </div>
          ) : null}
          <ul id={listId} className="sw-dd-list" role="listbox" aria-label={ariaLabel ?? "Options"}>
            {filtered.map((o) => (
              <li key={o.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  disabled={o.disabled}
                  className={`sw-dd-option ${o.value === value ? "sw-dd-option--selected" : ""}`.trim()}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {o.icon ? <span className="sw-dd-option-icon">{o.icon}</span> : null}
                  <span className="sw-dd-option-body">
                    <span className="sw-dd-option-title">{o.label}</span>
                    {o.description ? (
                      <span className="sw-dd-option-desc">{o.description}</span>
                    ) : null}
                  </span>
                  <span className="sw-dd-option-check" aria-hidden>
                    ✓
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}