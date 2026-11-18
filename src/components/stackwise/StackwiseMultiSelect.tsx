"use client";

import { DropdownChevron } from "@/components/stackwise/DropdownChevron";
import { useDismissable } from "@/components/stackwise/use-dismissable";
import { useId, useMemo, useRef, useState } from "react";

import "./stackwise-dropdown.css";

export type StackwiseMultiSelectOption = {
  value: string;
  label: string;
  sublabel?: string;
  avatar?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
};

export function StackwiseMultiSelect({
  values,
  onChange,
  options,
  placeholder = "Select members…",
  maxVisibleTags = 2,
  searchable = true,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: StackwiseMultiSelectOption[];
  placeholder?: string;
  maxVisibleTags?: number;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useDismissable(open, () => setOpen(false), rootRef);

  const optionMap = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  const selectedOpts = values.map((v) => optionMap.get(v)).filter(Boolean) as StackwiseMultiSelectOption[];
  const visible = selectedOpts.slice(0, maxVisibleTags);
  const overflow = selectedOpts.length - visible.length;

  function toggle(id: string) {
    if (values.includes(id)) onChange(values.filter((v) => v !== id));
    else onChange([...values, id]);
  }

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
        <span className="sw-dd-tags">
          {selectedOpts.length === 0 ? (
            <span className="sw-dd-trigger-placeholder">{placeholder}</span>
          ) : (
            <>
              {visible.map((o) => (
                <span key={o.value} className="sw-dd-tag">
                  <span className="sw-dd-tag-label">{o.label}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="sw-dd-tag-remove"
                    aria-label={`Remove ${o.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(o.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(o.value);
                      }
                    }}
                  >
                    ×
                  </span>
                </span>
              ))}
              {overflow > 0 ? <span className="sw-dd-tag-more">+{overflow} more</span> : null}
            </>
          )}
        </span>
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
          <ul id={listId} className="sw-dd-list" role="listbox" aria-multiselectable aria-label={ariaLabel ?? "Options"}>
            {filtered.map((o) => {
              const on = values.includes(o.value);
              return (
                <li key={o.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    disabled={o.disabled}
                    className={`sw-dd-option ${on ? "sw-dd-option--selected" : ""}`.trim()}
                    onClick={() => toggle(o.value)}
                  >
                    <span className="sw-dd-checkbox" aria-hidden>
                      {on ? "✓" : null}
                    </span>
                    {o.avatar ? (
                      <span className="sw-dd-avatar">{o.avatar}</span>
                    ) : (
                      <span className="sw-dd-avatar">{o.label.slice(0, 1).toUpperCase()}</span>
                    )}
                    <span className="sw-dd-option-body">
                      <span className="sw-dd-option-title">{o.label}</span>
                      {o.sublabel ? <span className="sw-dd-option-desc">{o.sublabel}</span> : null}
                    </span>
                    {o.badge ? <span className="sw-dd-badge">{o.badge}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}