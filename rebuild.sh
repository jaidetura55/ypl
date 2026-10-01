#!/usr/bin/env bash

# KawduLive Quick Rebuild & Restart Script
echo "------------------------------------------"
echo "🚀 Starting KawduLive Rebuild Process..."
echo "------------------------------------------"

echo "🛠️  Building Vite production bundle..."
npm run build

if command -v pm2 &> /dev/null; then
  echo "🔄 Reloading PM2 platform daemon..."
  pm2 restart kawdulive || pm2 start "npx tsx backend/server.js" --name "kawdulive"
fi

echo "------------------------------------------"
echo "✅ Rebuild & Restart Complete!"
echo "Visit: https://kawdulive.qzz.io"
echo "------------------------------------------"
