# FreeRADIUS Installation & Configuration Guide

## 🚀 Automatic Installation (Recommended)

### Prerequisites
- Ubuntu 20.04/22.04 atau Debian 10/11
- Root access (sudo)
- MySQL/MariaDB sudah terinstall
- Laravel application sudah di-setup

### Quick Install

```bash
# 1. Jalankan script installer
sudo ./install-freeradius.sh
```

Script akan otomatis:
- ✅ Install FreeRADIUS dan dependencies
- ✅ Configure SQL module
- ✅ Setup database connection
- ✅ Configure authentication
- ✅ Enable accounting
- ✅ Start service
- ✅ Test configuration

### Input yang Diperlukan

Script akan menanyakan:
1. **Database host** (default: localhost)
2. **Database name** (default: radius)
3. **Database username** (default: radius)
4. **Database password** (wajib diisi)
5. **RADIUS secret** (default: testing123)

### Contoh Output

```
=========================================
FreeRADIUS Auto Install & Configuration
=========================================

📋 Database Configuration
-------------------------
Database host (default: localhost): [Enter]
Database name (default: radius): [Enter]
Database username (default: radius): [Enter]
Database password: ********
RADIUS shared secret (default: testing123): [Enter]

🔄 Starting installation...

📦 Updating system packages...
✅ System updated

📦 Installing FreeRADIUS...
✅ FreeRADIUS installed

🗄️  Configuring database...
✅ Database user configured

💾 Backing up original configuration...
✅ Backup created at /etc/freeradius/3.0/backup_20260430_120000

⚙️  Configuring SQL module...
✅ SQL module configured

🔗 Enabling SQL module...
✅ SQL module enabled

⚙️  Configuring default site...
✅ Default site configured

⚙️  Configuring clients...
✅ Clients configured

🔐 Setting permissions...
✅ Permissions set

🧪 Testing FreeRADIUS configuration...
✅ Configuration test passed

🚀 Starting FreeRADIUS service...
✅ FreeRADIUS service is running

=========================================
✅ FreeRADIUS Installation Complete!
=========================================

📋 Configuration Summary:
   Database Host: localhost
   Database Name: radius
   Database User: radius
   RADIUS Secret: testing123

🔧 Service Commands:
   Status:  systemctl status freeradius
   Restart: systemctl restart freeradius
   Logs:    journalctl -u freeradius -f
   Debug:   freeradius -X

✅ FreeRADIUS is ready to use!
=========================================
```

## 🔧 Manual Installation (Alternative)

Jika ingin install manual, ikuti langkah berikut:

### 1. Install FreeRADIUS

```bash
sudo apt update
sudo apt install -y freeradius freeradius-mysql freeradius-utils
```

### 2. Stop Service

```bash
sudo systemctl stop freeradius
```

### 3. Configure SQL Module

Edit `/etc/freeradius/3.0/mods-available/sql`:

```conf
sql {
    driver = "rlm_sql_mysql"
    dialect = "mysql"
    
    server = "localhost"
    port = 3306
    login = "radius"
    password = "your_password"
    radius_db = "radius"
    
    read_clients = yes
    client_table = "nas"
    
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
    
    read_groups = yes
    
    $INCLUDE ${modconfdir}/${.:name}/main/${dialect}/queries.conf
}
```

### 4. Enable SQL Module

```bash
sudo ln -s /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql
```

### 5. Configure Default Site

Edit `/etc/freeradius/3.0/sites-available/default`:

```conf
server default {
    listen {
        type = auth
        ipaddr = *
        port = 0
    }
    
    listen {
        type = acct
        ipaddr = *
        port = 0
    }
    
    authorize {
        filter_username
        preprocess
        sql
        pap
    }
    
    authenticate {
        Auth-Type PAP {
            pap
        }
    }
    
    accounting {
        sql
    }
    
    post-auth {
        sql
        Post-Auth-Type REJECT {
            sql
        }
    }
}
```

### 6. Configure Clients

Edit `/etc/freeradius/3.0/clients.conf`:

```conf
client localhost {
    ipaddr = 127.0.0.1
    secret = testing123
    require_message_authenticator = no
    nas_type = other
}
```

### 7. Set Permissions

```bash
sudo chown -R freerad:freerad /etc/freeradius/3.0/
sudo chmod 640 /etc/freeradius/3.0/mods-available/sql
```

### 8. Test Configuration

```bash
sudo freeradius -C
```

### 9. Start Service

```bash
sudo systemctl enable freeradius
sudo systemctl start freeradius
sudo systemctl status freeradius
```

## 🧪 Testing FreeRADIUS

### 1. Test dengan radtest

```bash
# Setelah create user di Laravel panel
radtest username password localhost 0 testing123
```

Expected output:
```
Sending Access-Request Id 123 to 127.0.0.1:1812
    User-Name = "username"
    User-Password = "password"
    NAS-IP-Address = 127.0.0.1
    NAS-Port = 0

Received Access-Accept Id 123 from 127.0.0.1:1812
    Mikrotik-Rate-Limit = "10M/10M"
```

### 2. Debug Mode

```bash
# Stop service
sudo systemctl stop freeradius

# Run in debug mode
sudo freeradius -X

# In another terminal, test
radtest test test localhost 0 testing123
```

### 3. Check Logs

```bash
# Real-time logs
sudo journalctl -u freeradius -f

# Last 50 lines
sudo journalctl -u freeradius -n 50

# Errors only
sudo journalctl -u freeradius -p err
```

## 🌐 Mikrotik Configuration

### Automatic Configuration

```bash
# Generate Mikrotik config
./configure-mikrotik.sh
```

Script akan generate file `mikrotik-config.rsc` yang bisa langsung di-import ke Mikrotik.

### Manual Configuration

#### 1. Add RADIUS Server

```routeros
/radius
add address=192.168.1.100 secret=testing123 service=ppp,hotspot
```

#### 2. Enable RADIUS for PPPoE

```routeros
/ppp aaa
set use-radius=yes accounting=yes
```

#### 3. Create PPPoE Server

```routeros
/interface pppoe-server server
add interface=ether2 service-name=ISP default-profile=default-encryption
```

#### 4. Enable RADIUS for Hotspot

```routeros
/ip hotspot profile
set default use-radius=yes
```

#### 5. Create Hotspot

```routeros
/ip pool
add name=hotspot-pool ranges=192.168.100.2-192.168.100.254

/ip hotspot
add interface=ether3 address-pool=hotspot-pool name=hotspot1
```

#### 6. Test RADIUS

```routeros
/radius monitor 0
```

## 🔍 Troubleshooting

### FreeRADIUS tidak start

```bash
# Check configuration
sudo freeradius -C

# Check logs
sudo journalctl -u freeradius -n 50

# Run in debug mode
sudo freeradius -X
```

### Database connection error

```bash
# Test MySQL connection
mysql -h localhost -u radius -p radius

# Check SQL module
sudo freeradius -X | grep -i sql
```

### Authentication failed

```bash
# Check user in database
mysql -u radius -p radius -e "SELECT * FROM radcheck WHERE username='test';"

# Check RADIUS logs
sudo journalctl -u freeradius -f

# Test with radtest
radtest test test localhost 0 testing123
```

### Mikrotik tidak connect

```routeros
# Check RADIUS status
/radius print detail

# Monitor RADIUS
/radius monitor 0

# Check logs
/log print where topics~"radius"
```

## 📊 Verification Checklist

- [ ] FreeRADIUS service running
- [ ] SQL module enabled
- [ ] Database connection working
- [ ] Test authentication successful
- [ ] Mikrotik RADIUS configured
- [ ] PPPoE authentication working
- [ ] Hotspot authentication working
- [ ] Accounting logs recorded

## 🔐 Security Recommendations

1. **Change default RADIUS secret**
   ```bash
   # Use strong secret (min 16 characters)
   openssl rand -base64 32
   ```

2. **Restrict RADIUS access**
   ```bash
   # Only allow specific IPs in clients.conf
   client mikrotik1 {
       ipaddr = 192.168.1.1
       secret = strong_secret_here
   }
   ```

3. **Enable firewall**
   ```bash
   # Allow only RADIUS ports
   sudo ufw allow from 192.168.1.0/24 to any port 1812,1813 proto udp
   ```

4. **Regular backups**
   ```bash
   # Backup configuration
   sudo tar -czf freeradius-backup-$(date +%Y%m%d).tar.gz /etc/freeradius/3.0/
   ```

## 📝 Configuration Files Location

```
/etc/freeradius/3.0/
├── mods-available/
│   └── sql                    # SQL module config
├── mods-enabled/
│   └── sql -> ../mods-available/sql
├── sites-available/
│   └── default                # Default site config
├── sites-enabled/
│   └── default -> ../sites-available/default
├── clients.conf               # RADIUS clients
└── radiusd.conf              # Main config
```

## 🎯 Next Steps

1. ✅ Install FreeRADIUS (gunakan script)
2. ✅ Configure Mikrotik (gunakan script)
3. ✅ Test authentication
4. ✅ Create users via Laravel panel
5. ✅ Test PPPoE connection
6. ✅ Test Hotspot voucher
7. ✅ Monitor accounting logs

---

**Dengan script otomatis, instalasi FreeRADIUS hanya butuh 5 menit!** 🚀
