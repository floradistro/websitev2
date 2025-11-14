# Payment Terminal Health Monitoring System

## Overview

Mission-critical real-time monitoring system for payment processor connectivity. This ensures staff always know if card payment terminals are operational **before** attempting transactions.

## Features

✅ **Real-time Health Checks** - Every 5 seconds  
✅ **Non-intrusive Monitoring** - Lightweight ping, doesn't send test transactions  
✅ **Automatic Status Updates** - UI updates immediately when terminals go offline/online  
✅ **Visual Indicators** - Clear green (live) / red (offline) status on register cards  
✅ **Error Logging** - Tracks failure reasons for troubleshooting  
✅ **Database Persistence** - Health status stored for historical analysis  

---

## Architecture

### Components

1. **Health Check API** - `/api/pos/payment-processors/health`
   - Lightweight connectivity test
   - 2-3 second timeout per processor
   - Returns real-time status for all terminals at a location

2. **Dejavoo Ping Method** - `lib/payment-processors/dejavoo.ts`
   - OPTIONS request to API endpoint
   - Validates API is reachable without hitting terminal
   - Faster than full testConnection() ($0.01 transaction)

3. **Register Selector Polling** - `components/component-registry/pos/POSRegisterSelector.tsx`
   - Polls health endpoint every 5 seconds
   - Updates UI with real-time status
   - Shows pulsing green dot for live terminals
   - Shows red dot for offline terminals

4. **Database Tracking** - `payment_processors` table
   - `last_health_check` - Timestamp of last check
   - `is_live` - Current live status (boolean)
   - `last_health_error` - Error message if offline

---

## Deployment

### Step 1: Run Database Migration

Run this SQL in **Supabase SQL Editor**:

```sql
-- Add health tracking columns
ALTER TABLE public.payment_processors
ADD COLUMN IF NOT EXISTS last_health_check timestamptz,
ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_health_error text;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_processors_health 
ON public.payment_processors(is_live, last_health_check);
```

Or use the migration file:
```bash
psql "YOUR_SUPABASE_CONNECTION_STRING" -f scripts/deploy-health-tracking.sql
```

### Step 2: Restart Next.js Dev Server

The health monitoring will start automatically when you navigate to the register selector.

---

## How It Works

### 1. Initial Load
When staff opens the register selector page:
- Registers are loaded from `/api/pos/registers`
- Initial health check runs immediately
- UI displays real-time terminal status

### 2. Continuous Monitoring
While on the register selector page:
- **Register polling**: Every 2 seconds (for session updates)
- **Health polling**: Every 5 seconds (for terminal status)
- Status updates automatically in UI

### 3. Health Check Process

```
[Register Selector]
    ↓ (every 5s)
[/api/pos/payment-processors/health]
    ↓ (parallel checks)
[DejavooClient.ping()] → OPTIONS request to API
    ↓ (2s timeout)
[Result: Live ✅ or Offline ❌]
    ↓
[Update Database] → payment_processors.is_live
    ↓
[Return to UI] → Green/Red indicator
```

### 4. Visual Feedback

**Live Terminal:**
```
🟢 [💳] Dejavoo Z11
           Live ●
```

**Offline Terminal:**
```
🔴 [💳] Dejavoo Z11
           Offline
```

**No Terminal:**
```
⚪ [✖️💳] No Terminal
```

---

## Testing

### Test Terminal Goes Offline

1. **Disconnect Terminal**: Unplug network cable from Dejavoo terminal
2. **Wait 5 Seconds**: Health check will detect offline status
3. **Check UI**: Status should change from green "Live" to red "Offline"
4. **Reconnect Terminal**: Plug network cable back in
5. **Wait 5 Seconds**: Status should return to green "Live"

### Test API Monitoring

```bash
# Check health endpoint directly
curl "http://localhost:3000/api/pos/payment-processors/health?locationId=YOUR_LOCATION_ID"

# Response:
{
  "results": [
    {
      "processor_id": "abc-123",
      "is_live": true,
      "last_checked": "2025-11-14T10:30:00Z"
    }
  ]
}
```

---

## API Reference

### GET `/api/pos/payment-processors/health`

**Query Parameters:**
- `locationId` (required): Location to check processors for
- `processorId` (optional): Check specific processor only

**Response:**
```json
{
  "results": [
    {
      "processor_id": "uuid",
      "is_live": true,
      "last_checked": "2025-11-14T10:30:00Z",
      "error": null
    }
  ]
}
```

**Performance:**
- Timeout: 3 seconds per processor
- Parallel processing for multiple terminals
- Non-blocking (doesn't slow down register loading)

---

## Database Schema

```sql
ALTER TABLE payment_processors ADD COLUMN
  last_health_check timestamptz     -- Last check timestamp
  is_live boolean DEFAULT true     -- Current status
  last_health_error text            -- Error message if offline
```

**Indexes:**
```sql
CREATE INDEX idx_payment_processors_health 
ON payment_processors(is_live, last_health_check);
```

---

## Troubleshooting

### Terminal Shows Offline But Works

**Cause**: Network latency or firewall blocking OPTIONS requests

**Solution**:
1. Check firewall allows OPTIONS requests to Dejavoo API
2. Increase timeout in `dejavoo.ts` ping method
3. Test direct connection: `curl -X OPTIONS https://spin.spinpos.net/v2/Payment/Sale`

### Health Checks Not Running

**Symptoms**: No status updates, always shows database status

**Solution**:
1. Check browser console for fetch errors
2. Verify API endpoint is accessible: `/api/pos/payment-processors/health`
3. Check React useEffect dependencies in POSRegisterSelector.tsx

### Database Not Updating

**Symptoms**: UI updates but database shows old data

**Solution**:
1. Check database permissions for service role
2. Verify `updateProcessorHealthStatus()` function runs without errors
3. Check Supabase logs for failed UPDATE queries

---

## Performance Considerations

### Why 5 Second Polling?

- **Fast enough**: Detects offline terminals within 5 seconds
- **Network friendly**: Doesn't overwhelm API
- **Battery efficient**: Minimal impact on mobile devices
- **Scalable**: Can handle 10+ processors per location

### Why Lightweight Ping?

**Full testConnection():**
- Sends $0.01 transaction to terminal
- Takes 5-15 seconds
- Shows on physical terminal screen
- ❌ Too slow for real-time monitoring

**Lightweight ping():**
- OPTIONS request to API
- Takes 100-500ms
- Doesn't touch terminal
- ✅ Perfect for continuous monitoring

---

## Future Enhancements

### Phase 2: Active Session Monitoring

Add health monitoring to active POS sessions:
- Alert cashier if terminal goes offline mid-session
- Show warning before attempting card transaction
- Auto-switch to cash-only mode if terminal offline

### Phase 3: Historical Analytics

- Track uptime/downtime metrics
- Alert managers of recurring issues
- Generate terminal reliability reports

### Phase 4: Proactive Alerts

- Slack/SMS notifications when terminal goes offline
- Email digest of daily terminal health
- Dashboard widget showing terminal status across all locations

---

## Security

### Authentication

All health check endpoints require vendor authentication:
```typescript
const authResult = await requireVendor(request);
if (authResult instanceof NextResponse) return authResult;
```

### Rate Limiting

Health checks are:
- Limited to authenticated vendors only
- Scoped to vendor's own processors
- Throttled by UI polling interval (5s)

### Error Handling

Sensitive information is never exposed:
- API keys not included in responses
- Only processor IDs and live status returned
- Detailed errors logged server-side only

---

## Support

For issues or questions about payment terminal health monitoring:

1. Check logs in browser console (development mode)
2. Review Supabase database for health check timestamps
3. Test direct processor connectivity with `testConnection()`
4. Contact WhaleTools support with processor ID and error details

---

**Status**: ✅ Deployed and Active  
**Last Updated**: November 14, 2025  
**Version**: 1.0.0

