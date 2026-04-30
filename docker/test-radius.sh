#!/bin/bash
# ============================================
# Test FreeRADIUS Connection
# ============================================
# Jalankan setelah docker compose up -d
# 
# Prerequisite: install radtest
#   Mac:   brew install freeradius-server
#   Linux: apt install freeradius-utils
#
# Usage: ./docker/test-radius.sh

echo "🔍 Testing FreeRADIUS..."
echo ""

# Check if containers are running
echo "1️⃣  Checking Docker containers..."
if docker compose ps | grep -q "radius-mysql.*running"; then
    echo "   ✅ MySQL container is running"
else
    echo "   ❌ MySQL container is NOT running"
    echo "   Run: docker compose up -d"
    exit 1
fi

if docker compose ps | grep -q "radius-server.*running"; then
    echo "   ✅ FreeRADIUS container is running"
else
    echo "   ❌ FreeRADIUS container is NOT running"
    echo "   Run: docker compose up -d"
    exit 1
fi

echo ""

# Check if radtest is available
if command -v radtest &> /dev/null; then
    echo "2️⃣  Testing RADIUS authentication..."
    echo "   Sending test request to localhost:1812..."
    echo ""
    
    # Test with a user from database (if exists)
    # radtest <username> <password> <server> <port> <secret>
    radtest budi-pppoe password 127.0.0.1 0 testing123
    
    echo ""
    if [ $? -eq 0 ]; then
        echo "   ✅ RADIUS authentication test completed!"
    else
        echo "   ⚠️  RADIUS test returned non-zero (user might not exist yet)"
        echo "   Run: php artisan migrate:fresh --seed"
    fi
else
    echo "2️⃣  radtest not found. Install it:"
    echo "   Mac:   brew install freeradius-server"
    echo "   Linux: apt install freeradius-utils"
    echo ""
    echo "   Or test via Docker:"
    echo "   docker exec radius-server radtest budi-pppoe password localhost 0 testing123"
fi

echo ""
echo "3️⃣  Testing from Docker container..."
docker exec radius-server radtest budi-pppoe password localhost 0 testing123 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Internal RADIUS test passed!"
else
    echo "   ⚠️  Internal test failed (user might not exist in DB yet)"
fi

echo ""
echo "============================================"
echo "📋 Summary:"
echo "   MySQL:      localhost:3306 (root/root, db: radius)"
echo "   FreeRADIUS: localhost:1812/udp (secret: testing123)"
echo "   Laravel:    php artisan serve"
echo "============================================"
