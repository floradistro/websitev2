# Next.js Server Actions - Critical Guidelines

## ⚠️ IMPORTANT: Server Actions Run on the SERVER

Server Actions marked with `"use server"` execute on the Vercel/Node.js server, NOT in the browser.

### ❌ NEVER Do This in Server Actions:

```typescript
"use server";

export async function myAction() {
  const data = localStorage.getItem('key'); // ❌ CRASH!
  const user = window.currentUser;           // ❌ CRASH!
  document.querySelector('#el');             // ❌ CRASH!
  sessionStorage.setItem('x', 'y');          // ❌ CRASH!
}
```

**Why?** Server Actions run in Node.js which has no `window`, `document`, `localStorage`, etc.

### ✅ ALWAYS Do This Instead:

**Pass data FROM client TO server as parameters:**

```typescript
// CLIENT COMPONENT (page.tsx)
"use client";

export default function MyPage() {
  const userData = localStorage.getItem('user_data'); // ✅ Client-side OK
  const parsed = JSON.parse(userData);
  
  async function handleSubmit() {
    const formData = new FormData();
    formData.append('userId', parsed.id);     // ✅ Pass as parameter
    formData.append('email', parsed.email);   // ✅ Pass as parameter
    
    await myServerAction(formData);
  }
}

// SERVER ACTION (action.ts)
"use server";

export async function myServerAction(formData: FormData) {
  const userId = formData.get('userId');     // ✅ Receive parameter
  const email = formData.get('email');       // ✅ Receive parameter
  
  // Now use these values for server-side operations
  await updateDatabase(userId, email);
}
```

## Real Example from This Project

### ❌ BROKEN (Caused "localStorage is not defined"):

```typescript
// save-branding-action.ts
"use server";

import { updateVendorBranding } from '@/lib/wordpress';

export async function saveBranding(formData: FormData) {
  // This calls a function that uses localStorage internally ❌
  const result = await updateVendorBranding(data);
}

// lib/wordpress.ts
export async function updateVendorBranding(brandingData: any) {
  const vendorData = localStorage.getItem('vendor_data'); // ❌ CRASHES on server!
}
```

### ✅ FIXED:

```typescript
// page.tsx (CLIENT)
"use client";

export default function BrandingPage() {
  const { vendor } = useVendorAuth(); // ✅ Client component has vendor object
  
  async function handleSave() {
    const formData = new FormData();
    formData.append('vendorUserId', vendor.user_id); // ✅ Pass from client
    formData.append('vendorId', vendor.id);          // ✅ Pass from client
    // ...other data
    
    await saveBranding(formData);
  }
}

// save-branding-action.ts (SERVER)
"use server";

export async function saveBranding(formData: FormData) {
  const vendorUserId = formData.get('vendorUserId'); // ✅ Receive as param
  const vendorId = formData.get('vendorId');         // ✅ Receive as param
  
  // Use these IDs directly - no localStorage needed!
  await axios.put(`/api/customers/${vendorUserId}`, data);
}
```

## Quick Reference

### Server Actions CAN:
- ✅ Access environment variables (`process.env`)
- ✅ Make database queries
- ✅ Call external APIs
- ✅ Read/write files
- ✅ Use Node.js modules

### Server Actions CANNOT:
- ❌ Access `localStorage` / `sessionStorage`
- ❌ Access `window` / `document`
- ❌ Use browser-only APIs (fetch with CORS, geolocation, etc.)
- ❌ Access React hooks (`useState`, `useEffect`, `useContext`)
- ❌ Access client-side context values

## Best Practice: The Data Flow

```
┌─────────────────────┐
│  CLIENT COMPONENT   │
│  "use client"       │
│                     │
│  - Has vendor obj   │
│  - Has localStorage │
│  - Extract data     │
└──────────┬──────────┘
           │
           │ Pass via FormData/params
           ↓
┌─────────────────────┐
│  SERVER ACTION      │
│  "use server"       │
│                     │
│  - Receives params  │
│  - NO browser APIs  │
│  - DB/API calls     │
└─────────────────────┘
```

## Debugging Tip

If you see errors like:
- `localStorage is not defined`
- `window is not defined`
- `document is not defined`

**Check:** Is the code in a `"use server"` file or function?
**Fix:** Pass the data from client as parameters instead of accessing browser APIs.

## Related Files in This Project

- ✅ `app/vendor/branding/save-branding-action.ts` - Server Action (fixed)
- ✅ `app/vendor/branding/page.tsx` - Client Component (passes data)
- ⚠️ `lib/wordpress.ts` - Mixed (has localStorage - only call from client!)

---

**Last Updated:** October 19, 2025  
**Issue Fixed:** localStorage error in vendor branding save  
**Commit:** 2a37720
