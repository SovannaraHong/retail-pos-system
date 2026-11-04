#!/usr/bin/env bash
#
# Daily database backup for Retail POS (Docker Compose + MySQL).
#
# Usage:
#   chmod +x backup.sh
#   ./backup.sh
#
# Schedule daily at 11:30 PM:
#   crontab -e
#   30 23 * * * cd /path/to/retail-pos && ./backup.sh >> ./backups/backup.log 2>&1
#
# Optional environment variables:
#   ENV_FILE=.env.docker
#   DB_SERVICE=mysql
#   DB_ENGINE=mysql
#   BACKUP_DIR=./backups
#   KEEP_DAYS=14
#   BACKUP_S3_URI=s3://your-bucket/retail-pos
#

set -Eeuo pipefail

umask 077

# --------------------------------------------------
# Configuration
# --------------------------------------------------

ENV_FILE="${ENV_FILE:-.env.docker}"
DB_SERVICE="${DB_SERVICE:-mysql}"
DB_ENGINE="${DB_ENGINE:-mysql}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

# --------------------------------------------------
# Load database credentials
# --------------------------------------------------

if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: Environment file $ENV_FILE not found."
    echo "Run this script from your project root."
    exit 1
fi

get_env() {
    local key="$1"

    grep -E "^${key}=" "$ENV_FILE" \
        | head -n 1 \
        | cut -d '=' -f 2- \
        | sed -e 's/[[:space:]]*#.*$//' \
              -e 's/^"//' \
              -e 's/"$//'
}

DB_NAME="$(get_env DB_DATABASE)"
DB_USER="$(get_env DB_USERNAME)"
DB_PASS="$(get_env DB_PASSWORD)"

if [[ -z "$DB_NAME" || -z "$DB_USER" ]]; then
    echo "ERROR: DB_DATABASE or DB_USERNAME is missing."
    exit 1
fi

# --------------------------------------------------
# Validate configuration
# --------------------------------------------------

if ! [[ "$KEEP_DAYS" =~ ^[0-9]+$ ]]; then
    echo "ERROR: KEEP_DAYS must be a non-negative integer."
    exit 1
fi

if ! docker compose config --services | grep -Fxq "$DB_SERVICE"; then
    echo "ERROR: Docker service '$DB_SERVICE' does not exist."
    exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/pos-$TIMESTAMP.sql.gz"

echo "[$(date '+%F %T')] Starting database backup..."
echo "Database: $DB_NAME"
echo "Service: $DB_SERVICE"
echo "Engine: $DB_ENGINE"
echo "Destination: $FILE"

# --------------------------------------------------
# Database backup
# --------------------------------------------------

case "$DB_ENGINE" in

    mysql)
        docker compose exec -T \
            -e MYSQL_PWD="$DB_PASS" \
            "$DB_SERVICE" \
            mysqldump \
                --single-transaction \
                --routines \
                --triggers \
                --no-tablespaces \
                -u "$DB_USER" \
                "$DB_NAME" \
            | gzip > "$FILE"
        ;;

    postgres)
        docker compose exec -T \
            -e PGPASSWORD="$DB_PASS" \
            "$DB_SERVICE" \
            pg_dump -U "$DB_USER" "$DB_NAME" \
            | gzip > "$FILE"
        ;;

    *)
        echo "ERROR: DB_ENGINE must be mysql or postgres."
        rm -f "$FILE"
        exit 1
        ;;
esac

# --------------------------------------------------
# Verify backup
# --------------------------------------------------

if [[ ! -s "$FILE" ]] || ! gzip -t "$FILE" 2>/dev/null; then
    echo "ERROR: Backup is empty or damaged."
    rm -f "$FILE"
    exit 1
fi

echo "Backup completed successfully."
echo "File size: $(du -h "$FILE" | cut -f1)"

# --------------------------------------------------
# Optional AWS S3 upload
# --------------------------------------------------

if [[ -n "${BACKUP_S3_URI:-}" ]]; then

    if command -v aws >/dev/null 2>&1; then

        echo "Uploading backup to AWS S3..."

        if aws s3 cp "$FILE" "$BACKUP_S3_URI/" --only-show-errors; then
            echo "S3 upload completed."
        else
            echo "ERROR: S3 upload failed."
            exit 1
        fi

    else
        echo "WARNING: AWS CLI is not installed. Skipping S3 upload."
    fi

fi

# --------------------------------------------------
# Delete old backups
# --------------------------------------------------

find "$BACKUP_DIR" \
    -maxdepth 1 \
    -type f \
    -name 'pos-*.sql.gz' \
    -mtime +"$KEEP_DAYS" \
    -delete

echo "Old backups cleaned."
echo "Retention: $KEEP_DAYS days"
echo "[$(date '+%F %T')] Backup process finished."