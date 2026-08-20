#!/usr/bin/env bash
# Build the current working tree and deploy it as the live Cloudflare Workers production version.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WORKER_NAME="stackwise-technologies"

if ! command -v npx >/dev/null 2>&1; then
  echo "error: npx is required" >&2
  exit 1
fi

if ! npx wrangler whoami >/dev/null 2>&1; then
  echo "error: not logged in to Cloudflare. Run: npx wrangler login" >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
DIRTY=""
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  DIRTY="-dirty"
fi

# Wrangler version tags: lowercase letters, numbers, underscores, dashes, periods, colons
TAG="$(printf '%s' "$BRANCH" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._:-]+/-/g; s/^-+//; s/-+$//')"
TAG="${TAG:-local}${DIRTY}"
# No spaces: OpenNext invokes wrangler with shell:true, which splits unquoted message words.
MESSAGE="live:${BRANCH}@${SHA}${DIRTY}"

echo "==> Deploying live Worker"
echo "    worker:  ${WORKER_NAME}"
echo "    branch:  ${BRANCH}"
echo "    commit:  ${SHA}${DIRTY}"
echo "    tag:     ${TAG}"
echo "    message: ${MESSAGE}"
echo

echo "==> Building OpenNext Cloudflare worker"
npm run build:worker

echo
echo "==> Publishing to Cloudflare (100% production traffic)"
# Prefer --flag=value so the whole token survives OpenNext's shell passthrough.
npx opennextjs-cloudflare deploy -- \
  "--tag=${TAG}" \
  "--message=${MESSAGE}"


echo
echo "==> Live deployment status"
npx wrangler deployments status --name "$WORKER_NAME" || true

echo
echo "Done. Current branch is live on Cloudflare Worker \"${WORKER_NAME}\"."
