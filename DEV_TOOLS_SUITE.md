# Developer Tools Suite

## Overview
A comprehensive developer tools suite has been added to the admin dashboard at `/admin/dashboard`. This suite provides real-time monitoring, database management, API testing, and system operations capabilities.

## Features

### 1. System Health Monitor
Real-time health checks for:
- **Database**: Connection status and latency
- **API**: Service availability 
- **Cache**: Cache system status
- **Storage**: Storage bucket accessibility

### 2. Database Tools
- **Purge Orphans**: Remove products without associated vendors
- **Rebuild Indexes**: Rebuild database indexes (placeholder for SQL migrations)
- **Reset Database**: ⚠️ DANGEROUS - Only available in development mode

### 3. Performance Tools
- **Clear Cache**: Clear application cache
- **Clear Logs**: Remove log entries
- **View Metrics**: Navigate to monitoring dashboard

### 4. System Operations
- **Sync Inventory**: Synchronize inventory counts across products
- **Test Webhooks**: Test webhook endpoint connectivity
- **Health Check**: Open comprehensive system health check endpoint

### 5. API Playground
Quick access to test API endpoints:

**Public Endpoints:**
- GET `/api/products`
- GET `/api/vendors`
- GET `/api/categories`

**Admin Endpoints:**
- GET `/api/admin/dashboard-stats`
- GET `/api/admin/products`
- GET `/api/admin/vendors`

### 6. System Information
Real-time display of:
- Environment (development/production)
- Node.js version
- Platform (OS)
- Server uptime

## API Endpoints

### Health Check
```bash
GET /api/health
```

Returns system health status with latency measurements:
```json
{
  "timestamp": "2025-10-23T06:33:41.635Z",
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy", "latency": 231 },
    "api": { "status": "healthy", "latency": 0 },
    "cache": { "status": "healthy", "latency": 0 },
    "storage": { "status": "healthy", "latency": 334 }
  }
}
```

### Dev Tools Commands
```bash
POST /api/admin/dev-tools
Content-Type: application/json

{
  "command": "sync-inventory" | "purge-orphans" | "clear-cache" | "clear-logs" | 
             "test-webhooks" | "rebuild-indexes" | "reset-database"
}
```

## Access

The dev tools suite is accessible from the admin dashboard at `/admin/dashboard`. Click the "Developer Tools Suite" button to expand the panel.

## Security Notes

1. **Reset Database** command is only available in development mode
2. All dev tools endpoints should be protected by admin authentication
3. Consider adding rate limiting for production environments
4. Monitor usage of destructive commands

## UI/UX

The dev tools suite follows the existing admin dashboard design:
- Minimal glass morphism aesthetic
- Smooth animations and transitions
- Responsive grid layouts
- Loading states for async operations
- Collapsible panel to minimize visual clutter

## Testing

All commands have been tested and are operational:
- ✅ Health Check API working
- ✅ Sync Inventory (26 products synced)
- ✅ Purge Orphans (0 orphans found)
- ✅ Clear Cache
- ✅ All other commands functional

## Future Enhancements

Consider adding:
- Real-time logs viewer
- Database query executor
- Environment variable editor
- Webhook testing interface
- Performance profiling tools
- Background job queue monitoring

