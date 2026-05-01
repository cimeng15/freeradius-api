#!/bin/bash

# Simple Deployment Script - No prompts
# Usage: bash deploy-simple.sh

set -e

echo "🚀 Starting simple deployment..."

# Build Frontend
echo "📦 Building frontend..."
cd frontend
[ ! -d "node_modules" ] && npm install
npm run build
cd ..

# Laravel Setup
echo "⚙️  Setting up Laravel..."
[ ! -d "vendor" ] && composer install --optimize-autoloader --no-dev

# Create .env if not exists
[ ! -f ".env" ] && cp .env.example .env && php artisan key:generate

# Database
echo "🗄️  Running migrations..."
php artisan migrate --force
php artisan db:seed --force

# Storage & Cache
echo "⚡ Optimizing..."
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Permissions
chmod -R 755 .
chmod -R 775 storage bootstrap/cache

echo "✅ Deployment completed!"
