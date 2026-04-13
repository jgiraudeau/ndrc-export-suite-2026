# RAG Nightly Automation

This project can schedule a nightly sync of the local `knowledge/` folder into the global Google File Search store.

## Install nightly cron

```bash
npm run rag:cron:install
```

Default schedule: `15 2 * * *` (every night at 02:15).

Optional overrides:

```bash
RAG_CRON_SCHEDULE="30 1 * * *" RAG_CRON_LOG_FILE="/tmp/rag-sync.log" npm run rag:cron:install
```

## Check status

```bash
npm run rag:cron:status
```

## Remove nightly cron

```bash
npm run rag:cron:remove
```

## Manual sync

```bash
npm run rag:sync
```
