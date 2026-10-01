#!/bin/bash

# YoungPapi Live Rebuild Script
# This script performs a clean installation of dependencies and builds the project.

echo "------------------------------------------"
echo "🚀 Starting Rebuild Process..."
echo "------------------------------------------"

# Optional: Clear node_modules for a completely fresh start
# echo "📦 Cleaning node_modules..."
# rm -rf node_modules
# rm package-lock.json

echo "📥 Installing dependencies..."
npm install

echo "🛠️  Building the application..."
npm run build

echo "------------------------------------------"
echo "✅ Rebuild Complete!"
echo "------------------------------------------"
