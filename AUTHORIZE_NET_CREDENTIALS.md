# Authorize.Net Credentials

## For Accept.js (Client-Side Tokenization)

**Public Client Key:**
```
2HCV7znwGcw3xFpnab492K4Ve7p7Us7HmSc5Wf28Uq5NsjTf22FLXezdC87RY7S8
```

**API Login ID:**
```
9SB8Rhk6Ljbu
```

**Environment:** Production

---

## Testing Accept.js

When Accept.js tokenizes with these credentials and you get:
- **"User authentication failed"** → Credentials are wrong or mismatched
- **Success** → Returns payment nonce token

---

## Double Check in Authorize.Net Dashboard

1. Go to: https://account.authorize.net/
2. Login to merchant interface
3. Go to: **Account → Settings → Security Settings → API Credentials & Keys**
4. Verify:
   - API Login ID matches: `9SB8Rhk6Ljbu`
   - Public Client Key matches: `2HCV7znwGcw3xFpnab492K4Ve7p7Us7HmSc5Wf28Uq5NsjTf22FLXezdC87RY7S8`

If they don't match, get the correct ones from Authorize.net and update the code.

---

## If Credentials Are Wrong

The error "User authentication failed" means Accept.js can't authenticate with Authorize.net using those credentials.

**Fix:**
1. Get correct Public Client Key from Authorize.net dashboard
2. Get correct API Login ID
3. Update in WordPress plugin settings
4. Update in `flora-order-ajax.php`

