#!/bin/bash
# Safe database query script - NEVER hangs on pager
# Usage: ./db-query-safe.sh "SELECT * FROM table"

QUERY="$1"

PGPASSWORD='SelahEsco123!!' psql \
  -h db.uaednwpxursknmwdeejn.supabase.co \
  -U postgres \
  -d postgres \
  -t \
  --no-psqlrc \
  -A \
  -q \
  --pset=pager=off \
  -c "$QUERY" 2>&1 | cat

