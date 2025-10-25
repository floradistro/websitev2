#!/bin/bash
# Automated Daily Backup - Run via cron
# Add to crontab: 0 2 * * * /Users/whale/Desktop/Website/scripts/auto-backup-daily.sh

BACKUP_DIR="/Users/whale/Desktop/Website/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$BACKUP_DIR/backup.log"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "*.csv" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.json" -mtime +30 -delete

# Run backup
echo "[$(date)] Starting automated backup..." >> "$LOG_FILE"
/Users/whale/Desktop/Website/scripts/backup-database.sh >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "[$(date)] ✅ Backup successful" >> "$LOG_FILE"
else
  echo "[$(date)] ❌ Backup failed" >> "$LOG_FILE"
fi

