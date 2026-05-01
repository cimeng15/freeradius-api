#!/bin/bash

# FreeRADIUS API - Deployment Script
# Usage: bash deploy.sh

set -e

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo -e "${RED}❌ Error: artisan file not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Step 1: Build Frontend
echo -e "\n${YELLOW}📦 Building frontend...${NC}"
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build frontend
npm run build

cd ..

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 2: Laravel Setup
echo -e "\n${YELLOW}⚙️  Setting up Laravel...${NC}"

# Install/update composer dependencies
if [ ! -d "vendor" ]; then
    echo "Installing composer dependencies..."
    composer install --optimize-autoloader --no-dev
else
    echo "Updating composer dependencies..."
    composer update --optimize-autoloader --no-dev
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your database credentials${NC}"
    read -p "Press enter to continue after editing .env..."
fi

# Generate app key if not set
if ! grep -q "APP_KEY=base64:" .env; then
    echo "Generating application key..."
    php artisan key:generate
fi

# Step 3: Database
echo -e "\n${YELLOW}🗄️  Setting up database...${NC}"
read -p "Run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan migrate --force
fi

read -p "Run seeders? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan db:seed --force
fi

# Step 4: Storage Link
echo -e "\n${YELLOW}🔗 Creating storage link...${NC}"
php artisan storage:link

# Step 5: Cache & Optimize
echo -e "\n${YELLOW}⚡ Optimizing application...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 6: Permissions (for production servers)
echo -e "\n${YELLOW}🔐 Setting permissions...${NC}"
chmod -R 755 .
chmod -R 775 storage bootstrap/cache

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    echo "Setting ownership to www:www..."
    chown -R www:www .
else
    echo -e "${YELLOW}⚠️  Not running as root. Skipping ownership change.${NC}"
    echo "If on production, run: sudo chown -R www:www ."
fi

# Step 7: Final checks
echo -e "\n${YELLOW}🔍 Running final checks...${NC}"

# Check if frontend is built
if [ -f "public/app/index.html" ]; then
    echo -e "${GREEN}✅ Frontend files found${NC}"
else
    echo -e "${RED}❌ Frontend files not found in public/app/${NC}"
fi

# Check if storage link exists
if [ -L "public/storage" ]; then
    echo -e "${GREEN}✅ Storage link exists${NC}"
else
    echo -e "${RED}❌ Storage link not found${NC}"
fi

# Check database connection
if php artisan migrate:status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection OK${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
fi

echo -e "\n${GREEN}🎉 Deployment completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Make sure your web server points to the 'public' directory"
echo "2. Ensure .env has correct database credentials"
echo "3. Test the application at your domain"
echo ""
echo -e "${YELLOW}For aaPanel:${NC}"
echo "- Site Path: /www/wwwroot/your-domain/freeradius-api"
echo "- Run Path: /www/wwwroot/your-domain/freeradius-api/public"
echo "- PHP Version: 8.1 or higher"
echo ""
