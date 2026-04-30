#!/bin/bash

# FreeRADIUS Billing System - Quick Setup Script
# This script will setup the application automatically

echo "========================================="
echo "FreeRADIUS Billing System - Quick Setup"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Generate app key
echo ""
echo "🔑 Generating application key..."
php artisan key:generate

# Ask for database credentials
echo ""
echo "📊 Database Configuration"
echo "-------------------------"
read -p "Database name (default: radius): " DB_NAME
DB_NAME=${DB_NAME:-radius}

read -p "Database username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Database password: " DB_PASS
echo ""

# Update .env file
echo ""
echo "📝 Updating .env file..."
sed -i.bak "s/DB_DATABASE=.*/DB_DATABASE=$DB_NAME/" .env
sed -i.bak "s/DB_USERNAME=.*/DB_USERNAME=$DB_USER/" .env
sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
rm .env.bak
echo "✅ .env file updated"

# Create database
echo ""
echo "🗄️  Creating database..."
mysql -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "❌ Failed to create database. Please create it manually."
fi

# Run migrations
echo ""
echo "🚀 Running migrations..."
php artisan migrate --force

# Run seeders
echo ""
echo "🌱 Seeding database..."
php artisan db:seed --force

# Clear cache
echo ""
echo "🧹 Clearing cache..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear

echo ""
echo "========================================="
echo "✅ Setup completed successfully!"
echo "========================================="
echo ""
echo "📋 Default Credentials:"
echo "   Superadmin: admin@example.com / password"
echo "   NOC: noc@example.com / password"
echo ""
echo "🚀 To start the server, run:"
echo "   php artisan serve"
echo ""
echo "📚 Documentation:"
echo "   - README.md: Overview & usage"
echo "   - SETUP.md: Detailed setup guide"
echo "   - STRUCTURE.md: Application structure"
echo "   - SYSTEM_FLOW_THEORY.md: System flow & theory"
echo ""
echo "🎉 Happy coding!"
echo "========================================="
