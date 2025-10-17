#!/bin/bash

# Upload CORS plugin to WordPress server
# Update these variables with your actual server details:

SERVER_USER="your-username"
SERVER_HOST="api.floradistro.com"
PLUGIN_PATH="/var/www/html/wp-content/plugins/flora-cors-fix"

echo "🚀 Uploading Flora CORS Fix plugin to WordPress..."
echo "📍 Target: $SERVER_USER@$SERVER_HOST:$PLUGIN_PATH"
echo ""
echo "⚠️  IMPORTANT: Update SERVER_USER in this script first!"
echo ""
read -p "Have you updated the SERVER_USER variable? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled. Please edit this script and set SERVER_USER first."
    exit 1
fi

# Upload the plugin file
echo "📤 Uploading flora-cors-fix.php..."
scp flora-cors-fix.php $SERVER_USER@$SERVER_HOST:$PLUGIN_PATH/flora-cors-fix.php

if [ $? -eq 0 ]; then
    echo "✅ Plugin uploaded successfully!"
    echo ""
    echo "🔄 Next steps:"
    echo "1. Log in to WordPress admin"
    echo "2. Go to Plugins → Installed Plugins"
    echo "3. Deactivate 'Flora CORS Fix'"
    echo "4. Activate 'Flora CORS Fix'"
    echo ""
    echo "🧪 Test with:"
    echo "./verify-cors.sh"
else
    echo "❌ Upload failed. Check your SSH credentials."
    exit 1
fi

