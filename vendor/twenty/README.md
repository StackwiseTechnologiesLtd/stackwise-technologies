# Vendored code from Twenty

Optional directory for **selective** copies from [twentyhq/twenty](https://github.com/twentyhq/twenty) when adapting UI or utilities into Stackwise admin.

## Before adding files here

1. Read [docs/vendor/TWENTY_UI_AND_FEATURES.md](../../docs/vendor/TWENTY_UI_AND_FEATURES.md) (license + workflow).
2. Record each import:

```text
UPSTREAM_SHA=
UPSTREAM_TAG_OR_BRANCH=
FILE=<upstream path> → <local path>
CHANGES=<Tailwind port, removed GraphQL, etc.>
```

3. Include or reference AGPL-3.0 license text from upstream at the time of copy.

## Prefer not to vendor

Default path: reimplement in `src/components/admin/crm/` using Stackwise styling. Use this folder only when porting saves significant time and the file is clearly bounded.
