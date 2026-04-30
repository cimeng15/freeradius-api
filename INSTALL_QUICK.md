# 🚀 Instalasi Cepat - 5 Menit!

## Langkah 1: Setup Laravel (2 menit)

```bash
cd /path/to/freeradius-api
./setup.sh
```

**Input yang diperlukan:**
- Database name (default: radius)
- Database username (default: root)
- Database password

**Output:**
```
✅ .env file created
✅ Application key generated
✅ Database created
✅ Migrations completed
✅ Database seeded
✅ Setup completed successfully!

📋 Default Credentials:
   Superadmin: admin@example.com / password
   NOC: noc@example.com / password
```

---

## Langkah 2: Install FreeRADIUS (2 menit)

```bash
sudo ./install-freeradius.sh
```

**Input yang diperlukan:**
- Database host (default: localhost)
- Database name (default: radius)
- Database username (default: radius)
- Database password (sama dengan Laravel)
- RADIUS secret (default: testing123)

**Output:**
```
✅ FreeRADIUS installed
✅ SQL module configured
✅ Service started
✅ Configuration test passed
✅ FreeRADIUS is ready to use!
```

---

## Langkah 3: Configure Mikrotik (1 menit)

```bash
./configure-mikrotik.sh
```

**Input yang diperlukan:**
- FreeRADIUS Server IP (default: 192.168.1.100)
- RADIUS Secret (default: testing123)
- PPPoE Interface (default: ether2)
- Hotspot Interface (default: ether3)

**Output:**
```
✅ Configuration file created: mikrotik-config.rsc
```

**Cara apply ke Mikrotik:**
1. Buka file `mikrotik-config.rsc`
2. Copy semua isi file
3. Buka Mikrotik Terminal (Winbox/SSH)
4. Paste dan tekan Enter

---

## Langkah 4: Start Server

```bash
php artisan serve
```

Server berjalan di: `http://localhost:8000`

---

## ✅ Verifikasi Instalasi

### 1. Test Laravel API

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

**Expected:** Response dengan token

### 2. Test FreeRADIUS

```bash
systemctl status freeradius
```

**Expected:** `active (running)`

### 3. Test RADIUS Authentication

```bash
# Setelah create user di panel
radtest username password localhost 0 testing123
```

**Expected:** `Access-Accept`

---

## 🎯 Next Steps

### 1. Create PPPoE Client

```bash
curl -X POST http://localhost:8000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "package_id": 1,
    "installation_address": "Test Address",
    "phone": "081234567890",
    "billing_date": 1
  }'
```

### 2. Test PPPoE Connection

Di Mikrotik:
```routeros
/ppp active print
```

Di client, connect PPPoE dengan:
- Username: `testuser`
- Password: `password123`

### 3. Generate Voucher

```bash
curl -X POST http://localhost:8000/api/vouchers/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": 3,
    "quantity": 5
  }'
```

### 4. Test Hotspot

1. Connect ke WiFi hotspot
2. Browser akan auto redirect ke login page
3. Masukkan voucher code
4. Klik login

---

## 🐛 Troubleshooting

### Laravel tidak bisa connect database

```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u root -p

# Update .env
nano .env
```

### FreeRADIUS tidak start

```bash
# Check logs
sudo journalctl -u freeradius -n 50

# Test configuration
sudo freeradius -C

# Run in debug mode
sudo freeradius -X
```

### Mikrotik tidak connect ke RADIUS

```routeros
# Check RADIUS status
/radius print detail

# Monitor RADIUS
/radius monitor 0

# Check logs
/log print where topics~"radius"
```

---

## 📚 Dokumentasi Lengkap

- `README.md` - Overview
- `SETUP.md` - Laravel setup detail
- `FREERADIUS_INSTALL.md` - FreeRADIUS installation detail
- `STRUCTURE.md` - Application structure
- `SYSTEM_FLOW_THEORY.md` - System flow & theory
- `QUICK_REFERENCE.md` - Quick reference

---

## 🎉 Selesai!

Sistem sudah siap digunakan! 

**Total waktu instalasi: ~5 menit**

Untuk development UI, lanjutkan dengan:
- Blade + Alpine.js + Tailwind CSS
- Vue.js 3 + Inertia.js
- React + Next.js

---

**Need help?** Check full documentation atau create issue di repository.
