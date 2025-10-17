#!/bin/bash

# Deploy CORS fix to WordPress via SSH
echo "🚀 Deploying CORS fix to WordPress server..."
echo ""

# Server details - SiteGround
SERVER="gvam1142.siteground.biz"
SSH_USER="u2736-pgt6vpiklij1"
SSH_PORT="18765"
PLUGIN_DIR="~/public_html/wp-content/plugins/flora-cors-fix"

# Check if plugin file exists
if [ ! -f "flora-cors-fix.php" ]; then
    echo "❌ flora-cors-fix.php not found in current directory"
    exit 1
fi

echo "📋 Server: $SSH_USER@$SERVER"
echo "📁 Target: $PLUGIN_DIR"
echo ""

# Test SSH connection
echo "🔌 Testing SSH connection..."
if ! ssh -p $SSH_PORT -o ConnectTimeout=5 -o BatchMode=yes $SSH_USER@$SERVER "echo 'SSH connection successful'" 2>/dev/null; then
    echo ""
    echo "⚠️  SSH connection requires key authentication"
    echo ""
    echo "Continuing with SSH key..."
    echo ""
fi

# Create backup
echo "💾 Creating backup of current plugin..."
ssh -p $SSH_PORT $SSH_USER@$SERVER "cp $PLUGIN_DIR/flora-cors-fix.php $PLUGIN_DIR/flora-cors-fix.php.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

# Upload new plugin
echo "📤 Uploading new plugin file..."
scp -P $SSH_PORT flora-cors-fix.php $SSH_USER@$SERVER:$PLUGIN_DIR/flora-cors-fix.php

if [ $? -eq 0 ]; then
    echo "✅ Plugin uploaded successfully!"
    
    # Set proper permissions
    echo "🔐 Setting file permissions..."
    ssh -p $SSH_PORT $SSH_USER@$SERVER "chmod 644 $PLUGIN_DIR/flora-cors-fix.php"
    
    # Clear PHP OpCache via WordPress CLI if available
    echo "🗑️  Clearing caches..."
    ssh -p $SSH_PORT $SSH_USER@$SERVER "cd ~/public_html && wp cache flush 2>/dev/null || echo 'Cache clear skipped (not critical)'"
    
    echo ""
    echo "✅ DEPLOYMENT COMPLETE!"
    echo ""
    echo "🔄 Next steps:"
    echo "1. Go to WordPress Admin: https://api.floradistro.com/wp-admin"
    echo "2. Go to Plugins → Installed Plugins"
    echo "3. Deactivate 'Flora CORS Fix'"
    echo "4. Activate 'Flora CORS Fix'"
    echo ""
    echo "🧪 Verify with: ./verify-cors.sh"
    
else
    echo ""
    echo "❌ Upload failed!"
    echo ""
    echo "Try manual upload:"
    echo "1. SSH: ssh $SSH_USER@$SERVER"
    echo "2. Navigate: cd $PLUGIN_DIR"
    echo "3. Edit file: nano flora-cors-fix.php"
    echo "4. Paste the contents from your local flora-cors-fix.php"
    exit 1
fi

