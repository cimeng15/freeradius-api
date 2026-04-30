# ✅ Installation Checklist

Gunakan checklist ini untuk memastikan semua langkah instalasi sudah dilakukan dengan benar.

---

## 📋 Pre-Installation

- [ ] Server Ubuntu/Debian sudah siap
- [ ] MySQL/MariaDB sudah terinstall
- [ ] PHP 8.1+ sudah terinstall
- [ ] Composer sudah terinstall
- [ ] Root/sudo access tersedia
- [ ] Mikrotik RouterOS sudah siap

---

## 🚀 Step 1: Laravel Setup

### Jalankan Script
```bash
cd /path/to/freeradius-api
./setup.sh
```

### Checklist
- [ ] Script berjalan tanpa error
- [ ] File `.env` sudah dibuat
- [ ] Application key sudah di-generate
- [ ] Database `radius` sudah dibuat
- [ ] Migrations berhasil dijalankan (10 migrations)
- [ ] Seeder berhasil dijalankan
- [ ] Muncul pesan "Setup completed successfully!"

### Verifikasi
```bash
# Check database
mysql -u root -p radius -e "SHOW TABLES;"

# Should show 24 tables
```

**Expected:** 24 tables terlihat

---

## 🔧 Step 2: FreeRADIUS Installation

### Jalankan Script
```bash
sudo ./install-freeradius.sh
```

### Input yang Diperlukan
- [ ] Database host: `localhost` (atau sesuai)
- [ ] Database name: `radius`
- [ ] Database username: `radius`
- [ ] Database password: (sama dengan Laravel)
- [ ] RADIUS secret: `testing123` (atau custom)

### Checklist
- [ ] FreeRADIUS terinstall
- [ ] SQL module terkonfigurasi
- [ ] SQL module enabled
- [ ] Default site terkonfigurasi
- [ ] Clients terkonfigurasi
- [ ] Configuration test passed
- [ ] Service started successfully
- [ ] Muncul pesan "FreeRADIUS Installation Complete!"

### Verifikasi
```bash
# Check service status
systemctl status freeradius

# Should show: active (running)

# Check configuration
sudo freeradius -C

# Should show: Configuration appears to be OK
```

**Expected:** Service running, configuration OK

---

## 🌐 Step 3: Mikrotik Configuration

### Jalankan Script
```bash
./configure-mikrotik.sh
```

### Input yang Diperlukan
- [ ] FreeRADIUS Server IP: (IP server FreeRADIUS)
- [ ] RADIUS Secret: `testing123` (sama dengan FreeRADIUS)
- [ ] PPPoE Interface: `ether2` (atau sesuai)
- [ ] Hotspot Interface: `ether3` (atau sesuai)
- [ ] Hotspot IP Pool: `192.168.100.2-192.168.100.254`
- [ ] Hotspot Gateway: `192.168.100.1`

### Checklist
- [ ] File `mikrotik-config.rsc` sudah dibuat
- [ ] File `mikrotik-test.rsc` sudah dibuat
- [ ] Muncul pesan "Configuration file ready!"

### Apply ke Mikrotik
- [ ] Buka file `mikrotik-config.rsc`
- [ ] Copy semua isi file
- [ ] Buka Mikrotik Terminal (Winbox/SSH)
- [ ] Paste dan tekan Enter
- [ ] Tunggu sampai selesai

### Verifikasi di Mikrotik
```routeros
# Check RADIUS
/radius print detail

# Should show: address=<server_ip> secret=testing123

# Monitor RADIUS
/radius monitor 0

# Should show: status=alive
```

**Expected:** RADIUS configured, status alive

---

## 🧪 Step 4: Testing

### Test 1: Laravel API
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

**Checklist:**
- [ ] Response status 200
- [ ] Response berisi `token`
- [ ] Response berisi user data

### Test 2: FreeRADIUS Service
```bash
systemctl status freeradius
```

**Checklist:**
- [ ] Status: `active (running)`
- [ ] No error messages

### Test 3: Create Test User
```bash
# Login dulu, simpan token
TOKEN="your_token_here"

# Create client
curl -X POST http://localhost:8000/api/clients \
  -H "Authorization: Bearer $TOKEN" \
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

**Checklist:**
- [ ] Response status 201
- [ ] Client created successfully
- [ ] User ada di database

### Test 4: RADIUS Authentication
```bash
radtest testuser password123 localhost 0 testing123
```

**Checklist:**
- [ ] Response: `Access-Accept`
- [ ] Attribute: `Mikrotik-Rate-Limit` terlihat

### Test 5: PPPoE Connection (di Mikrotik)
```routeros
# Check active PPPoE sessions
/ppp active print
```

**Checklist:**
- [ ] User `testuser` terlihat (setelah connect)
- [ ] Status: `running`
- [ ] Rate limit applied

### Test 6: Hotspot (Optional)
```bash
# Generate voucher
curl -X POST http://localhost:8000/api/vouchers/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package_id": 3, "quantity": 1}'
```

**Checklist:**
- [ ] Voucher code generated
- [ ] Voucher ada di database
- [ ] Bisa login di hotspot portal

---

## 📊 Final Verification

### Database Check
```bash
mysql -u radius -p radius
```

```sql
-- Check users
SELECT COUNT(*) FROM users;
-- Should be: 2 (admin + noc)

-- Check packages
SELECT COUNT(*) FROM packages;
-- Should be: 5

-- Check RADIUS users
SELECT COUNT(*) FROM radcheck;
-- Should be: > 0 (after creating clients)

-- Check NAS
SELECT * FROM nas;
-- Should show: Mikrotik routers (if added via panel)
```

**Checklist:**
- [ ] Users: 2
- [ ] Packages: 5
- [ ] RADIUS users: > 0
- [ ] All tables exist

### Service Check
```bash
# Laravel
php artisan --version

# FreeRADIUS
systemctl status freeradius

# MySQL
systemctl status mysql
```

**Checklist:**
- [ ] Laravel: version displayed
- [ ] FreeRADIUS: active (running)
- [ ] MySQL: active (running)

### Mikrotik Check
```routeros
# RADIUS status
/radius print detail

# PPPoE server
/interface pppoe-server server print

# Hotspot
/ip hotspot print
```

**Checklist:**
- [ ] RADIUS configured
- [ ] PPPoE server running
- [ ] Hotspot configured

---

## 🎯 Post-Installation

### Security
- [ ] Change default admin password
- [ ] Change RADIUS secret (production)
- [ ] Enable firewall
- [ ] Setup SSL/HTTPS (production)
- [ ] Regular backups configured

### Monitoring
- [ ] Check FreeRADIUS logs: `journalctl -u freeradius -f`
- [ ] Check Laravel logs: `tail -f storage/logs/laravel.log`
- [ ] Monitor database size
- [ ] Monitor disk space

### Documentation
- [ ] Read `README.md`
- [ ] Read `QUICK_REFERENCE.md`
- [ ] Bookmark `FREERADIUS_INSTALL.md`
- [ ] Save Postman collection

---

## ✅ Installation Complete!

Jika semua checklist di atas sudah ✅, maka instalasi **BERHASIL**!

### Next Steps:
1. 🔄 Develop remaining controllers (Voucher, Reseller, Router)
2. 🔄 Build frontend UI
3. 🔄 Add more features
4. 🔄 Deploy to production

---

## 🐛 Troubleshooting

Jika ada yang tidak berfungsi, check:

### Laravel Issues
- [ ] Check `.env` configuration
- [ ] Run `php artisan config:clear`
- [ ] Check `storage/logs/laravel.log`

### FreeRADIUS Issues
- [ ] Check `journalctl -u freeradius -n 50`
- [ ] Run `sudo freeradius -X` (debug mode)
- [ ] Check SQL module: `/etc/freeradius/3.0/mods-enabled/sql`

### Mikrotik Issues
- [ ] Check `/radius print detail`
- [ ] Check `/log print where topics~"radius"`
- [ ] Test: `/radius monitor 0`

### Database Issues
- [ ] Check MySQL service: `systemctl status mysql`
- [ ] Test connection: `mysql -u radius -p radius`
- [ ] Check tables: `SHOW TABLES;`

---

## 📞 Need Help?

1. Check `QUICK_REFERENCE.md` untuk troubleshooting
2. Check `FREERADIUS_INSTALL.md` untuk FreeRADIUS issues
3. Check documentation files
4. Create issue di repository

---

**Happy Coding! 🚀**
