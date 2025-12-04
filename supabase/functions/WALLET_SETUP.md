# Apple Wallet Real-Time Push System

## Overview

This system enables real-time updates to Apple Wallet loyalty passes when customer points change.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Points Change  │────▶│  DB Trigger      │────▶│  Push Queue │
│  (Order/Admin)  │     │  queue_wallet_   │     │             │
└─────────────────┘     │  push()          │     └──────┬──────┘
                        └──────────────────┘            │
                                                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Pass Updates   │◀────│  wallet-push     │◀────│  Cron Job   │
│  on Device      │     │  Edge Function   │     │  (1 min)    │
└─────────────────┘     └──────────────────┘     └─────────────┘
        │
        │ Device requests updated pass
        ▼
┌──────────────────┐     ┌──────────────────┐
│  wallet-api      │────▶│  wallet-pass     │
│  Web Service     │     │  Generator       │
└──────────────────┘     └──────────────────┘
```

## Edge Functions

| Function | Purpose |
|----------|---------|
| `wallet-api` | Apple's required web service endpoints |
| `wallet-pass` | Generates .pkpass files |
| `wallet-push` | Sends push notifications via APNs |

## Required Secrets

Set these in Supabase Dashboard > Edge Functions > Secrets:

```bash
# Apple Wallet Certificates (base64 encoded)
APPLE_WALLET_CERT_BASE64=<base64 encoded .pem certificate>
APPLE_WALLET_KEY_BASE64=<base64 encoded .pem private key>
APPLE_WALLET_WWDR_BASE64=<base64 encoded WWDR certificate>
APPLE_WALLET_CERT_PASSWORD=<certificate password>

# Apple Pass Configuration
APPLE_PASS_TYPE_ID=pass.com.whaletools.wallet
APPLE_TEAM_ID=Y9Q7L7SGR3

# APNs Push Notification (for JWT auth)
APNS_KEY_ID=<your APNs key ID from Apple Developer Portal>
APNS_AUTH_KEY_BASE64=<base64 encoded .p8 file>

# Optional
APNS_USE_SANDBOX=false  # Set to true for development
WALLET_WEB_SERVICE_URL=https://your-project.supabase.co/functions/v1/wallet-api
```

## How to Get APNs Key

1. Go to Apple Developer Portal > Keys
2. Create a new key with "Apple Push Notifications service (APNs)" enabled
3. Download the .p8 file
4. Note the Key ID
5. Base64 encode the .p8 file:
   ```bash
   base64 -i AuthKey_XXXXXXXX.p8 | tr -d '\n'
   ```

## Database Tables

### wallet_device_registrations
Stores device tokens for push notifications.

### wallet_push_queue
Queue for pending push notifications.

### wallet_passes
Tracks generated passes and their metadata.

## Deployment

1. Apply the migration:
   ```bash
   supabase db push
   ```

2. Deploy edge functions:
   ```bash
   supabase functions deploy wallet-api
   supabase functions deploy wallet-pass
   supabase functions deploy wallet-push
   ```

3. Set up secrets (via dashboard or CLI):
   ```bash
   supabase secrets set APPLE_WALLET_CERT_BASE64=...
   supabase secrets set APPLE_WALLET_KEY_BASE64=...
   # ... etc
   ```

4. Set up cron job for push processing:
   - The cron runs every minute to process the push queue

## React Native Integration

```typescript
// Generate wallet pass URL for customer
const getWalletPassUrl = (customerId: string) => {
  const supabaseUrl = 'https://your-project.supabase.co';
  return `${supabaseUrl}/functions/v1/wallet-pass?customer_id=${customerId}`;
};

// Add to Apple Wallet (using react-native-wallet-manager or similar)
import { PassKit } from 'react-native-passkit-wallet';

const addToWallet = async (customerId: string) => {
  const passUrl = getWalletPassUrl(customerId);
  const response = await fetch(passUrl);
  const passData = await response.arrayBuffer();

  // Add to wallet
  await PassKit.addPass(passData);
};
```

## Testing

1. Generate a test pass:
   ```bash
   curl "https://your-project.supabase.co/functions/v1/wallet-pass?customer_id=<uuid>" \
     -H "Authorization: Bearer <service-role-key>" \
     -o test-pass.pkpass
   ```

2. Test push notification:
   ```bash
   curl -X POST "https://your-project.supabase.co/functions/v1/wallet-push" \
     -H "Authorization: Bearer <service-role-key>" \
     -H "Content-Type: application/json" \
     -d '{"customer_id": "<uuid>"}'
   ```

## Troubleshooting

### Pass not updating
- Check `wallet_device_registrations` for device tokens
- Check `wallet_push_queue` for pending/failed pushes
- Verify APNs credentials are correct

### APNs errors
- 400: Invalid device token format
- 403: Certificate/key issue
- 410: Device unregistered (token should be deleted)
- 429: Rate limited

### Pass generation errors
- Ensure all certificate environment variables are set
- Check certificates are valid and not expired
- Verify pass.json structure is valid
