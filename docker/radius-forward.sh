#!/bin/bash
# ============================================
# RADIUS UDP Forwarder (Mac Docker workaround)
# ============================================
# Docker Desktop di Mac tidak forward UDP ke LAN IP dengan benar.
# Script ini menggunakan socat untuk forward UDP dari LAN IP ke Docker.
#
# Jalankan: ./docker/radius-forward.sh
# Stop: ./docker/radius-forward.sh stop
# ============================================

# Get Mac's LAN IP
LAN_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ "$1" = "stop" ]; then
    echo "Stopping RADIUS forwarders..."
    pkill -f "socat.*UDP4-LISTEN.*1812" 2>/dev/null
    pkill -f "socat.*UDP4-LISTEN.*1813" 2>/dev/null
    echo "Stopped."
    exit 0
fi

echo "🔄 Starting RADIUS UDP Forwarder"
echo "   LAN IP: $LAN_IP"
echo "   Auth:   $LAN_IP:1812 → 127.0.0.1:1812 (Docker)"
echo "   Acct:   $LAN_IP:1813 → 127.0.0.1:1813 (Docker)"
echo ""

# Kill existing
pkill -f "socat.*UDP4-LISTEN.*1812" 2>/dev/null
pkill -f "socat.*UDP4-LISTEN.*1813" 2>/dev/null
sleep 1

# Start forwarders
socat UDP4-LISTEN:1812,bind=$LAN_IP,fork,reuseaddr UDP4:127.0.0.1:1812 &
AUTH_PID=$!

socat UDP4-LISTEN:1813,bind=$LAN_IP,fork,reuseaddr UDP4:127.0.0.1:1813 &
ACCT_PID=$!

sleep 1

echo "✅ Forwarders started!"
echo "   Auth PID: $AUTH_PID"
echo "   Acct PID: $ACCT_PID"
echo ""
echo "   Mikrotik RADIUS config:"
echo "   /radius add address=$LAN_IP secret=radius123 service=ppp"
echo ""
echo "   Stop: ./docker/radius-forward.sh stop"
echo "   Or:   pkill -f socat"
echo ""
echo "Waiting... (Ctrl+C to stop)"

# Wait for both processes
wait $AUTH_PID $ACCT_PID
