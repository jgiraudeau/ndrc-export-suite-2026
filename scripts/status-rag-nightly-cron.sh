#!/usr/bin/env bash
set -euo pipefail

CURRENT_CRON="$(crontab -l 2>/dev/null || true)"
MATCHES="$(printf '%s\n' "$CURRENT_CRON" | grep 'integration-rag-nightly-sync' || true)"

if [ -z "$MATCHES" ]; then
  echo "No RAG nightly cron configured."
  exit 0
fi

echo "RAG nightly cron entries:"
printf '%s\n' "$MATCHES"
