#!/bin/bash

# Mikrotik Auto Configuration Script
# This script generates Mikrotik configuration for RADIUS

echo "========================================="
echo "Mikrotik RADIUS Configuration Generator"
echo "========================================="
echo ""

# Get configuration
read -p "FreeRADIUS Server IP (default: 192.168.1.100): " RADIUS_IP
RADIUS_IP=${RADIUS_IP:-192.168.1.100}

read -p "RADIUS Secret (default: testing123): " RADIUS_SECRET
RADIUS_SECRET=${RADIUS_SECRET:-testing123}

read -p "PPPoE Interface (default: ether2): " PPPOE_INTERFACE
PPPOE_INTERFACE=${PPPOE_INTERFACE:-ether2}

read -p "Hotspot Interface (default: ether3): " HOTSPOT_INTERFACE
HOTSPOT_INTERFACE=${HOTSPOT_INTERFACE:-ether3}

read -p "Hotspot IP Pool (default: 192.168.100.2-192.168.100.254): " HOTSPOT_POOL
HOTSPOT_POOL=${HOTSPOT_POOL:-192.168.100.2-192.168.100.254}

read -p "Hotspot Gateway IP (default: 192.168.100.1): " HOTSPOT_GATEWAY
HOTSPOT_GATEWAY=${HOTSPOT_GATEWAY:-192.168.100.1}

echo ""
echo "📝 Generating Mikrotik configuration..."
echo ""

# Generate configuration file
cat > mikrotik-config.rsc <<EOF
# ========================================
# Mikrotik RADIUS Configuration
# Generated: $(date)
# ========================================

# 1. Add RADIUS Server
/radius
add address=${RADIUS_IP} secret=${RADIUS_SECRET} service=ppp,hotspot timeout=3s

# 2. Enable RADIUS for PPPoE
/ppp aaa
set accounting=yes interim-update=5m use-radius=yes

# 3. Create PPPoE Server Profile
/ppp profile
add name=pppoe-radius use-compression=no use-encryption=no use-mpls=no use-upnp=no local-address=${HOTSPOT_GATEWAY} remote-address=dhcp-pool

# 4. Create PPPoE Server
/interface pppoe-server server
add authentication=pap,chap,mschap1,mschap2 default-profile=pppoe-radius disabled=no interface=${PPPOE_INTERFACE} keepalive-timeout=10 max-mru=1480 max-mtu=1480 max-sessions=1000 mrru=disabled one-session-per-host=yes service-name=ISP

# 5. Create IP Pool for Hotspot
/ip pool
add name=hotspot-pool ranges=${HOTSPOT_POOL}

# 6. Create Hotspot Profile
/ip hotspot profile
add dns-name=hotspot.local hotspot-address=${HOTSPOT_GATEWAY} html-directory=hotspot login-by=http-pap,http-chap name=hotspot-radius rate-limit="" smtp-server=0.0.0.0 split-user-domain=no use-radius=yes

# 7. Create Hotspot Server
/ip hotspot
add address-pool=hotspot-pool disabled=no interface=${HOTSPOT_INTERFACE} name=hotspot1 profile=hotspot-radius

# 8. Configure Hotspot IP
/ip address
add address=${HOTSPOT_GATEWAY}/24 interface=${HOTSPOT_INTERFACE} network=$(echo ${HOTSPOT_GATEWAY} | cut -d'.' -f1-3).0

# 9. Enable RADIUS Accounting
/radius incoming
set accept=yes

# 10. Configure NAT (if needed)
# Uncomment if you need internet access
# /ip firewall nat
# add action=masquerade chain=srcnat out-interface=ether1 comment="Internet NAT"

# ========================================
# Configuration Complete!
# ========================================
# 
# To apply this configuration:
# 1. Copy the content of this file
# 2. Open Mikrotik Terminal
# 3. Paste the configuration
# 4. Press Enter
#
# Or upload via FTP and run:
# /import file-name=mikrotik-config.rsc
#
# ========================================
EOF

echo "✅ Configuration file created: mikrotik-config.rsc"
echo ""
echo "========================================="
echo "📋 Configuration Summary"
echo "========================================="
echo "RADIUS Server: ${RADIUS_IP}"
echo "RADIUS Secret: ${RADIUS_SECRET}"
echo "PPPoE Interface: ${PPPOE_INTERFACE}"
echo "Hotspot Interface: ${HOTSPOT_INTERFACE}"
echo "Hotspot Pool: ${HOTSPOT_POOL}"
echo "Hotspot Gateway: ${HOTSPOT_GATEWAY}"
echo ""
echo "========================================="
echo "📝 How to Apply Configuration"
echo "========================================="
echo ""
echo "Method 1: Copy & Paste"
echo "  1. Open mikrotik-config.rsc"
echo "  2. Copy all content"
echo "  3. Open Mikrotik Terminal (Winbox/SSH)"
echo "  4. Paste and press Enter"
echo ""
echo "Method 2: Import File"
echo "  1. Upload mikrotik-config.rsc via FTP"
echo "  2. Run: /import file-name=mikrotik-config.rsc"
echo ""
echo "Method 3: Manual via Winbox"
echo "  1. IP > Hotspot > Setup"
echo "  2. RADIUS > Add New"
echo "  3. PPP > Profiles > Add New"
echo ""
echo "========================================="
echo "🧪 Testing"
echo "========================================="
echo ""
echo "Test PPPoE:"
echo "  1. Create user in Laravel panel"
echo "  2. Connect PPPoE client"
echo "  3. Use username/password from panel"
echo ""
echo "Test Hotspot:"
echo "  1. Generate voucher in Laravel panel"
echo "  2. Connect to WiFi"
echo "  3. Open browser (auto redirect)"
echo "  4. Enter voucher code"
echo ""
echo "Check RADIUS:"
echo "  /radius monitor 0"
echo "  /ppp active print"
echo "  /ip hotspot active print"
echo ""
echo "========================================="
echo "✅ Configuration file ready!"
echo "========================================="

# Create additional helper script
cat > mikrotik-test.rsc <<EOF
# Mikrotik RADIUS Test Commands

# Check RADIUS status
/radius print detail

# Monitor RADIUS
/radius monitor 0

# Check PPPoE active sessions
/ppp active print

# Check Hotspot active sessions
/ip hotspot active print

# Check RADIUS incoming
/radius incoming print

# View RADIUS logs
/log print where topics~"radius"

# Test RADIUS authentication (replace with actual credentials)
# /radius test address=${RADIUS_IP} secret=${RADIUS_SECRET} username=test password=test
EOF

echo ""
echo "📝 Additional file created: mikrotik-test.rsc"
echo "   Use this for testing RADIUS connection"
echo ""
