# DejaVoo Terminal Setup - COMPLETE ✅

## Summary

Successfully configured DejaVoo P8 payment terminal for Flora Distro Charlotte location with full POS integration.

## Configuration Details

### Physical Terminal (iPOS Pays Dashboard)
- **TPN**: 253525983231
- **Register ID**: 4990101
- **Auth Key**: xaDMg7bN3f
- **IP Address**: 192.168.1.117
- **Port**: 9000
- **SPIN Mode**: Cloud ✓

### Whaletools Database Configuration

**Payment Processor:**
- ID: `8631264a-5a4c-42e7-ba33-512d9fdf3ce8`
- Name: "DejaVoo - Charlotte Terminal"
- Type: dejavoo
- Environment: production
- Status: Active & Default for Charlotte
- TPN: 253525983231
- Auth Key: xaDMg7bN3f
- Register ID: 4990101

**POS Register:**
- ID: `2ec3ab88-3a49-4cc3-b688-eeb7f69a2d56`
- Number: REG-CHA-002
- Name: Register 1
- Device: DejaVoo P8 - Charlotte
- Hardware Model: Dejavoo P8
- Location: Charlotte Central
- Status: Active
- Linked to Payment Processor: ✓

**Location:**
- ID: `c4eedafb-4050-4d2d-a6af-e164aad5d934`
- Name: Charlotte Central
- Vendor: Flora Distro

## Implementation Files Modified

### 1. Payment Processing API
**File**: `/app/api/pos/payment/process/route.ts`
- Already implemented with full DejaVoo support
- Handles: Sale, Refund, Void transactions
- Error handling for declined cards, timeouts, terminal errors
- Automatic transaction logging

### 2. POS Payment Component
**File**: `/components/component-registry/pos/POSPayment.tsx`
**Changes**:
- Added `locationId` and `registerId` props
- Implemented card payment integration with DejaVoo terminal
- Updated UI to show "Processing on terminal..." during transaction
- Added transaction result fields (transactionId, cardType, cardLast4)
- API call to `/api/pos/payment/process` for card payments

### 3. POS Register Page
**File**: `/app/pos/register/page.tsx`
**Changes**:
- Pass `locationId` and `registerId` to POSPayment component
- Ensures terminal communication uses correct location/register

### 4. Setup Script
**File**: `/scripts/setup-charlotte-dejavoo.ts`
- Created automated setup script for terminal configuration
- Successfully executed to configure Charlotte terminal

## How It Works

### Payment Flow

1. **Customer Checkout**:
   - Staff adds items to cart on POS
   - Clicks "Checkout"
   - Selects "CARD" payment method
   - Clicks "Complete"

2. **Terminal Communication**:
   - Whaletools sends payment request to `/api/pos/payment/process`
   - API retrieves payment processor for Register 1 (Charlotte)
   - Creates DejaVoo client with TPN `253525983231` and auth key
   - Sends transaction to SPIN Cloud API: `https://api.spinpos.net/v2/Payment/Sale`

3. **Physical Terminal**:
   - DejaVoo P8 terminal at `192.168.1.117:9000` receives transaction
   - Prompts customer to insert/tap card
   - Processes payment
   - Returns result to SPIN API

4. **Completion**:
   - Whaletools receives transaction result
   - Logs to `payment_transactions` table
   - Shows receipt with card details (type, last 4 digits, auth code)
   - Completes POS transaction

## Database Tables Used

### payment_processors
Stores DejaVoo terminal configuration and credentials

### pos_registers
Links register to payment processor

### payment_transactions
Logs all card transactions with full request/response data

### terminal_overview (View)
Combines terminal, processor, and location data for management UI

## API Endpoints

### Process Payment
```
POST /api/pos/payment/process
```
**Body**:
```json
{
  "locationId": "c4eedafb-4050-4d2d-a6af-e164aad5d934",
  "registerId": "2ec3ab88-3a49-4cc3-b688-eeb7f69a2d56",
  "amount": 10.50,
  "paymentMethod": "credit",
  "referenceId": "POS-1699123456789"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "transactionId": "uuid",
  "authorizationCode": "AUTH123",
  "cardType": "Visa",
  "cardLast4": "1234",
  "amount": 10.50,
  "receiptData": {...}
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Card declined",
  "isDeclined": true,
  "isTerminalError": false,
  "isTimeout": false
}
```

## Testing

### To Test Card Payment:

1. Open POS at `/pos/register`
2. Select "Charlotte Central" location
3. Select Register 1
4. Add items to cart
5. Click "Checkout"
6. Select "CARD" payment method
7. Click "Complete"
8. Follow prompts on physical DejaVoo terminal
9. Verify transaction completes and receipt shows card details

### Expected Behavior:

- ✅ Payment modal shows "Processing on terminal..."
- ✅ Physical terminal displays transaction prompt
- ✅ Customer inserts/taps card
- ✅ Terminal processes and returns to POS
- ✅ POS shows receipt with auth code, card type, last 4 digits
- ✅ Transaction logged in database

## Security Notes

- ✅ Credentials stored in database (consider encryption for production)
- ✅ API requires authentication
- ✅ Vendor/location isolation enforced
- ✅ No raw card data stored (only tokenized data)
- ✅ Full request/response logging for auditing

## Admin Management

### View/Edit Terminal:
Navigate to: `/vendor/terminals`

Features:
- View all registered terminals
- See DejaVoo configuration (TPN, Auth Key, Register ID)
- Activate/deactivate terminals
- Edit terminal settings
- View last active timestamp

### View/Edit Payment Processor:
Navigate to: `/vendor/payment-processors`

Features:
- View all payment processors
- Test connection to DejaVoo terminal
- Set default processor per location
- Edit processor credentials
- View environment (Production/Sandbox)

## Troubleshooting

### "Terminal not available" Error
- Check DejaVoo terminal is powered on
- Verify network connectivity (IP: 192.168.1.117)
- Confirm SPIN mode is enabled on terminal
- Check TPN and Auth Key are correct

### "Payment failed" Error
- Check payment processor is active and default
- Verify register is linked to payment processor
- Check locationId and registerId are being passed
- Review API logs for detailed error

### Transaction Timeout
- Default timeout is 2 minutes
- Can be adjusted in DejaVoo client configuration
- Check physical terminal for pending prompts

## Next Steps

1. ✅ Terminal configured in Whaletools
2. ✅ POS payment component updated
3. ✅ API integration complete
4. ⏳ Test with physical terminal
5. ⏳ Configure other locations (Salisbury, Blowing Rock)
6. ⏳ Set up EBT processing if needed

## Support

For issues with:
- **DejaVoo terminal hardware**: Contact iPOS Pays support
- **SPIN API**: Reference https://app.theneo.io/dejavoo/spin/spin-rest-api-methods
- **Whaletools integration**: Check this documentation

---

**Status**: ✅ READY FOR TESTING
**Date**: 2025-01-04
**Terminal**: DejaVoo P8 (253525983231)
**Location**: Charlotte Central
**Register**: Register 1
