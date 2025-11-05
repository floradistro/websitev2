# Apple Wallet Pass System - Setup Guide

This guide will walk you through setting up the Apple Wallet pass system for your platform.

## Overview

The system allows vendors to offer digital loyalty cards that customers can add to Apple Wallet. Cards automatically update when points change and support push notifications.

### Features
- ✅ Native Apple Wallet integration
- ✅ Automatic pass updates when loyalty points change
- ✅ Push notifications support
- ✅ Vendor-branded passes (colors, logos)
- ✅ QR code for customer identification
- ✅ Multi-device support
- ✅ Real-time analytics dashboard
- ✅ No dependency on third-party services (Alpine IQ removed)

---

## Prerequisites

Before you begin, ensure you have:

1. **Apple Developer Account** ($99/year)
2. **Pass Type ID** certificate from Apple
3. **Apple WWDR Certificate** (Worldwide Developer Relations)
4. **.p12 Certificate File** with password
5. **Team ID** from Apple Developer Portal

---

## Step 1: Apple Developer Setup

### 1.1 Create Pass Type ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (Add new)
4. Select **Pass Type IDs** → Continue
5. Enter:
   - **Description**: WhaleTools Wallet Pass
   - **Identifier**: `pass.com.whaletools.wallet` (or your custom domain)
6. Click **Register**

### 1.2 Generate Certificate

1. In **Pass Type IDs** section, click your newly created Pass Type ID
2. Click **Create Certificate**
3. Follow instructions to generate a **Certificate Signing Request (CSR)** on your Mac:
   ```bash
   # Open Keychain Access → Certificate Assistant → Request Certificate from CA
   # Enter your email and name
   # Select "Saved to disk"
   # Save the .certSigningRequest file
   ```
4. Upload the CSR file
5. Download the generated certificate (`.cer` file)

### 1.3 Create .p12 File

1. Double-click the downloaded `.cer` file to add it to Keychain
2. Open **Keychain Access** app
3. Find your Pass Type ID certificate
4. Right-click → **Export**
5. Save as `.p12` format
6. **Set a password** (you'll need this later)
7. Save to: `/Users/whale/Desktop/APPLE WALLET SHIT/Certificates.p12`

### 1.4 Download WWDR Certificate

1. Go to [Apple PKI](https://www.apple.com/certificateauthority/)
2. Download **WWDR G4 Certificate** (`.cer` file)
3. Save to: `/Users/whale/Desktop/APPLE WALLET SHIT/AppleWWDRCAG4.cer`

### 1.5 Get Your Team ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Click your account name (top right)
3. Find **Team ID** (10-character code like `Y9Q7L7SGR3`)
4. Save this for later

---

## Step 2: Environment Variables

Add these to your `.env.local` file:

```bash
# Apple Wallet Configuration
APPLE_PASS_TYPE_ID=pass.com.whaletools.wallet
APPLE_TEAM_ID=Y9Q7L7SGR3
APPLE_WALLET_CERT_PASSWORD=your_p12_password_here

# Certificate paths (absolute paths)
APPLE_WALLET_CERT_PATH=/Users/whale/Desktop/APPLE WALLET SHIT/Certificates.p12
APPLE_WALLET_WWDR_PATH=/Users/whale/Desktop/APPLE WALLET SHIT/AppleWWDRCAG4.cer

# Your app URL (for webhook callbacks from Apple)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Important Notes:
- Replace `your_p12_password_here` with your actual certificate password
- Replace `yourdomain.com` with your production domain
- For local testing, use `http://localhost:3000` (but Apple won't send webhooks to localhost)

---

## Step 3: Database Migration

Run the database migration to create wallet pass tables:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually
# File: /Users/whale/Desktop/Website/supabase/migrations/20251105_apple_wallet_passes.sql
```

This creates the following tables:
- `wallet_passes` - Stores generated passes
- `wallet_pass_events` - Logs all pass events (adds, updates, scans)
- `vendor_wallet_settings` - Vendor-specific configuration
- `wallet_pass_updates_queue` - Queue for batch updates

---

## Step 4: Verify Installation

### 4.1 Check Dependencies

Ensure `passkit-generator` is installed:

```bash
npm list passkit-generator
```

If not installed:
```bash
npm install passkit-generator
```

### 4.2 Test Configuration

Run the configuration validator:

```typescript
import { validateWalletConfig } from '@/lib/wallet/config';

const validation = validateWalletConfig();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}
```

---

## Step 5: Access the Dashboard

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/vendor/apple-wallet`

3. You should see:
   - Stats dashboard (total passes, active passes, devices)
   - Recent passes list
   - Quick actions (share link, send push, analytics)
   - Settings panel

---

## Step 6: Generate Your First Pass

### For Testing (Direct API Call):

```bash
curl "http://localhost:3000/api/customer/wallet-pass?customer_id=CUSTOMER_UUID" \
  -o test-pass.pkpass
```

Then double-click `test-pass.pkpass` on your Mac to preview in Simulator, or AirDrop to your iPhone.

### For Production (Customer UI):

Customers can visit their profile page and click "Add to Apple Wallet" button.

---

## Architecture Overview

### File Structure

```
/Users/whale/Desktop/Website/
├── lib/wallet/
│   ├── config.ts              # Configuration & certificate paths
│   └── pass-generator.ts      # Core pass generation logic
│
├── app/
│   ├── vendor/apple-wallet/
│   │   └── page.tsx           # Vendor dashboard
│   │
│   └── api/
│       ├── customer/wallet-pass/
│       │   └── route.ts       # Customer pass generation endpoint
│       │
│       ├── vendor/apple-wallet/
│       │   └── stats/         # Dashboard stats API
│       │       └── route.ts
│       │
│       └── wallet/v1/         # Apple Web Service API
│           ├── devices/       # Device registration
│           └── passes/        # Pass updates
│
├── components/customer/
│   └── AddToWalletButton.tsx  # Customer-facing button
│
└── supabase/migrations/
    └── 20251105_apple_wallet_passes.sql
```

### How It Works

1. **Customer Requests Pass**:
   - Customer clicks "Add to Apple Wallet"
   - Frontend calls `/api/customer/wallet-pass?customer_id=xxx`

2. **Pass Generation**:
   - Server checks if pass exists in `wallet_passes` table
   - If exists: updates with latest customer data
   - If new: creates new record with unique serial number and auth token
   - Generates `.pkpass` file using vendor branding and customer data
   - Returns file for download

3. **Customer Adds to Wallet**:
   - Customer taps the downloaded `.pkpass` file
   - iOS validates signature and displays "Add to Apple Wallet"
   - Upon adding, device registers with our server at:
     `POST /api/wallet/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber`

4. **Automatic Updates**:
   - When customer earns points, database trigger fires
   - Update queued in `wallet_pass_updates_queue`
   - Background job sends push notification to device
   - Device fetches updated pass from:
     `GET /api/wallet/v1/passes/:passTypeId/:serialNumber`

---

## Customization

### Vendor Branding

Vendors can customize their passes in the dashboard settings:
- Organization name
- Logo (from `vendors.logo_url`)
- Colors (from `vendors.brand_colors`)
- Pass description
- Field visibility

### Pass Fields

Default fields shown on pass:
- **Primary**: Loyalty Points (large, prominent)
- **Secondary**: Tier, Member Name
- **Auxiliary**: Member Since
- **Back**: Email, Store Name, Terms

To customize fields, update `vendor_wallet_settings.fields_config`.

### Push Notifications

Automatic push notifications are sent when:
- Customer earns/spends points
- Loyalty tier changes
- Vendor sends manual update

Configure in vendor dashboard settings.

---

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Certificates in correct location
- [ ] Dashboard loads at `/vendor/apple-wallet`
- [ ] Can generate test pass
- [ ] Pass opens in Apple Wallet (on device or simulator)
- [ ] Pass shows correct customer data
- [ ] QR code displays correctly
- [ ] Vendor branding (colors/logo) applied
- [ ] Device registration works (check `wallet_passes.devices`)
- [ ] Points update triggers pass update
- [ ] Push notification received (requires physical device)

---

## Troubleshooting

### Error: "Certificate not found"

**Solution**: Check environment variable paths are absolute and correct:
```bash
ls -la "/Users/whale/Desktop/APPLE WALLET SHIT/Certificates.p12"
ls -la "/Users/whale/Desktop/APPLE WALLET SHIT/AppleWWDRCAG4.cer"
```

### Error: "Invalid passphrase"

**Solution**: Verify your `.p12` password in `.env.local`:
```bash
APPLE_WALLET_CERT_PASSWORD=correct_password_here
```

### Error: "Pass type identifier mismatch"

**Solution**: Ensure `APPLE_PASS_TYPE_ID` matches your Apple Developer Pass Type ID exactly.

### Pass doesn't update automatically

**Checklist**:
1. Device registered? Check `wallet_passes.devices` array
2. Push tokens present? Each device should have `push_token`
3. `webServiceURL` correct in pass? Should be your production domain
4. Background job running? Check `wallet_pass_updates_queue` table

### Push notifications not working

**Note**: Push notifications require:
- Apple's production environment (not development)
- Valid APNs certificate
- Physical iOS device (not simulator)
- Pass added to wallet (not just previewed)

---

## Production Deployment

### 1. Update Environment Variables

In your production environment:
```bash
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### 2. Move Certificates to Secure Location

**Recommended**: Store certificates in environment variables or secure secret manager:

```bash
# Base64 encode certificates
base64 -i Certificates.p12 -o cert.b64
base64 -i AppleWWDRCAG4.cer -o wwdr.b64

# Add to environment as strings
APPLE_WALLET_CERT_BASE64=<contents of cert.b64>
APPLE_WALLET_WWDR_BASE64=<contents of wwdr.b64>
```

Then update `lib/wallet/pass-generator.ts` to decode from base64.

### 3. Enable HTTPS

Apple requires HTTPS for Web Service API. Ensure your domain has valid SSL certificate.

### 4. Set Up Monitoring

Monitor these metrics:
- Pass generation success rate
- Device registration rate
- Push notification delivery rate
- API endpoint latency

---

## API Reference

### Customer Endpoints

#### Generate Pass
```
GET /api/customer/wallet-pass?customer_id={uuid}&vendor_id={uuid}
```

**Response**: `.pkpass` file (binary)

### Vendor Endpoints

#### Get Stats
```
GET /api/vendor/apple-wallet/stats
Authorization: Bearer {vendor_token}
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "total_passes": 150,
    "active_passes": 142,
    "total_devices": 178,
    "passes_added_today": 5,
    "passes_added_this_week": 23,
    "passes_added_this_month": 87
  },
  "recent_passes": [...]
}
```

### Apple Web Service Endpoints

#### Register Device
```
POST /api/wallet/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber
Authorization: ApplePass {authToken}
Body: { "pushToken": "..." }
```

#### Unregister Device
```
DELETE /api/wallet/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber
Authorization: ApplePass {authToken}
```

#### Get Updated Pass
```
GET /api/wallet/v1/passes/:passTypeId/:serialNumber
Authorization: ApplePass {authToken}
If-Modified-Since: {date}
```

**Response**: `.pkpass` file or `304 Not Modified`

---

## Support & Resources

- [Apple Wallet Developer Guide](https://developer.apple.com/wallet/)
- [PassKit Package Format](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/)
- [passkit-generator npm package](https://www.npmjs.com/package/passkit-generator)

---

## Migration from Alpine IQ

If you were previously using Alpine IQ wallet passes:

1. **Data**: Customer loyalty data already in `customers` table (no migration needed)
2. **Alpine IQ Still Used For**: SMS/Email marketing only
3. **Removed**: All Alpine IQ wallet pass code
4. **New**: Native Apple Wallet passes with full control

Old code removed:
- `/app/api/customer/wallet-pass/route.ts` (replaced)
- `/components/customer/AddToWalletButton.tsx` (replaced)
- Alpine IQ wallet URL generation logic

---

## Next Steps

Once basic setup is complete:

1. **Customize Pass Design**: Work with design team on pass layout
2. **Add Location Support**: Enable location-based notifications near stores
3. **Implement Campaigns**: Send push notifications for promotions
4. **Analytics Dashboard**: Build detailed insights on pass usage
5. **Google Wallet**: Add Google Wallet support (similar architecture)

---

## Questions?

For implementation support, contact your development team or refer to the Apple Wallet Developer Documentation.

**System Version**: 1.0.0
**Last Updated**: November 2025
