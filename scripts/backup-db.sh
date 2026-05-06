#!/usr/bin/env bash
# Sauvegarde manuelle de la base Railway via pg_dump.
# Usage : ./scripts/backup-db.sh
# Prérequis : pg_dump installé (brew install libpq), .env présent.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$ROOT_DIR/backups"
KEEP_LAST=10

# Charge DATABASE_URL depuis .env si pas déjà dans l'environnement
if [[ -z "${DATABASE_URL:-}" ]]; then
  ENV_FILE="$ROOT_DIR/.env"
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌  Fichier .env introuvable et DATABASE_URL non définie."
    exit 1
  fi
  export $(grep -E '^DATABASE_URL=' "$ENV_FILE" | xargs)
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌  DATABASE_URL vide après lecture du .env."
  exit 1
fi

# Vérifie que pg_dump est disponible
if ! command -v pg_dump &>/dev/null; then
  echo "❌  pg_dump introuvable. Installe-le avec : brew install libpq"
  echo "    Puis ajoute /opt/homebrew/opt/libpq/bin à ton PATH."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="fullndrc_${TIMESTAMP}.sql.gz"
FILEPATH="$BACKUP_DIR/$FILENAME"

echo "🔄  Connexion à Railway et dump en cours..."
pg_dump "$DATABASE_URL" --no-password --clean --if-exists | gzip > "$FILEPATH"

SIZE=$(du -sh "$FILEPATH" | cut -f1)
echo "✅  Sauvegarde créée : backups/$FILENAME ($SIZE)"

# Supprime les anciennes sauvegardes au-delà de KEEP_LAST
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
if (( BACKUP_COUNT > KEEP_LAST )); then
  echo "🧹  Nettoyage : conservation des $KEEP_LAST dernières sauvegardes..."
  ls -1t "$BACKUP_DIR"/*.sql.gz | tail -n +"$((KEEP_LAST + 1))" | xargs rm -f
fi

echo ""
echo "📁  Sauvegardes disponibles :"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print "   " $NF " (" $5 ")"}'
echo ""
echo "💡  Pour restaurer : gunzip -c backups/$FILENAME | psql \$DATABASE_URL"
