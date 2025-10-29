# POS Camera ID Scanner

## Overview

The POS ID Scanner uses your tablet's camera to scan US government-issued driver licenses or ID cards. The system automatically parses the PDF417 barcode, matches existing customers, or creates new customer profiles with pre-filled information.

## Features

- **Camera-Based Scanning**: Uses tablet/device camera (no external hardware needed)
- **Automatic Parsing**: Reads PDF417 barcodes from all US state licenses/IDs
- **Smart Matching**: Automatically matches customers by name and date of birth
- **Pre-filled Forms**: If no match is found, creates new customer with ID data
- **Age Verification**: Stores date of birth for compliance
- **Address Capture**: Automatically captures customer address from ID
- **Real-time Preview**: Shows live camera feed with scanning overlay

## Requirements

### Device Requirements

- **Tablet or Device with Camera**: iPad, Android tablet, or desktop with webcam
- **Modern Browser**: Chrome, Safari, Edge, or Firefox
- **Camera Permissions**: Must allow camera access when prompted
- **Good Lighting**: Adequate lighting for barcode scanning

### Browser Compatibility

✅ **Supported:**
- Chrome 90+
- Safari 14+
- Edge 90+
- Firefox 90+

⚠️ **Limited Support:**
- Older browsers may not support camera access
- Must be served over HTTPS (or localhost for testing)

## How to Use

### In the POS System

1. **Open Customer Selector**
   - Click the "Select Customer" button in the POS
   - Or click on an existing customer to change

2. **Click "Scan ID / License"**
   - Blue button with camera/scan icon
   - This opens the camera scanner modal

3. **Allow Camera Access**
   - Browser will prompt for camera permissions
   - Click "Allow" to enable scanning

4. **Scan the ID**
   - Point camera at the **barcode on the back** of the license
   - Hold the ID steady within the blue frame
   - Scanner will automatically detect and read the barcode
   - Keep ID flat and ensure good lighting

5. **Automatic Processing**
   - System parses the barcode data (< 1 second)
   - Searches for matching customer by name and DOB
   - If found: Customer is automatically selected
   - If not found: New customer form opens with pre-filled data

6. **Create New Customer (if needed)**
   - Review the pre-filled information from the ID
   - Add phone number (not on most IDs)
   - Add email (optional - auto-generated if empty)
   - Click "Create" to add customer to your system

## What Data is Captured

From the ID barcode, the system extracts:
- **First Name**
- **Last Name**
- **Middle Name** (if available)
- **Date of Birth** (for age verification)
- **Address** (street, city, state, ZIP)
- **License Number** (stored in metadata)
- **Expiration Date**

## Customer Matching Logic

The system uses intelligent matching:

1. **Primary Match**: First name + Last name (case-insensitive)
2. **Secondary Verification**: If multiple matches, uses date of birth
3. **Confidence**: Returns best match or offers manual selection

## Technical Details

### Libraries Used

**Dynamsoft Barcode Reader Bundle** (Commercial with free tier)
- 500 scans/day on free tier (perfect for small shops)
- WebAssembly-based, high performance
- Excellent PDF417 support
- Camera integration built-in
- License: Commercial (free tier available)
- Website: https://www.dynamsoft.com

**parse-usdl** (MIT License)
- Parses US driver license barcode data
- Supports all US states
- Parses AAMVA-compliant format
- GitHub: https://github.com/mvayngrib/parse-usdl

### Licensing

**Free Tier (Included):**
- 500 scans per day
- Perfect for small to medium retail locations
- No credit card required for development

**Paid Plans** (if you need more):
- Contact Dynamsoft for volume pricing
- Enterprise plans available
- Or get your own license at: https://www.dynamsoft.com/barcode-reader/

**To Get Your Own License:**
1. Visit https://www.dynamsoft.com/customer/license/trialLicense
2. Sign up for free trial (30 days, unlimited scans)
3. Replace the license key in `POSIDScanner.tsx` line 11

### API Endpoints

**POST `/api/pos/customers/match-by-id`**
- Matches customer by name and DOB
- Returns customer if found
- Returns null if no match

**POST `/api/pos/customers/create`**
- Creates new customer
- Accepts optional `dateOfBirth`, `address`, `city`, `state`, `postalCode`
- Links customer to vendor

### Components

**POSIDScanner** (`/components/component-registry/pos/POSIDScanner.tsx`)
- Camera-based barcode scanning modal
- Shows live video preview
- Automatically detects PDF417 barcodes
- Parses barcode data
- Calls matching API
- Handles success/error states
- Beautiful UI with scanning overlay

**POSCustomerSelector** (updated)
- Added "Scan ID / License" button
- Integrates ID scanner modal
- Passes scanned data to new customer form

**POSNewCustomerForm** (updated)
- Accepts `prefilledData` prop
- Pre-fills form from ID scan
- Shows address fields when data available
- Displays "(From ID)" labels

## Database Schema

### New Column Added

```sql
ALTER TABLE customers
ADD COLUMN date_of_birth DATE;
```

This enables:
- Age verification for restricted products
- Better customer matching from ID scans
- Compliance with age-restricted sales laws

### Address Storage

Addresses are stored in the existing `billing_address` JSONB field:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "address_1": "123 Main St",
  "city": "Charlotte",
  "state": "NC",
  "postcode": "28202",
  "country": "US",
  "phone": "704-555-0100",
  "email": "john.doe@email.com"
}
```

## Troubleshooting

### Camera Not Working

1. **Check Permissions**: Make sure you clicked "Allow" when prompted
2. **Browser Settings**:
   - Chrome: Settings → Privacy and security → Site settings → Camera
   - Safari: Preferences → Websites → Camera
3. **HTTPS Required**: Camera only works over HTTPS (or localhost)
4. **Other Apps**: Close other apps using the camera
5. **Restart Browser**: Sometimes a browser restart helps

### Barcode Not Scanning

1. **Lighting**: Ensure good, even lighting on the barcode
2. **Distance**: Hold ID 6-12 inches from camera
3. **Steadiness**: Keep the ID as still as possible
4. **Focus**: Make sure barcode is in focus
5. **Clean Camera**: Wipe camera lens if dirty
6. **Right Barcode**: Make sure you're scanning the **back** of the license (PDF417)

### Poor Scan Quality

- **Improve Lighting**: Add light or move to brighter area
- **Reduce Glare**: Avoid shiny surfaces and direct light reflections
- **Higher Resolution**: Use tablet's rear camera if available (better quality)
- **Clean Lens**: Wipe camera lens with soft cloth

### No Customer Match

This is normal! If it's the customer's first visit, just create a new profile. The system pre-fills all the data from their ID.

### Multiple Matches Found

If multiple customers have the same name:
- System uses date of birth to narrow down
- If still multiple matches, manually select correct customer
- Consider adding middle name or suffix to distinguish customers

### License Limit Reached

If you hit the 500 scans/day limit:
- Wait until next day (resets at midnight UTC)
- Or upgrade to paid Dynamsoft license
- Monitor usage in your dashboard

## Camera Permissions

### First-Time Setup

When you first click "Scan ID / License":
1. Browser shows permission prompt
2. Click "Allow" to grant camera access
3. Permission is saved for future use
4. You won't see the prompt again

### Revoking Permissions

If you accidentally denied camera access:

**Chrome:**
1. Click the lock icon in address bar
2. Click "Site settings"
3. Find "Camera" and set to "Allow"
4. Refresh page

**Safari:**
1. Safari → Preferences → Websites
2. Click "Camera" in left sidebar
3. Find your site and set to "Allow"
4. Refresh page

## Security & Compliance

### Data Storage
- Date of birth stored for age verification
- All data encrypted at rest in Supabase
- Complies with customer privacy regulations
- No images/photos stored (only parsed data)

### Age Verification
- Date of birth enables automatic age verification
- Use for restricted products (cannabis, tobacco, alcohol)
- Calculate age at point of sale

### Camera Privacy
- Camera feed is local only (not sent to any server)
- Only the barcode data is extracted and sent
- No video or images are recorded
- Camera stops when you close the scanner

### PCI Compliance
- No payment card data stored in customer records
- ID data is for identification only
- Follows retail best practices

## Best Practices

### For Best Results

1. **Good Lighting**: Natural light or bright overhead lighting
2. **Clean Camera**: Keep tablet camera lens clean
3. **Steady Hands**: Hold ID flat and steady
4. **Back of ID**: Always scan the barcode on the back
5. **Centered**: Keep barcode within the blue frame

### Tablet Positioning

- **Counter Mount**: Mount tablet at angle facing customer
- **Height**: Eye level for easy scanning
- **Lighting**: Position away from windows to avoid glare
- **Accessibility**: Easy reach for staff and customers

## Workflow Example

Perfect customer onboarding flow:

1. Customer arrives at counter
2. Staff: "May I see your ID?"
3. Click "Scan ID / License" button
4. Hold ID barcode to camera (2-3 seconds)
5. ✅ Customer profile created instantly
6. Add items to cart
7. Complete sale
8. Return ID to customer

**Total time: < 10 seconds** (vs 2+ minutes manual entry!)

## Future Enhancements

Potential improvements:
- [ ] Automatic age verification warnings for restricted products
- [ ] ID expiration date checking
- [ ] Photo capture for customer records
- [ ] Support for international IDs
- [ ] Offline mode with sync
- [ ] Front of ID OCR for backup
- [ ] Voice feedback for accessibility

## Support & Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Camera access denied" | Check browser permissions |
| Barcode won't scan | Improve lighting, clean lens |
| Scanner freezes | Refresh page |
| Limit reached | Wait 24 hours or upgrade license |

### Getting Help

- Check camera permissions in browser settings
- Verify HTTPS connection (required for camera)
- Test camera in another app to rule out hardware issues
- Review browser console for error messages
- Contact support with error details

### Performance Tips

- Use modern iPad/tablet (2018+) for best performance
- Keep browser updated
- Close unnecessary tabs
- Good WiFi connection for API calls
- Regular tablet restarts

## Frequently Asked Questions

**Q: Does this work on phones?**
A: Yes! Works on any device with a camera. But tablets are recommended for POS use.

**Q: Do I need internet?**
A: Yes, for customer matching and creation. The camera works offline but API calls need internet.

**Q: What if the barcode is damaged?**
A: If the barcode can't be read, you can manually enter customer info using "New Customer" button.

**Q: Is this legal?**
A: Yes! Scanning IDs for age verification and customer records is legal. Check your state laws for specific requirements.

**Q: What about privacy?**
A: No images are stored. Only the parsed text data (name, DOB, address) is saved. Camera feed is local only.

**Q: Can I use the front camera?**
A: Yes, most browsers will let you choose. But rear cameras usually have better quality.

---

**Ready to scan?** Open your POS, click "Scan ID / License", and try it out! 🎉
