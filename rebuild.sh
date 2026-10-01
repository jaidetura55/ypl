#!/usr/bin/env bash

# KawduLive Quick Rebuild & Restart Script
echo "------------------------------------------"
echo "🚀 Starting KawduLive Rebuild Process..."
echo "------------------------------------------"

echo "🛠️  Building Vite production bundle..."
npm run build

if command -v pm2 &> /dev/null; then
  echo "🔄 Reloading PM2 platform daemon in production mode..."
  pm2 restart kawdulive --update-env || pm2 start "npx tsx backend/server.js" --name "kawdulive" --env NODE_ENV=production
fi

if command -v nginx &> /dev/null; then
  if nginx -t &>/dev/null; then
    systemctl reload nginx 2>/dev/null || sudo systemctl reload nginx 2>/dev/null || true
  fi
fi

echo "------------------------------------------"
echo "✅ Rebuild & Restart Complete!"
echo "Visit: https://kawdulive.qzz.io"
echo "------------------------------------------"
