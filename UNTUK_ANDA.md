# 🎯 UNTUK ANDA - Cara Deploy ke https://billing.syakirulilmi.my.id

## Masalah Saat Ini
✅ Database sudah migrate & seed
✅ Storage link sudah dibuat
❌ Website masih menampilkan halaman Laravel default
❌ Frontend React belum di-build

## Solusi: Build Frontend

### Via SSH (Recommended)

```bash
# 1. SSH ke server
ssh root@your-server-ip

# 2. Masuk ke directory project
cd /www/wwwroot/billing.syakirulilmi.my.id

# 3. Jalankan deployment otomatis
bash deploy-simple.sh

# 4. Set ownership
sudo chown -R www:www .
```

**Selesai!** Website akan menampilkan aplikasi React.

---

## Jika Belum Ada Node.js di Server

### Install Node.js via aaPanel
1. Login ke aaPanel (port 7800)
2. **App Store** → Cari "Node.js"
3. Install **Node.js** (versi 18 atau lebih tinggi)
4. Tunggu sampai selesai
5. Jalankan deployment script di atas

### Atau Install via SSH
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi
node -v
npm -v

# Lanjut deployment
cd /www/wwwroot/billing.syakirulilmi.my.id
bash deploy-simple.sh
sudo chown -R www:www .
```

---

## Apa yang Dilakukan Script `deploy-simple.sh`?

1. ✅ Build frontend React → `public/app/`
2. ✅ Install composer dependencies
3. ✅ Generate app key (jika belum)
4. ✅ Run migrations & seeders
5. ✅ Create storage link
6. ✅ Cache config, routes, views
7. ✅ Set permissions

---

## Verifikasi Setelah Deploy

### 1. Cek File Frontend
```bash
ls -la public/app/
# Harus ada: index.html, assets/, dll
```

### 2. Cek Storage Link
```bash
ls -la public/storage
# Harus ada symlink
```

### 3. Test Website
Buka browser: `https://billing.syakirulilmi.my.id`

Seharusnya muncul:
- ✅ Aplikasi React dengan UI modern
- ✅ Login page
- ❌ Bukan halaman Laravel default

---

## Login Default

Setelah berhasil:
- **Email**: `admin@example.com`
- **Password**: `password`

⚠️ **Ganti password setelah login pertama!**

---

## Jika Masih Bermasalah

### Clear Cache Laravel
```bash
cd /www/wwwroot/billing.syakirulilmi.my.id
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

### Rebuild Frontend Manual
```bash
cd /www/wwwroot/billing.syakirulilmi.my.id/frontend
npm install
npm run build
cd ..
```

### Cek Logs
```bash
# Laravel logs
tail -50 storage/logs/laravel.log

# Web server logs
tail -50 /www/wwwlogs/billing.syakirulilmi.my.id.error.log
```

---

## Struktur Setelah Deploy

```
/www/wwwroot/billing.syakirulilmi.my.id/
├── public/                    ← Web root (Run Directory)
│   ├── app/                  ← Frontend React (BARU!)
│   │   ├── index.html       ← File utama
│   │   └── assets/          ← CSS, JS, images
│   ├── storage/             ← Symlink (sudah ada)
│   └── index.php            ← Laravel entry
├── frontend/                 ← Source code React
├── storage/                  ← File storage
└── .env                     ← Config
```

---

## Kontak Jika Butuh Bantuan

Kirim screenshot dari:
1. Output command `ls -la public/app/`
2. Error di browser (F12 → Console)
3. Logs: `tail -50 storage/logs/laravel.log`

---

**Semoga berhasil! 🚀**
