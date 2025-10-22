# 📧 Supabase Email Setup Instructions

## ✅ Current Status

**Supabase emails ARE configured and working!**
- Test email sent successfully
- Using Supabase's built-in email service
- Emails may go to spam folder

---

## 🎨 Apply Custom Email Template

### Step 1: Go to Supabase Dashboard

1. Visit: https://supabase.com/dashboard
2. Select your project: `uaednwpxursknmwdeejn`
3. Click **Authentication** in the left sidebar
4. Click **Email Templates**

### Step 2: Customize "Reset Password" Template

1. Click on **"Reset Password"** template
2. **Replace the entire HTML** with the contents of:
   ```
   email-templates/vendor-welcome.html
   ```
3. Make sure to keep the `{{ .ConfirmationURL }}` variable
4. Click **Save**

---

## 📋 Email Template Features

Our custom template includes:
- ✅ Black/dark theme matching your brand
- ✅ Clean, professional design
- ✅ "Set Your Password" CTA button
- ✅ Feature list (Product Management, Inventory, etc.)
- ✅ Mobile-responsive
- ✅ FloraDistro branding

---

## ⚠️ Why Emails May Not Be Received

### Common Issues:

1. **Spam Folder** 
   - Check spam/junk folder
   - Mark as "Not Spam" to whitelist

2. **Gmail Promotions Tab**
   - Check "Promotions" category in Gmail
   - Drag to Primary inbox

3. **Email Rate Limits**
   - Supabase limits: 4 emails/hour per user
   - If testing multiple times, you may hit limit
   - Wait 1 hour and try again

4. **Email Delay**
   - Emails can take 1-2 minutes to arrive
   - Be patient after creating vendor

---

## 🔧 Configure Custom SMTP (Optional - For Production)

For better deliverability in production, use SendGrid:

### SendGrid Configuration:

```
Sender email: noreply@floradistro.com
Sender name: FloraDistro

Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key starting with SG.]
Minimum interval: 1 second
```

### Steps:

1. **Get SendGrid API Key:**
   - Go to: https://signup.sendgrid.com/
   - Sign up (FREE tier: 100 emails/day)
   - Settings → API Keys → Create API Key
   - Copy the key (starts with `SG.`)

2. **Add to Supabase:**
   - Supabase Dashboard → Authentication → SMTP Settings
   - Enable Custom SMTP
   - Fill in values above
   - Paste your API key in Password field
   - Save

3. **Verify Domain (Optional but Recommended):**
   - SendGrid → Settings → Sender Authentication
   - Verify your domain (floradistro.com)
   - Improves deliverability

---

## ✅ Current Vendor Creation Flow

When you create a vendor in `/admin/vendors`:

1. ✅ Vendor created in Supabase (instant)
2. ✅ Auth account created
3. ✅ User profile created (vendor_owner role)
4. ✅ Default warehouse location created
5. ✅ **Password reset email sent to vendor**
6. ✅ Vendor receives email with "Set Your Password" link
7. ✅ Vendor clicks link → Sets password → Can login

**Email Subject:** "Reset Your Password"
**Email Contains:** Link to set password + dashboard access info

---

## 🧪 Test Email Sending

To verify emails are working, check the server logs when creating a vendor. You should see:

```
📧 Sending password reset email to: vendor@example.com
✅ Password reset email sent successfully to: vendor@example.com
```

If you see an error instead, the email configuration needs to be fixed in Supabase Dashboard.

---

## 🚀 Quick Fix for Right Now

1. **Create vendor** in `/admin/vendors`
2. **Check vendor's spam folder** for "Reset Your Password" email
3. If not there after 2-3 minutes:
   - Go to Supabase Dashboard → Authentication → Users
   - Find the vendor's email
   - Click "..." → "Send password reset email"
   - Email will be sent manually

---

## 📧 For Production Deployment

**Set this environment variable in Vercel:**

```
NEXT_PUBLIC_SITE_URL=https://floradistro.com
```

This ensures password reset links point to your live domain instead of localhost!

---

**Bottom line:** Emails ARE working (my test proved it). Vendors likely need to check spam folder. For production, set up SendGrid SMTP for better deliverability.

