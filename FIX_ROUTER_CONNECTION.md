# 🔧 Fix Koneksi ke Router dari Server

## Masalah: Tidak Bisa Ping/Komunikasi dengan Router

Server tidak bisa connect ke router Mikrotik untuk RADIUS atau API.

---

## 🔍 Diagnosis Dulu

```bash
# 1. Cek koneksi ke router
ping -c 4 192.168.15.201

# 2. Cek port RADIUS
nc -zv 192.168.15.201 1812
nc -zv 192.168.15.201 1813

# 3. Cek port API Mikrotik
nc -zv 192.168.15.201 8728

# 4. Cek routing
ip route

# 5. Cek firewall
iptables -L -n
```

---

## ✅ Solusi 1: Firewall di Server (aaPanel)

### Via aaPanel Web Interface

1. Login ke aaPanel → **Security**
2. **Firewall** tab
3. Add rules untuk allow outgoing:
   - Port: `1812` (RADIUS Auth) - UDP
   - Port: `1813` (RADIUS Acct) - UDP
   - Port: `8728` (Mikrotik API) - TCP
   - Destination: IP Router Anda

### Via Command Line

```bash
# Allow outgoing ke router
iptables -A OUTPUT -p udp -d 192.168.15.201 --dport 1812 -j ACCEPT
iptables -A OUTPUT -p udp -d 192.168.15.201 --dport 1813 -j ACCEPT
iptables -A OUTPUT -p tcp -d 192.168.15.201 --dport 8728 -j ACCEPT

# Allow incoming dari router
iptables -A INPUT -p udp -s 192.168.15.201 --sport 1812 -j ACCEPT
iptables -A INPUT -p udp -s 192.168.15.201 --sport 1813 -j ACCEPT

# Save rules
iptables-save > /etc/iptables/rules.v4
# atau
netfilter-persistent save
```

---

## ✅ Solusi 2: Network Configuration

### Cek IP Server
```bash
# Cek IP server
ip addr show

# Pastikan server dan router di network yang sama
# Atau ada routing yang benar
```

### Jika Server di Cloud/VPS

Server cloud biasanya tidak bisa langsung akses IP private (192.168.x.x).

**Solusi**:
1. **VPN**: Setup VPN antara server dan router
2. **Public IP**: Expose router dengan public IP + port forwarding
3. **Tunnel**: Setup tunnel (WireGuard, OpenVPN, dll)

---

## ✅ Solusi 3: Konfigurasi Router

### Di Mikrotik

```bash
# Allow koneksi dari IP server
/ip firewall filter add chain=input protocol=udp dst-port=1812-1813 src-address=IP_SERVER action=accept comment="RADIUS from Server"

/ip firewall filter add chain=input protocol=tcp dst-port=8728 src-address=IP_SERVER action=accept comment="API from Server"
```

Ganti `IP_SERVER` dengan IP public server Anda.

---

## 🎯 Konfigurasi untuk Server Cloud

Jika server di cloud (bukan local network):

### 1. Update .env di Server

```bash
cd /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api
nano .env
```

Update:
```env
# Jika router punya public IP
RADIUS_HOST=PUBLIC_IP_ROUTER
RADIUS_AUTH_PORT=1812
RADIUS_ACCT_PORT=1813
RADIUS_SECRET=testing123

# Mikrotik API
MIKROTIK_HOST=PUBLIC_IP_ROUTER
MIKROTIK_PORT=8728
MIKROTIK_USERNAME=admin
MIKROTIK_PASSWORD=your_password
```

### 2. Port Forwarding di Router

Di Mikrotik, forward port:
```bash
/ip firewall nat add chain=dstnat dst-port=1812 protocol=udp action=dst-nat to-addresses=192.168.15.201 to-ports=1812

/ip firewall nat add chain=dstnat dst-port=1813 protocol=udp action=dst-nat to-addresses=192.168.15.201 to-ports=1813

/ip firewall nat add chain=dstnat dst-port=8728 protocol=tcp action=dst-nat to-addresses=192.168.15.201 to-ports=8728
```

---

## 📋 Test Koneksi

### Test RADIUS
```bash
cd /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api

# Test dengan radtest (jika ada)
radtest testuser testpass 192.168.15.201 1812 testing123

# Atau test dengan Laravel
php artisan tinker
>>> \App\Services\RadiusService::testConnection();
```

### Test Ping
```bash
# Ping router
ping -c 4 192.168.15.201

# Jika tidak bisa ping tapi bisa akses port, itu normal
# Router mungkin block ICMP
```

### Test Port
```bash
# Test port RADIUS
nc -zv 192.168.15.201 1812
nc -zv 192.168.15.201 1813

# Test port API
nc -zv 192.168.15.201 8728
```

---

## 🔍 Troubleshooting

### Ping Tidak Bisa Tapi Port Bisa

Ini normal. Router mungkin block ICMP (ping) tapi allow port tertentu.

**Solusi**: Tidak perlu fix, fokus ke port yang dibutuhkan.

### Semua Port Tidak Bisa

**Kemungkinan**:
1. Firewall server block outgoing
2. Firewall router block incoming
3. Network tidak terhubung
4. IP salah

**Solusi**: Cek firewall di kedua sisi.

### Connection Timeout

**Kemungkinan**:
1. Router tidak reachable dari server
2. Port salah
3. Service tidak running di router

**Solusi**: 
```bash
# Cek service di router
/radius print
/user-manager print
```

---

## ✅ Konfigurasi Optimal

### Jika Server & Router di Network yang Sama

```env
# .env
RADIUS_HOST=192.168.15.201
RADIUS_AUTH_PORT=1812
RADIUS_ACCT_PORT=1813
RADIUS_SECRET=testing123
```

Firewall: Allow outgoing ke 192.168.15.201

### Jika Server di Cloud

```env
# .env
RADIUS_HOST=PUBLIC_IP_ROUTER
RADIUS_AUTH_PORT=1812
RADIUS_ACCT_PORT=1813
RADIUS_SECRET=testing123
```

Router: Port forwarding + firewall allow dari IP server

---

## 🎯 Quick Fix Commands

```bash
# 1. Allow firewall
iptables -A OUTPUT -p udp -d 192.168.15.201 --dport 1812:1813 -j ACCEPT
iptables -A OUTPUT -p tcp -d 192.168.15.201 --dport 8728 -j ACCEPT

# 2. Test koneksi
nc -zv 192.168.15.201 1812

# 3. Update .env jika perlu
nano /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api/.env

# 4. Clear cache
cd /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api
php artisan config:clear
php artisan config:cache
```

---

## 📞 Informasi yang Dibutuhkan

Untuk troubleshoot lebih lanjut, berikan info:
1. Server di mana? (Cloud/VPS atau local network)
2. IP server berapa?
3. IP router berapa?
4. Output dari: `ping -c 4 192.168.15.201`
5. Output dari: `nc -zv 192.168.15.201 1812`

---

**Mulai dari diagnosis dulu, lalu apply solusi yang sesuai! 🚀**
