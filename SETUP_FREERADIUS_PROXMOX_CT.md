# 🚀 Setup FreeRADIUS di Proxmox CT

## Arsitektur Setup

```
┌─────────────────────────────────────────────────┐
│ Server aaPanel (billing.syakirulilmi.my.id)    │
│ - Laravel App                                    │
│ - MySQL Database                                 │
│ - Frontend React                                 │
└──────────────────┬──────────────────────────────┘
                   │ API/Database Connection
                   ↓
┌─────────────────────────────────────────────────┐
│ Proxmox CT (FreeRADIUS)                         │
│ - FreeRADIUS Server                             │
│ - Port 1812 (Auth)                              │
│ - Port 1813 (Acct)                              │
└──────────────────┬──────────────────────────────┘
                   │ RADIUS Protocol
                   ↓
┌─────────────────────────────────────────────────┐
│ Mikrotik Router                                 │
│ - Hotspot/PPPoE                                 │
│ - RADIUS Client                                 │
└─────────────────────────────────────────────────┘
```

---

## 📋 Setup CT Proxmox untuk FreeRADIUS

### 1. Spesifikasi CT yang Disarankan

```
OS: Ubuntu 22.04 LTS
RAM: 1-2 GB
CPU: 1-2 cores
Disk: 10-20 GB
Network: Bridge (agar bisa diakses dari network)
```

### 2. Network Configuration

**PENTING**: CT harus bisa diakses dari:
- Server aaPanel (untuk database connection)
- Mikrotik Router (untuk RADIUS)

```bash
# Di CT, cek IP
ip addr show

# Contoh IP CT: 192.168.30.10
# Pastikan IP ini bisa di-ping dari server dan router
```

---

## 🔧 Install FreeRADIUS di CT

### Quick Install (Copy Command Ini)

```bash
# Update system
apt update && apt upgrade -y

# Install FreeRADIUS dan MySQL client
apt install -y freeradius freeradius-mysql freeradius-utils mysql-client

# Stop service dulu
systemctl stop freeradius

# Backup config
cp /etc/freeradius/3.0/radiusd.conf /etc/freeradius/3.0/radiusd.conf.backup
cp /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-available/sql.backup
```

---

## 🗄️ Konfigurasi Database Connection

FreeRADIUS di CT akan connect ke MySQL di server aaPanel.

### 1. Edit SQL Module

```bash
nano /etc/freeradius/3.0/mods-available/sql
```

Update:
```conf
sql {
    driver = "rlm_sql_mysql"
    dialect = "mysql"
    
    # Connection ke MySQL di server aaPanel
    server = "IP_SERVER_AAPANEL"
    port = 3306
    login = "radius_user"
    password = "password_database"
    radius_db = "radius"
    
    # Read clients from database
    read_clients = yes
    client_table = "nas"
}
```

### 2. Enable SQL Module

```bash
ln -s /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql
```

### 3. Edit Clients Configuration

```bash
nano /etc/freeradius/3.0/clients.conf
```

Tambahkan:
```conf
# Mikrotik Router
client mikrotik {
    ipaddr = 192.168.30.2
    secret = testing123
    require_message_authenticator = no
    nas_type = other
}

# Atau baca dari database
# read clients = yes (sudah di-set di sql module)
```

---

## 🔥 Firewall Configuration di CT

```bash
# Allow RADIUS ports
ufw allow 1812/udp comment "RADIUS Auth"
ufw allow 1813/udp comment "RADIUS Acct"

# Allow SSH (jika pakai)
ufw allow 22/tcp

# Enable firewall
ufw enable
```

---

## 🔐 Setup Database di Server aaPanel

Di server aaPanel, buat user MySQL yang bisa diakses dari CT:

```bash
# SSH ke server aaPanel
mysql -u root -p

# Buat user untuk FreeRADIUS
CREATE USER 'radius_user'@'IP_CT_PROXMOX' IDENTIFIED BY 'password_kuat';
GRANT ALL PRIVILEGES ON radius.* TO 'radius_user'@'IP_CT_PROXMOX';
FLUSH PRIVILEGES;
EXIT;
```

### Allow MySQL Remote Connection

```bash
# Edit MySQL config
nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Ubah bind-address
bind-address = 0.0.0.0

# Restart MySQL
systemctl restart mysql

# Allow firewall
ufw allow from IP_CT_PROXMOX to any port 3306
```

---

## ✅ Test Connection dari CT ke Database

```bash
# Di CT Proxmox
mysql -h IP_SERVER_AAPANEL -u radius_user -p radius

# Jika berhasil connect, test query
mysql> SELECT * FROM radcheck LIMIT 5;
mysql> SELECT * FROM nas;
mysql> EXIT;
```

---

## 🚀 Start FreeRADIUS

```bash
# Test config dulu
freeradius -X

# Jika tidak ada error, Ctrl+C lalu start service
systemctl start freeradius
systemctl enable freeradius

# Cek status
systemctl status freeradius
```

---

## 🧪 Test RADIUS

### Test dari CT (Local)

```bash
# Test user dari database
radtest testuser testpass localhost 1812 testing123

# Jika berhasil:
# Received Access-Accept
```

### Test dari Server aaPanel

```bash
# Di server aaPanel
radtest testuser testpass IP_CT_PROXMOX 1812 testing123
```

### Test dari Mikrotik

```bash
# Di Mikrotik
/radius add service=login address=IP_CT_PROXMOX secret=testing123
/radius test username=testuser password=testpass
```

---

## 📋 Update .env di Laravel

Di server aaPanel:

```bash
cd /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api
nano .env
```

Update:
```env
# FreeRADIUS di CT Proxmox
RADIUS_HOST=IP_CT_PROXMOX
RADIUS_AUTH_PORT=1812
RADIUS_ACCT_PORT=1813
RADIUS_SECRET=testing123

# Database tetap di server aaPanel
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=radius
DB_USERNAME=root
DB_PASSWORD=password
```

```bash
# Clear cache
php artisan config:clear
php artisan config:cache
```

---

## 🔍 Troubleshooting

### FreeRADIUS Tidak Start

```bash
# Debug mode
freeradius -X

# Cek error di log
tail -f /var/log/freeradius/radius.log
```

### Tidak Bisa Connect ke Database

```bash
# Test connection
mysql -h IP_SERVER_AAPANEL -u radius_user -p

# Cek firewall
ufw status
```

### Mikrotik Tidak Bisa Connect

```bash
# Cek firewall CT
ufw status

# Test dari Mikrotik
ping IP_CT_PROXMOX
```

---

## 📊 Monitoring

```bash
# Lihat log real-time
tail -f /var/log/freeradius/radius.log

# Cek active connections
netstat -tulpn | grep 1812
netstat -tulpn | grep 1813

# Cek status service
systemctl status freeradius
```

---

## 🎯 Checklist Setup

- [ ] CT Proxmox created dengan network bridge
- [ ] Ubuntu installed di CT
- [ ] FreeRADIUS installed
- [ ] MySQL client installed
- [ ] SQL module configured dengan IP server aaPanel
- [ ] Database user created di server aaPanel
- [ ] MySQL allow remote connection dari CT
- [ ] Firewall configured (1812, 1813 UDP)
- [ ] FreeRADIUS service running
- [ ] Test connection berhasil
- [ ] .env Laravel updated dengan IP CT
- [ ] Mikrotik configured dengan IP CT

---

## 📝 IP Summary

Catat IP-IP ini:

```
Server aaPanel: _______________
CT Proxmox (FreeRADIUS): _______________
Mikrotik Router: _______________
```

---

## 🚀 Quick Setup Script

```bash
#!/bin/bash
# Run di CT Proxmox

# Install
apt update && apt upgrade -y
apt install -y freeradius freeradius-mysql freeradius-utils mysql-client

# Firewall
ufw allow 1812/udp
ufw allow 1813/udp
ufw allow 22/tcp
ufw --force enable

# Backup
cp /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-available/sql.backup

echo "Setup complete! Now configure SQL module and database connection."
```

---

**Ikuti step-by-step di atas untuk setup FreeRADIUS di CT Proxmox! 🚀**
