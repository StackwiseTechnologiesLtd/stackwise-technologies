import type { ReactNode } from "react";

/**
 * Fixed 210×297mm sheet for WYSIWYG preview (scrolls horizontally in narrow admin columns).
 */
export function DocumentA4Preview({ children }: { children: ReactNode }) {
  return (
    <div className="document-a4-preview">
      <div className="document-a4-sheet">{children}</div>
    </div>
  );
}
