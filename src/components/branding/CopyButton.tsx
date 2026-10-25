"use client";

import { useCallback, useState } from "react";
import { IconCopy } from "./brand-icons";

type CopyButtonProps = {
  text: string;
  label: string;
  className?: string;
  iconClassName?: string;
  onDark?: boolean;
  small?: boolean;
};

export function CopyButton({
  text,
  label,
  className = "Guidelines_downloadIconButton__HyeQt",
  iconClassName = "Guidelines_downloadIconButtonIcon__oRZTC",
  onDark,
  small,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [text]);

  const classes = [
    className,
    onDark ? "Guidelines_downloadIconButtonOnDark__ERqdR" : "",
    small ? "Guidelines_downloadIconButtonSmall__cvaOi" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      aria-label={copied ? "Copied" : label}
      onClick={() => void onCopy()}
    >
      <IconCopy className={iconClassName} />
    </button>
  );
}
