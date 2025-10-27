#!/bin/bash

# Nightly Database Optimization Script for WhaleTools
# Runs VACUUM, ANALYZE, and cleanup operations

set -e

DB_URL="postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres"

echo "🗄️  Starting nightly database optimization..."

# Run VACUUM ANALYZE on all tables
echo "Running VACUUM ANALYZE..."
psql "$DB_URL" -c "VACUUM ANALYZE;" || echo "⚠️  VACUUM ANALYZE failed (may need superuser)"

# Update table statistics
echo "Updating table statistics..."
psql "$DB_URL" -c "ANALYZE vendor_component_instances;"
psql "$DB_URL" -c "ANALYZE page_sections;"
psql "$DB_URL" -c "ANALYZE vendors;"
psql "$DB_URL" -c "ANALYZE products;"
psql "$DB_URL" -c "ANALYZE orders;"

# Clean up old sessions (older than 30 days)
echo "Cleaning old sessions..."
psql "$DB_URL" -c "
  DELETE FROM pos_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days' 
  AND status = 'completed';
" || echo "No pos_sessions table or cleanup failed"

# Clean up old audit logs (older than 90 days)
echo "Cleaning old audit logs..."
psql "$DB_URL" -c "
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
" || echo "No audit_logs table or cleanup failed"

# Reindex critical tables
echo "Reindexing critical tables..."
psql "$DB_URL" -c "REINDEX TABLE vendor_component_instances;" || echo "Reindex failed"
psql "$DB_URL" -c "REINDEX TABLE products;" || echo "Reindex failed"

# Generate table size report
echo ""
echo "📊 Table sizes:"
psql "$DB_URL" -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;
"

# Check for missing indexes
echo ""
echo "🔍 Checking for missing indexes on foreign keys..."
psql "$DB_URL" -c "
  SELECT 
    c.conrelid::regclass AS table_name,
    string_agg(a.attname, ', ') AS columns
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
    AND c.conkey::int[] <@ i.indkey::int[]
  )
  GROUP BY c.conrelid
  LIMIT 10;
" || echo "No missing indexes found"

# Query performance analysis
echo ""
echo "⚡ Slowest queries (if pg_stat_statements enabled):"
psql "$DB_URL" -c "
  SELECT 
    calls,
    mean_exec_time::numeric(10,2) as avg_time_ms,
    left(query, 100) as query_preview
  FROM pg_stat_statements
  WHERE query NOT LIKE '%pg_stat_statements%'
  ORDER BY mean_exec_time DESC
  LIMIT 5;
" || echo "pg_stat_statements not enabled"

echo ""
echo "✅ Database optimization complete!"

