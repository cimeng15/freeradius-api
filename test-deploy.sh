#!/bin/bash

# Test Deployment Script
# Usage: bash test-deploy.sh

set -e

echo "🧪 Testing deployment setup..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo -e "${RED}❌ Error: artisan file not found${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Checking requirements...${NC}"

# Check PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
    echo -e "${GREEN}✅ PHP $PHP_VERSION found${NC}"
else
    echo -e "${RED}❌ PHP not found${NC}"
    exit 1
fi

# Check Composer
if command -v composer &> /dev/null; then
    echo -e "${GREEN}✅ Composer found${NC}"
else
    echo -e "${RED}❌ Composer not found${NC}"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION found${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check NPM
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ NPM $NPM_VERSION found${NC}"
else
    echo -e "${RED}❌ NPM not found${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Testing frontend build...${NC}"

# Test frontend build
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Building frontend..."
npm run build

if [ -f "../public/app/index.html" ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
    echo "   Output: public/app/index.html"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

cd ..

echo -e "\n${YELLOW}Testing Laravel setup...${NC}"

# Test composer install
if [ ! -d "vendor" ]; then
    echo "Installing composer dependencies..."
    composer install
fi

# Check .env
if [ ! -f ".env" ]; then
    echo "Creating .env from example..."
    cp .env.example .env
    php artisan key:generate
fi

# Test artisan commands
echo "Testing artisan commands..."
php artisan --version > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Laravel working${NC}"
else
    echo -e "${RED}❌ Laravel not working${NC}"
    exit 1
fi

# Check routes
echo -e "\n${YELLOW}Checking routes...${NC}"
php artisan route:list | grep -q "api/"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API routes found${NC}"
else
    echo -e "${RED}❌ API routes not found${NC}"
fi

php artisan route:list | grep -q "/{any}"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Web catch-all route found${NC}"
else
    echo -e "${RED}❌ Web catch-all route not found${NC}"
fi

# Check storage link
echo -e "\n${YELLOW}Checking storage link...${NC}"
if [ -L "public/storage" ]; then
    echo -e "${GREEN}✅ Storage link exists${NC}"
else
    echo -e "${YELLOW}⚠️  Storage link not found, creating...${NC}"
    php artisan storage:link
fi

# Check permissions
echo -e "\n${YELLOW}Checking permissions...${NC}"
if [ -w "storage" ] && [ -w "bootstrap/cache" ]; then
    echo -e "${GREEN}✅ Directories are writable${NC}"
else
    echo -e "${YELLOW}⚠️  Some directories may not be writable${NC}"
fi

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}Project structure:${NC}"
echo "  ✅ Frontend built: public/app/"
echo "  ✅ Laravel ready: vendor/"
echo "  ✅ Storage linked: public/storage"
echo "  ✅ Routes configured"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Configure .env with your database credentials"
echo "2. Run: php artisan migrate --seed"
echo "3. Start server: php artisan serve"
echo "4. Visit: http://localhost:8000"

echo -e "\n${YELLOW}For production deployment:${NC}"
echo "  bash deploy-simple.sh"
