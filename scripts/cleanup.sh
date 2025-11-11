#!/bin/bash

# Whaletools Cleanup Script
# Removes build artifacts, caches, and temporary files to free up disk space

set -e  # Exit on error

echo "🧹 Whaletools Cleanup Script"
echo "=============================="
echo ""

# Function to get directory size
get_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | awk '{print $1}'
    else
        echo "N/A"
    fi
}

# Function to delete directory with confirmation
delete_dir() {
    local dir=$1
    local name=$2
    local size=$(get_size "$dir")

    if [ -d "$dir" ]; then
        echo "📁 $name: $size"
        rm -rf "$dir"
        echo "   ✅ Deleted"
    else
        echo "📁 $name: Not found (already clean)"
    fi
}

# Get initial size
INITIAL_SIZE=$(du -sh . 2>/dev/null | awk '{print $1}')
echo "📊 Current folder size: $INITIAL_SIZE"
echo ""

# Cleanup operations
echo "🗑️  Cleaning build artifacts..."
echo ""

# Next.js build cache
delete_dir ".next" "Next.js build cache (.next)"

# TypeScript build info
if [ -f "tsconfig.tsbuildinfo" ]; then
    SIZE=$(du -sh "tsconfig.tsbuildinfo" 2>/dev/null | awk '{print $1}')
    echo "📁 TypeScript build info: $SIZE"
    rm -f "tsconfig.tsbuildinfo"
    echo "   ✅ Deleted"
else
    echo "📁 TypeScript build info: Not found (already clean)"
fi

# Playwright reports
delete_dir "playwright-report" "Playwright reports"
delete_dir "test-results" "Test results"

# Agent node_modules (optional)
echo ""
read -p "🤔 Delete ai-agent/node_modules (130MB)? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    delete_dir "ai-agent/node_modules" "AI Agent dependencies"
fi

read -p "🤔 Delete mcp-agent/node_modules (76MB)? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    delete_dir "mcp-agent/node_modules" "MCP Agent dependencies"
fi

# Nuclear option
echo ""
read -p "⚠️  Nuclear option: Delete main node_modules (946MB)? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    delete_dir "node_modules" "Main dependencies"
    echo ""
    echo "⚠️  You'll need to run 'npm install' to reinstall dependencies"
fi

# Get final size
echo ""
FINAL_SIZE=$(du -sh . 2>/dev/null | awk '{print $1}')
echo "=============================="
echo "✅ Cleanup complete!"
echo ""
echo "📊 Before:  $INITIAL_SIZE"
echo "📊 After:   $FINAL_SIZE"
echo ""
echo "💡 Tip: Run 'npm run dev:fresh' to rebuild with a clean cache"
echo "💡 Tip: Run this script monthly to keep your project lean"
