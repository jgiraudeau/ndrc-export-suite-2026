#!/usr/bin/env bash
set -euo pipefail

CURRENT_CRON="$(crontab -l 2>/dev/null || true)"
UPDATED_CRON="$(printf '%s\n' "$CURRENT_CRON" | sed '/integration-rag-nightly-sync/d')"

if [ -z "$(printf '%s' "$UPDATED_CRON" | awk 'NF')" ]; then
  crontab -r 2>/dev/null || true
else
  printf '%s\n' "$UPDATED_CRON" | awk 'NF' | crontab -
fi

echo "RAG nightly cron removed (if it existed)."
