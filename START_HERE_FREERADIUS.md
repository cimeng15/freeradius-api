# 🎯 CARA SETUP FREERADIUS - SUPER SIMPLE

## Konsep Utama
**Setup FreeRADIUS sekali saja, manage selamanya dari panel web!**

Semua data (routers, clients, vouchers) disimpan di database MySQL.
FreeRADIUS hanya baca dari database, tidak perlu edit config file lagi.

---

## 📋 Langkah Setup (3 Langkah Saja!)

### 1️⃣ Setup MySQL di aaPanel (5 menit)

Login ke server aaPanel:
```bash
ssh root@billing.syakirulilmi.my.id
mysql -u root -p
```

Jalankan SQL ini:
```sql
CREATE USER 'radius_user'@'%' IDENTIFIED BY 'password_kuat_123';
GRANT ALL PRIVILEGES ON radius.* TO 'radius_user'@'%';
FLUSH PRIVILEGES;
exit;
```

Buka firewall:
```bash
ufw allow from 192.168.15.201 to any port 3306
```

**Selesai!** MySQL siap.

---

### 2️⃣ Install FreeRADIUS di Proxmox CT (10 menit)

Upload installer ke CT:
```bash
scp install-freeradius-auto.sh root@192.168.15.201:/root/
```

Login ke CT dan jalankan:
```bash
ssh root@192.168.15.201
chmod +x install-freeradius-auto.sh
./install-freeradius-auto.sh
```

Script akan tanya:
- MySQL Server IP: **192.168.15.200** (IP aaPanel)
- Database Name: **radius** (tekan Enter)
- MySQL Username: **radius_user** (tekan Enter)
- MySQL Password: **password_kuat_123** (yang dibuat di step 1)

Script akan otomatis:
- ✅ Install FreeRADIUS
- ✅ Configure SQL module
- ✅ Setup firewall
- ✅ Test database connection
- ✅ Start service

**Selesai!** FreeRADIUS running.

---

### 3️⃣ Gunakan Panel Web (Selamanya!)

Buka panel: **https://billing.syakirulilmi.my.id**

#### Tambah Router:
1. Menu **Routers** → **Add Router**
2. Isi: Name, IP (192.168.88.1), Secret (testing123)
3. Save
4. **Otomatis masuk ke FreeRADIUS!** (tidak perlu restart)

#### Tambah Client:
1. Menu **Clients** → **Add Client**
2. Isi: Username, Password, Speed Profile
3. Save
4. **Langsung bisa login!**

#### Generate Voucher:
1. Menu **Vouchers** → **Generate**
2. Pilih package, quantity
3. Generate
4. **Voucher langsung aktif!**

---

## ✅ Keuntungan Setup Ini

| Sebelum | Sesudah |
|---------|---------|
| Edit `/etc/freeradius/clients.conf` manual | Tambah router dari panel |
| Edit `/etc/freeradius/users` manual | Tambah client dari panel |
| Restart FreeRADIUS setiap perubahan | Tidak perlu restart |
| SSH ke server untuk manage | Manage dari browser |
| Ribet! | Simple! |

---

## 🔧 Troubleshooting

### FreeRADIUS tidak start?
```bash
freeradius -X
```
Lihat error di output.

### Router tidak connect?
```bash
# Cek router di database
mysql -h 192.168.15.200 -u radius_user -p radius -e "SELECT * FROM nas;"

# Ping router
ping 192.168.88.1
```

### User tidak bisa login?
```bash
# Test auth
radtest username password 127.0.0.1 1812 testing123

# Cek logs
tail -f /var/log/freeradius/radius.log
```

---

## 📚 File Penting

1. **install-freeradius-auto.sh** - Installer otomatis
2. **SETUP_FREERADIUS_SIMPLE.md** - Guide lengkap
3. **QUICK_COMMANDS.md** - Command reference

---

## 🎉 Kesimpulan

**3 langkah setup:**
1. Buat user MySQL (5 menit)
2. Jalankan installer (10 menit)
3. Manage dari panel (selamanya!)

**Tidak perlu lagi:**
- ❌ Edit config file FreeRADIUS
- ❌ Restart service setiap perubahan
- ❌ SSH ke server untuk manage

**Semua dari panel web!** 🚀

---

## 📞 Next Steps

1. Jalankan installer: `./install-freeradius-auto.sh`
2. Buka panel: https://billing.syakirulilmi.my.id
3. Tambah router pertama
4. Test login dari Mikrotik
5. Done! 🎊

**Setup once, manage forever!**
