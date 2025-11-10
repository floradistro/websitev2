# Admin Authentication Setup Guide

## Overview

The admin authentication system uses bcrypt-hashed passwords stored in environment variables for maximum security.

## Initial Setup

### 1. Generate Password Hashes

Run the password hash generator:

```bash
npm run generate:admin-hash
```

This will prompt you to enter a password (minimum 12 characters) and output a bcrypt hash.

### 2. Configure Environment Variables

Add these to your `.env.local` file (NEVER commit this file):

```bash
# Admin user (full access)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<hash-generated-in-step-1>

# Read-only user (view-only access)
READONLY_USERNAME=readonly
READONLY_PASSWORD_HASH=<hash-generated-in-step-1>
```

### 3. Restart Your Development Server

```bash
npm run dev
```

## Security Best Practices

✅ **DO:**

- Use strong passwords (12+ characters with mixed case, numbers, symbols)
- Keep `.env.local` in `.gitignore` (already configured)
- Rotate passwords regularly
- Use different passwords for each environment (dev, staging, production)

❌ **DON'T:**

- Never commit `.env.local` to git
- Never share password hashes publicly
- Never use the old hardcoded passwords in production
- Never reuse passwords across environments

## Production Deployment

For production environments (Vercel, AWS, etc.):

1. Generate new production passwords
2. Add environment variables in your hosting platform's dashboard
3. Never use development credentials in production

### Vercel Example:

```
Project Settings → Environment Variables
→ Add ADMIN_USERNAME
→ Add ADMIN_PASSWORD_HASH
→ Add READONLY_USERNAME
→ Add READONLY_PASSWORD_HASH
```

## Migration from Old System

The old hardcoded password system has been removed. If you're upgrading:

1. Run `npm run generate:admin-hash` for each user
2. Add the hashes to `.env.local`
3. Test login before deploying

## Troubleshooting

### "Admin authentication not configured" error

- Check that all four environment variables are set in `.env.local`
- Restart your dev server after adding variables

### "Invalid credentials" error

- Verify the password hash was generated correctly
- Check for typos in `.env.local`
- Ensure the username matches exactly (case-sensitive)

## Advanced: Adding More Admin Users

To add additional admin users, modify `app/api/admin/login/route.ts`:

```typescript
// Add new user configuration
if (
  process.env.CUSTOM_ADMIN_USERNAME &&
  process.env.CUSTOM_ADMIN_PASSWORD_HASH
) {
  users.push({
    username: process.env.CUSTOM_ADMIN_USERNAME,
    passwordHash: process.env.CUSTOM_ADMIN_PASSWORD_HASH,
    role: "admin", // or 'readonly'
    name: "Custom Admin",
  });
}
```

Then add the corresponding environment variables.
