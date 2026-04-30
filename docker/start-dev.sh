#!/bin/bash
# ============================================
# Start Development Environment
# ============================================
# Menjalankan MySQL + FreeRADIUS via Docker
# dan Laravel + Frontend di host
#
# Usage: ./docker/start-dev.sh

set -e

echo "🚀 Starting RadiusBill Development Environment"
echo "================================================"
echo ""

# 1. Start Docker containers
echo "1️⃣  Starting Docker containers (MySQL + FreeRADIUS)..."
docker compose up -d
echo "   ✅ Containers started"
echo ""

# 2. Wait for MySQL to be ready
echo "2️⃣  Waiting for MySQL to be ready..."
until docker exec radius-mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
    printf "."
    sleep 2
done
echo ""
echo "   ✅ MySQL is ready"
echo ""

# 3. Run migrations
echo "3️⃣  Running Laravel migrations & seed..."
php artisan migrate:fresh --seed --force
echo "   ✅ Database migrated & seeded"
echo ""

# 4. Show info
echo "================================================"
echo "✅ Development environment is ready!"
echo ""
echo "📋 Services:"
echo "   MySQL:      localhost:3306 (root/root)"
echo "   FreeRADIUS: localhost:1812/udp"
echo "   Database:   radius"
echo ""
echo "🚀 Start Laravel:"
echo "   php artisan serve"
echo ""
echo "🖥️  Start Frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "🔐 Login Credentials:"
echo "   Staff:  admin / password"
echo "   Client: 1985000001 (tanpa password)"
echo ""
echo "🧪 Test RADIUS:"
echo "   ./docker/test-radius.sh"
echo "================================================"
