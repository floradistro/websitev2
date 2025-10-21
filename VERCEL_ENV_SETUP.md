# 🚀 VERCEL ENVIRONMENT VARIABLES SETUP

## ⚡ Critical Supabase Variables (MUST BE SET):

### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://uaednwpxursknmwdeejn.supabase.co
```
- **Scope:** Production, Preview, Development
- **Required:** ✅ YES

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTcyMzMsImV4cCI6MjA3NjU3MzIzM30.N8jPwlyCBB5KJB5I-XaK6m-mq88rSR445AWFJJmwRCg
```
- **Scope:** Production, Preview, Development
- **Required:** ✅ YES

### 3. SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI
```
- **Scope:** Production, Preview, Development
- **Required:** ✅ YES
- **⚠️ SENSITIVE:** Server-side only, never expose to client

---

## 🌐 Optional Variables (WordPress Legacy):

### 4. NEXT_PUBLIC_WORDPRESS_API_URL
```
https://api.floradistro.com
```
- **Required:** ⚠️ Optional (legacy support)

### 5. NEXT_PUBLIC_WORDPRESS_CONSUMER_KEY
```
ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
```
- **Required:** ⚠️ Optional (legacy support)

### 6. NEXT_PUBLIC_WORDPRESS_CONSUMER_SECRET
```
cs_38194e74c7ddc5d72b6c32c70485728e7e529678
```
- **Required:** ⚠️ Optional (legacy support)

### 7. NEXT_PUBLIC_SITE_URL
```
https://yourdomain.vercel.app
```
- **Scope:** Production, Preview, Development
- **Required:** ✅ YES
- **Note:** Update with your actual domain

---

## 📋 How to Add Environment Variables in Vercel:

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Navigate to your project**

3. **Go to Settings → Environment Variables**

4. **Add each variable:**
   - Click "Add New"
   - Enter the variable name
   - Paste the value
   - Select all environments (Production, Preview, Development)
   - Click "Save"

5. **Redeploy after adding all variables:**
   - Go to Deployments tab
   - Click "..." menu on latest deployment
   - Select "Redeploy"

---

## ✅ Verification Steps:

After deployment, verify the environment variables are working:

1. **Check Homepage:** Should load products from Supabase
2. **Check API Health:** `https://yourdomain.vercel.app/api/health`
3. **Check Admin Dashboard:** Should connect to Supabase
4. **Check Vendor Portal:** Should allow login via Supabase Auth

---

## 🚨 If Site is Blank/Not Loading:

**Most Common Issues:**

1. **Missing Supabase Variables**
   - ❌ Site will be completely blank
   - ✅ Fix: Add all 3 Supabase variables above

2. **Wrong Supabase URL/Keys**
   - ❌ API calls will fail silently
   - ✅ Fix: Double-check the values match exactly

3. **Service Role Key Not Set**
   - ❌ Server-side API routes will fail
   - ✅ Fix: Add SUPABASE_SERVICE_ROLE_KEY to all environments

4. **Need to Redeploy**
   - ❌ Changes don't take effect immediately
   - ✅ Fix: Redeploy after adding/changing env vars

---

## 🔍 Debug Commands (Local):

```bash
# Check all env variables are loaded
npm run dev

# Look for these in console:
# ✅ NEXT_PUBLIC_SUPABASE_URL: https://...
# ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJ...
```

---

## 📊 Current Status:

- ✅ Local Environment: Working
- ✅ Git Push: Complete
- ⏳ Vercel Deployment: In Progress
- ⏳ Environment Variables: **NEED TO BE ADDED**

---

## 🎯 Critical Next Steps:

1. Add all 3 Supabase environment variables to Vercel
2. Set NEXT_PUBLIC_SITE_URL to your production domain
3. Redeploy on Vercel
4. Test the live site

**Without these environment variables, the live site will not load any data!**

