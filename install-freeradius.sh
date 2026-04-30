#!/bin/bash

# FreeRADIUS Auto Install & Configuration Script
# This script will install and configure FreeRADIUS automatically
# Compatible with Ubuntu/Debian

set -e

echo "========================================="
echo "FreeRADIUS Auto Install & Configuration"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Get database credentials
echo "📋 Database Configuration"
echo "-------------------------"
read -p "Database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database name (default: radius): " DB_NAME
DB_NAME=${DB_NAME:-radius}

read -p "Database username (default: radius): " DB_USER
DB_USER=${DB_USER:-radius}

read -sp "Database password: " DB_PASS
echo ""

read -p "RADIUS shared secret (default: testing123): " RADIUS_SECRET
RADIUS_SECRET=${RADIUS_SECRET:-testing123}

echo ""
echo "🔄 Starting installation..."
echo ""

# Update system
echo "📦 Updating system packages..."
apt-get update -qq

# Install FreeRADIUS and MySQL module
echo "📦 Installing FreeRADIUS..."
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    freeradius \
    freeradius-mysql \
    freeradius-utils \
    mysql-client

echo "✅ FreeRADIUS installed"

# Stop FreeRADIUS service
echo "🛑 Stopping FreeRADIUS service..."
systemctl stop freeradius

# Create database user if not exists
echo "🗄️  Configuring database..."
mysql -h "$DB_HOST" -u root -p <<MYSQL_SCRIPT
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo "✅ Database user configured"

# Backup original configuration
echo "💾 Backing up original configuration..."
BACKUP_DIR="/etc/freeradius/3.0/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /etc/freeradius/3.0/mods-available/sql "$BACKUP_DIR/" 2>/dev/null || true
cp -r /etc/freeradius/3.0/sites-available/default "$BACKUP_DIR/" 2>/dev/null || true
cp -r /etc/freeradius/3.0/clients.conf "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup created at $BACKUP_DIR"

# Configure SQL module
echo "⚙️  Configuring SQL module..."
cat > /etc/freeradius/3.0/mods-available/sql <<'EOF'
sql {
    driver = "rlm_sql_mysql"
    dialect = "mysql"
    
    # Connection info
    server = "DB_HOST_PLACEHOLDER"
    port = 3306
    login = "DB_USER_PLACEHOLDER"
    password = "DB_PASS_PLACEHOLDER"
    radius_db = "DB_NAME_PLACEHOLDER"
    
    # Read clients from database
    read_clients = yes
    
    # Set to 'yes' to read radius clients from the database ('nas' table)
    # Clients will ONLY be read on server startup.
    client_table = "nas"
    
    # Pool configuration
    pool {
        start = 5
        min = 4
        max = 10
        spare = 3
        uses = 0
        retry_delay = 30
        lifetime = 0
        idle_timeout = 60
    }
    
    # Query configuration
    read_groups = yes
    
    # Table names
    $INCLUDE ${modconfdir}/${.:name}/main/${dialect}/queries.conf
}
EOF

# Replace placeholders
sed -i "s/DB_HOST_PLACEHOLDER/$DB_HOST/g" /etc/freeradius/3.0/mods-available/sql
sed -i "s/DB_USER_PLACEHOLDER/$DB_USER/g" /etc/freeradius/3.0/mods-available/sql
sed -i "s/DB_PASS_PLACEHOLDER/$DB_PASS/g" /etc/freeradius/3.0/mods-available/sql
sed -i "s/DB_NAME_PLACEHOLDER/$DB_NAME/g" /etc/freeradius/3.0/mods-available/sql

echo "✅ SQL module configured"

# Enable SQL module
echo "🔗 Enabling SQL module..."
ln -sf /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql

# Configure default site
echo "⚙️  Configuring default site..."
cat > /etc/freeradius/3.0/sites-available/default <<'EOF'
server default {
    listen {
        type = auth
        ipaddr = *
        port = 0
        limit {
            max_connections = 16
            lifetime = 0
            idle_timeout = 30
        }
    }
    
    listen {
        ipaddr = *
        port = 0
        type = acct
        limit {
        }
    }
    
    authorize {
        filter_username
        preprocess
        
        # Read from SQL
        sql
        
        # Check if user exists
        if (ok || updated) {
            # User found in SQL
        }
        else {
            reject
        }
        
        pap
    }
    
    authenticate {
        Auth-Type PAP {
            pap
        }
    }
    
    preacct {
        preprocess
        acct_unique
        suffix
        files
    }
    
    accounting {
        sql
        exec
        attr_filter.accounting_response
    }
    
    session {
        sql
    }
    
    post-auth {
        sql
        exec
        
        Post-Auth-Type REJECT {
            sql
            attr_filter.access_reject
        }
    }
    
    pre-proxy {
    }
    
    post-proxy {
    }
}
EOF

echo "✅ Default site configured"

# Configure clients
echo "⚙️  Configuring clients..."
cat > /etc/freeradius/3.0/clients.conf <<EOF
# Default client for testing
client localhost {
    ipaddr = 127.0.0.1
    secret = ${RADIUS_SECRET}
    require_message_authenticator = no
    nas_type = other
}

# Read additional clients from database (nas table)
# Clients will be loaded from MySQL on startup
EOF

echo "✅ Clients configured"

# Set correct permissions
echo "🔐 Setting permissions..."
chown -R freerad:freerad /etc/freeradius/3.0/
chmod 640 /etc/freeradius/3.0/mods-available/sql

# Test configuration
echo "🧪 Testing FreeRADIUS configuration..."
if freeradius -C; then
    echo "✅ Configuration test passed"
else
    echo "❌ Configuration test failed"
    echo "Check logs: journalctl -u freeradius -n 50"
    exit 1
fi

# Enable and start FreeRADIUS
echo "🚀 Starting FreeRADIUS service..."
systemctl enable freeradius
systemctl start freeradius

# Wait for service to start
sleep 2

# Check service status
if systemctl is-active --quiet freeradius; then
    echo "✅ FreeRADIUS service is running"
else
    echo "❌ FreeRADIUS service failed to start"
    echo "Check logs: journalctl -u freeradius -n 50"
    exit 1
fi

# Test RADIUS authentication (if test user exists)
echo ""
echo "🧪 Testing RADIUS authentication..."
echo "Note: This will fail if no users exist in database yet"
radtest test test localhost 0 "$RADIUS_SECRET" 2>/dev/null || echo "⚠️  No test user found (this is normal for fresh install)"

echo ""
echo "========================================="
echo "✅ FreeRADIUS Installation Complete!"
echo "========================================="
echo ""
echo "📋 Configuration Summary:"
echo "   Database Host: $DB_HOST"
echo "   Database Name: $DB_NAME"
echo "   Database User: $DB_USER"
echo "   RADIUS Secret: $RADIUS_SECRET"
echo ""
echo "🔧 Service Commands:"
echo "   Status:  systemctl status freeradius"
echo "   Restart: systemctl restart freeradius"
echo "   Logs:    journalctl -u freeradius -f"
echo "   Debug:   freeradius -X"
echo ""
echo "🧪 Test Authentication:"
echo "   radtest username password localhost 0 $RADIUS_SECRET"
echo ""
echo "📝 Configuration Files:"
echo "   SQL Module: /etc/freeradius/3.0/mods-available/sql"
echo "   Default Site: /etc/freeradius/3.0/sites-available/default"
echo "   Clients: /etc/freeradius/3.0/clients.conf"
echo "   Backup: $BACKUP_DIR"
echo ""
echo "✅ FreeRADIUS is ready to use!"
echo "========================================="
