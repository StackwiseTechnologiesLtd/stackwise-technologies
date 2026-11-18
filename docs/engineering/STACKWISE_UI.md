# Stackwise UI (admin inputs)

Shared pickers and lists for the admin shell (`--admin-*` tokens). **Prefer `@/components/stackwise` over native `<select>`, `<input type="file">`, and one-off popovers.**

## Catalog

| Component | Use for |
|-----------|---------|
| `StackwiseDatePicker` | ISO date (`YYYY-MM-DD`) |
| `StackwiseTimePicker` | 24h time / flip clock |
| `StackwiseColorPicker` | Hex accent (3-tier chrome + swatches + custom) |
| `StackwiseFilePicker` | Attachments: drop zone, list rows, image gallery, quick view |
| `StackwiseSelect` | Single choice dropdown (optional search, icons, descriptions) |
| `StackwiseMultiSelect` | Multi choice with tags, avatars, checkboxes |
| `StackwiseCalendar` | Month/week content grid (calendar feature) |
| `AdminPanelPagination` | Audit-style footer: `1-4 of 6` + ‹ Back · pages · Next › (`TablePagination` re-exports this) |

## Import

```tsx
import {
  StackwiseDatePicker,
  StackwiseTimePicker,
  StackwiseColorPicker,
  StackwiseFilePicker,
  StackwiseSelect,
  StackwiseMultiSelect,
} from "@/components/stackwise";
```

`@/components/calendar` re-exports calendar-related pieces for backward compatibility; new code should import from `stackwise`.

## Dropdown reference UX

- **StackwiseSelect** — trigger + panel; checkmark on selected row; optional search (country/phone-style lists).
- **StackwiseMultiSelect** — pills in trigger (`+N more` overflow); checkbox rows with avatar + handle + optional badge.

Styles: `stackwise-dropdown.css` (focus ring uses `--admin-focus`).

## File attachments

See [CONTENT_CALENDAR.md](./CONTENT_CALENDAR.md#ui) for attachment list vs gallery rules.

## Buttons

Use `ADMIN_BTN_PRIMARY` / `ADMIN_BTN_SECONDARY` / `ADMIN_BTN_GHOST` (or `AdminActionButton`) inside `/admin` — not `BTN_*` from `@/lib/ui/buttons` (public/pay pages). `PrintButton` accepts `admin` for contract review.

## Adding a new admin form field

1. Pick the closest Stackwise component from the table above.
2. If nothing fits, extend an existing component or add a sibling under `src/components/stackwise/` with the same CSS prefix (`sw-dd-*` or existing picker CSS).
3. Document it in this file.