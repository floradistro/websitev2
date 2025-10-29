# Quick Setup: Camera ID Scanner

## 🚀 Quick Start (2 minutes)

### Step 1: Apply Database Migration

Run this migration to add date_of_birth support:

```bash
# Option A: Via Supabase Dashboard
# Copy/paste the SQL from: supabase/migrations/20251029_add_customer_dob.sql

# Option B: Via psql (if you have access)
psql -h [your-supabase-host] -U postgres -d postgres -f supabase/migrations/20251029_add_customer_dob.sql
```

### Step 2: Test the Feature

1. Open your POS in a browser (must be HTTPS or localhost)
2. Go to customer selection
3. Click "Scan ID / License" button
4. Allow camera permissions when prompted
5. Test with a driver license!

## ✅ Requirements Checklist

- [x] Code deployed (already done!)
- [ ] Database migration applied
- [ ] HTTPS enabled (or using localhost)
- [ ] Device with camera (tablet/phone/webcam)
- [ ] Modern browser (Chrome 90+, Safari 14+)

## 📦 What Was Installed

### NPM Packages

```json
{
  "dynamsoft-barcode-reader-bundle": "^10.x",
  "parse-usdl": "^3.x"
}
```

### Components Created

- `POSIDScanner.tsx` - Camera scanner with live preview
- `/api/pos/customers/match-by-id` - Customer matching endpoint
- Migration: `20251029_add_customer_dob.sql`

### Components Updated

- `POSCustomerSelector.tsx` - Added scan button
- `POSNewCustomerForm.tsx` - Pre-fill from ID data
- `/api/pos/customers/create` - Accept DOB and address

## 🔑 Licensing

**Dynamsoft Free Tier** (included):
- 500 scans/day
- No credit card required
- Perfect for small shops

**Current License** (in code):
```
DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUi...
```

This is a demo license. For production:
1. Get your own at: https://www.dynamsoft.com/customer/license/trialLicense
2. Replace in `POSIDScanner.tsx` line 11

## 🎯 How Staff Will Use It

### Perfect Workflow

```
Customer at counter
       ↓
Click "Scan ID / License"
       ↓
Allow camera (first time only)
       ↓
Point camera at back of ID
       ↓
[Beep! Scanned in 2 seconds]
       ↓
Customer found OR Create new (pre-filled)
       ↓
Add to sale → Complete!
```

**Time savings**: 10 seconds vs 2+ minutes manual entry

## 🧪 Testing Tips

### Test Scenarios

1. **Existing Customer**
   - Scan an ID of someone already in your system
   - Should auto-match and select them
   - Verify their profile shows correct info

2. **New Customer**
   - Scan an ID of someone not in your system
   - Should show new customer form with pre-filled data
   - Review name, DOB, address from ID
   - Add phone/email
   - Create customer

3. **Error Handling**
   - Try scanning with poor lighting
   - Try scanning something that's not an ID
   - Verify error messages are clear

## 🔧 Troubleshooting

### Camera Won't Open

**Check:**
- Are you on HTTPS? (or localhost)
- Did you click "Allow" for camera?
- Is another app using the camera?
- Browser console for errors

**Fix:**
```bash
# Check browser permissions:
# Chrome: chrome://settings/content/camera
# Safari: Preferences → Websites → Camera
```

### Barcode Won't Scan

**Check:**
- Lighting (needs to be bright)
- Camera focus (hold steady 6-12 inches away)
- Right barcode (back of ID, not front)
- Camera lens clean

**Fix:**
- Add more light
- Clean camera lens
- Hold ID flatter
- Try different angle

### "Invalid barcode data"

This means:
- Not a PDF417 barcode (make sure it's the **back** of the license)
- Or barcode is damaged/unreadable

**Fix:**
- Verify you're scanning the correct barcode
- If damaged, use manual entry ("New Customer" button)

## 📊 Monitoring

### Usage Stats

Monitor your scanner usage:
- Dynamsoft dashboard: https://www.dynamsoft.com/customer/account
- Track daily scan count
- Get alerts before hitting limits

### Database Stats

Check customer creation rate:

```sql
-- Customers created via ID scan (have DOB)
SELECT COUNT(*)
FROM customers
WHERE date_of_birth IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days';

-- Total customer matches today
SELECT COUNT(*)
FROM customer_activity
WHERE activity_type = 'profile_update'
  AND created_at::date = CURRENT_DATE;
```

## 🚨 Common Issues

### Issue: "Camera access denied"
**Solution:** Browser settings → Allow camera for your domain

### Issue: Scanner freezes
**Solution:** Refresh page, camera will reinitialize

### Issue: Hit 500 scan limit
**Solution:** Wait 24 hours or upgrade license

### Issue: Poor scan quality
**Solution:** Better lighting + clean lens

## 📱 Device Recommendations

### Best Devices

**iPads:**
- iPad Pro (2018+) - Excellent camera
- iPad Air (4th gen+) - Great performance
- iPad (9th gen+) - Budget option

**Android Tablets:**
- Samsung Galaxy Tab S8/S9
- Lenovo Tab P11/P12
- Any tablet with 8MP+ rear camera

**Webcams (Desktop POS):**
- Logitech C920/C922
- Razer Kiyo
- Any 1080p webcam

### Settings

**Browser:** Chrome or Safari (latest version)
**Camera:** Use rear camera when available (better quality)
**Position:** Mount at angle for easy scanning
**Lighting:** LED desk lamp or overhead lighting

## 🔄 Updating

### To Update License Key

1. Get new license from Dynamsoft
2. Open `components/component-registry/pos/POSIDScanner.tsx`
3. Line 11: Replace the license string
4. Deploy changes

### To Update Scan Limits

Upgrade your Dynamsoft plan:
1. Visit https://www.dynamsoft.com/customer/license/fullLicense
2. Choose plan (1K, 10K, 100K scans/month)
3. Update license key in code
4. Deploy

## 📈 Next Steps

### Phase 2 Enhancements

Consider adding:
- [ ] Age verification alerts for restricted products
- [ ] ID expiration warnings
- [ ] Customer photo capture
- [ ] Analytics dashboard
- [ ] Staff training mode
- [ ] Multilingual support

### Integration Ideas

- Link to loyalty programs
- Birthday rewards automation
- Marketing email triggers
- Compliance reporting
- Age-gated product restrictions

## 🎓 Training Staff

### Quick Training Script

> "We have a new ID scanner! Here's how it works:
>
> 1. Click the blue 'Scan ID / License' button
> 2. Point the camera at the barcode on the BACK of their ID
> 3. Hold it steady for 2-3 seconds
> 4. The system will find their profile or create a new one
> 5. That's it! Much faster than typing everything in."

**Pro tip:** Practice with your own ID first!

## 💡 Best Practices

1. **Always ask permission** before scanning
2. **Scan the back** of the license (PDF417 barcode)
3. **Good lighting** = faster scans
4. **Hold steady** for 2-3 seconds
5. **Clean camera** regularly
6. **Privacy**: Never store ID images, only data

## 📞 Support

Need help?
- Check docs: `/docs/POS_ID_SCANNER.md`
- Browser console: Look for error messages
- Dynamsoft docs: https://www.dynamsoft.com/barcode-reader/docs/
- GitHub Issues: Report bugs

---

**Ready to roll?** Just apply the migration and start scanning! 🎉
