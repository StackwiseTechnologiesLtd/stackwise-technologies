export function DropdownChevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      className={`sw-dd-chevron-svg ${open ? "sw-dd-chevron-svg--open" : ""}`.trim()}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}