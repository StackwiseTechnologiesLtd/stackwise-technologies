"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  id = "otp-input",
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = digitsOnly(value).slice(0, length).split("");
  while (digits.length < length) digits.push("");

  const setValue = useCallback(
    (next: string) => {
      const cleaned = digitsOnly(next).slice(0, length);
      onChange(cleaned);
      if (cleaned.length === length) {
        onComplete?.(cleaned);
      }
    },
    [length, onChange, onComplete],
  );

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  function focusAt(index: number) {
    const clamped = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  }

  function applyDigits(startIndex: number, incoming: string) {
    const chars = digitsOnly(incoming);
    if (!chars) return;

    const next = value.split("");
    while (next.length < length) next.push("");

    let cursor = startIndex;
    for (const char of chars) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }

    setValue(next.join(""));
    focusAt(Math.min(cursor, length - 1));
  }

  function handleChange(index: number, raw: string) {
    const char = digitsOnly(raw);
    if (!char) {
      const next = value.split("");
      while (next.length < length) next.push("");
      next[index] = "";
      setValue(next.join(""));
      return;
    }

    applyDigits(index, char.slice(-1));
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = value.split("");
      while (next.length < length) next.push("");

      if (next[index]) {
        next[index] = "";
        setValue(next.join(""));
        focusAt(index);
        return;
      }

      if (index > 0) {
        next[index - 1] = "";
        setValue(next.join(""));
        focusAt(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      const next = value.split("");
      while (next.length < length) next.push("");
      next[index] = "";
      setValue(next.join(""));
      return;
    }

    if (event.key.length === 1 && !/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    applyDigits(0, pasted);
  }

  return (
    <div
      className="flex justify-center gap-2 sm:gap-2.5"
      role="group"
      aria-labelledby={`${id}-label`}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          className="h-12 w-10 rounded-lg border border-line bg-background text-center text-lg font-semibold tabular-nums text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50 sm:h-14 sm:w-12 sm:text-xl"
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.currentTarget.select()}
        />
      ))}
    </div>
  );
}
