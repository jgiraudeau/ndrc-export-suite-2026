#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCHEDULE="${RAG_CRON_SCHEDULE:-15 2 * * *}"
LOG_FILE="${RAG_CRON_LOG_FILE:-$ROOT_DIR/logs/rag-sync-nightly.log}"
TAG="# integration-rag-nightly-sync"

mkdir -p "$(dirname "$LOG_FILE")"

CURRENT_CRON="$(crontab -l 2>/dev/null || true)"
FILTERED_CRON="$(printf '%s\n' "$CURRENT_CRON" | sed '/integration-rag-nightly-sync/d')"
NEW_LINE="$SCHEDULE cd $ROOT_DIR && /usr/bin/env npm run rag:sync >> $LOG_FILE 2>&1 $TAG"

printf '%s\n%s\n' "$FILTERED_CRON" "$NEW_LINE" | awk 'NF' | crontab -

echo "RAG nightly cron installed."
echo "Schedule : $SCHEDULE"
echo "Command  : cd $ROOT_DIR && npm run rag:sync"
echo "Log file : $LOG_FILE"
