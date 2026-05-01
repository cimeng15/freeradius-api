#!/bin/bash

# Make all scripts executable
# Usage: bash make-executable.sh

echo "Making all scripts executable..."

chmod +x deploy.sh
chmod +x deploy-simple.sh
chmod +x test-deploy.sh
chmod +x setup.sh
chmod +x install-freeradius.sh
chmod +x configure-mikrotik.sh

echo "✅ All scripts are now executable!"
echo ""
echo "Available scripts:"
echo "  ./deploy-simple.sh     - Quick deployment (no prompts)"
echo "  ./deploy.sh            - Interactive deployment"
echo "  ./test-deploy.sh       - Test deployment"
echo "  ./setup.sh             - Setup Laravel"
echo "  ./install-freeradius.sh - Install FreeRADIUS"
echo "  ./configure-mikrotik.sh - Configure Mikrotik"
