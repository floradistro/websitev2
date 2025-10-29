#!/bin/bash

# Add Environment Variables to Vercel
# Run this script after filling in the values below

echo "🚀 Adding environment variables to Vercel..."
echo ""

# OpenAI API Key (Get yours at: https://platform.openai.com/api-keys)
echo "Adding OPENAI_API_KEY..."
echo "YOUR_OPENAI_API_KEY_HERE" | vercel env add OPENAI_API_KEY production

# Alpine IQ API URL (fixed value)
echo "Adding ALPINEIQ_API_URL..."
echo "https://lab.alpineiq.com" | vercel env add ALPINEIQ_API_URL production

# Alpine IQ API Key
echo "Adding ALPINEIQ_API_KEY..."
echo "U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw" | vercel env add ALPINEIQ_API_KEY production

# Alpine IQ User ID (Flora Distro)
echo "Adding ALPINEIQ_USER_ID..."
echo "3999" | vercel env add ALPINEIQ_USER_ID production

echo ""
echo "✅ Environment variables added successfully!"
echo ""
echo "Next steps:"
echo "1. Redeploy your app: vercel --prod"
echo "2. Test production sync at: https://your-domain.com/api/vendor/marketing/alpineiq/sync-loyalty"
echo ""
echo "Or manage in Vercel Dashboard:"
echo "https://vercel.com/floradistro/whaletools/settings/environment-variables"

