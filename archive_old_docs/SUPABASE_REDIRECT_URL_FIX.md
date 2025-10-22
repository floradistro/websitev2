# Fix Supabase Redirect URLs for yachtclub.vip

**Issue:** Password reset emails redirect to localhost instead of yachtclub.vip  
**Solution:** Configure Supabase to use your live domain  
**Status:** .env.local updated, Supabase Dashboard config needed

---

## ✅ What Was Fixed

### 1. Environment Variable Updated
**File:** `.env.local`

Changed:
```bash
# Before
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# After
NEXT_PUBLIC_SITE_URL=https://yachtclub.vip
```

---

## 🔧 Configure Supabase Dashboard (Required)

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **URL Configuration**

### Step 2: Add yachtclub.vip to Redirect URLs

In the **"Redirect URLs"** section, add:

```
https://yachtclub.vip/reset-password
https://yachtclub.vip/auth/callback
https://yachtclub.vip/**
```

**Also keep localhost for development:**
```
http://localhost:3000/reset-password
http://localhost:3000/auth/callback
http://localhost:3000/**
```

### Step 3: Update Site URL

In **"Site URL"** field, set:
```
https://yachtclub.vip
```

### Step 4: Save Changes

Click **"Save"** at the bottom of the page

---

## 🌐 Configure Email Template Variables

### In Supabase Email Templates:

The password reset template uses `{{ .ConfirmationURL }}` which Supabase generates automatically.

To ensure it uses the correct domain:

1. Go to: **Authentication** → **Email Templates**
2. Click **"Reset Password"**
3. Verify the redirect URL in the template:
   ```html
   redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yachtclub.vip'}/reset-password`
   ```

---

## 🔄 Restart Your Dev Server

For the new environment variable to take effect:

```bash
# Stop current dev server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🧪 Test the Full Flow

### 1. Create a Test User

```
http://localhost:3000/admin/users (for local testing)
or
https://yachtclub.vip/admin/users (on production)
```

Create user with your real email

### 2. Check the Email

- Look for password reset email
- Click the link
- **Should redirect to:** `https://yachtclub.vip/reset-password`
- **Not:** `http://localhost:3000/reset-password`

### 3. Set Password

- Enter new password
- Confirm password
- Click "Set Password"

### 4. Login

- Should redirect to: `https://yachtclub.vip/vendor/login`
- Or: `https://yachtclub.vip/admin/login` (for admin users)

---

## 📋 Checklist

- [x] Updated `.env.local` with production URL
- [ ] Added redirect URLs in Supabase Dashboard
- [ ] Set Site URL in Supabase Dashboard  
- [ ] Saved changes in Supabase
- [ ] Restarted dev server (if testing locally)
- [ ] Tested email link redirects to yachtclub.vip
- [ ] Verified password reset works on production

---

## 🚀 Production vs Development

### Development (localhost:3000)
- Uses: `http://localhost:3000`
- For: Local testing
- Supabase needs both localhost AND production URLs

### Production (yachtclub.vip)
- Uses: `https://yachtclub.vip`
- For: Live site
- Primary redirect URL

**Both should be configured in Supabase** so you can test locally and deploy to production.

---

## 🔐 Security Notes

### HTTPS Required
- Production MUST use HTTPS
- Supabase enforces this for security
- Your yachtclub.vip already has SSL ✅

### Wildcard URLs
- `https://yachtclub.vip/**` allows all routes
- Supabase validates the domain
- Prevents redirect attacks

---

## 🐛 Troubleshooting

### "Invalid redirect URL" error

**Cause:** URL not whitelisted in Supabase

**Fix:**
1. Check Supabase Dashboard → Auth → URL Configuration
2. Make sure `https://yachtclub.vip/**` is listed
3. Save changes
4. Wait a few minutes for propagation

### Still redirecting to localhost

**Cause:** Environment variable not loaded

**Fix:**
1. Restart your dev server
2. Clear browser cache
3. Verify `.env.local` has correct URL
4. Check Supabase Dashboard Site URL setting

### Email link expired

**Cause:** Token expired (24 hour limit)

**Fix:**
1. Tokens expire after 24 hours for security
2. Create a new user or resend reset email
3. In Supabase Dashboard: Auth → Users → ... → Send password reset

---

## 📊 What Happens Now

### Email Link Format:

**Before:**
```
http://localhost:3000/reset-password?token=eyJhbGc...
```

**After:**
```
https://yachtclub.vip/reset-password?token=eyJhbGc...
```

### User Journey:

```
1. User created
   ↓
2. Email sent with yachtclub.vip link
   ↓
3. User clicks link
   ↓
4. Opens: https://yachtclub.vip/reset-password
   ↓
5. User sets password
   ↓
6. Redirects to: https://yachtclub.vip/vendor/login
   ↓
7. User logs in ✅
```

---

## ✨ Summary

✅ **Environment variable updated** to use yachtclub.vip  
⚠️ **Supabase Dashboard config needed** (see Step 1-4 above)  
🔄 **Restart dev server** to apply changes  
🧪 **Test email flow** to verify it works  

**Configure Supabase Dashboard now to complete the fix!**

---

**Next Step:** Go to Supabase Dashboard → Authentication → URL Configuration and add the redirect URLs listed above.

