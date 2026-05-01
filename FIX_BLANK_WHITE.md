# 🔧 FIX: Blank Putih / Assets 404

## Masalah yang Ditemukan

Website memuat `index.html` tapi CSS dan JS tidak load (404 error):
- ❌ `/assets/index-CvXwEHJF.css` → 404
- ❌ `/assets/index-DmN915E0.js` → 404

**Root Cause**: Base path salah di Vite config. Seharusnya `/app/` bukan `/`

## ✅ Sudah Diperbaiki

File `frontend/vite.config.js` sudah diupdate:
- ❌ `base: '/'` 
- ✅ `base: '/app/'`

Frontend sudah di-rebuild dan di-push ke Git (commit `770a4e5`)

---

## 🚀 Update di Server (Copy Command Ini)

```bash
# 1. Masuk ke directory
cd /www/wwwroot/billing.syakirulilmi.my.id

# 2. Pull changes
git pull

# 3. Clear cache Laravel
php artisan optimize:clear
php artisan config:cache
php artisan route:cache

# 4. Set permissions
chown -R www:www .

# 5. Restart PHP-FPM (optional tapi recommended)
systemctl restart php8.1-fpm
```

---

## 🔍 Verifikasi

### Cek File Assets
```bash
ls -la public/app/assets/
# Harus ada file CSS dan JS baru
```

### Test Website
Buka: https://billing.syakirulilmi.my.id

Seharusnya sekarang:
- ✅ Tidak blank putih lagi
- ✅ Aplikasi React muncul
- ✅ UI lengkap dengan styling
- ✅ No 404 errors di console

### Cek Browser Console
1. Buka website
2. Tekan F12
3. Tab Console
4. Seharusnya tidak ada error 404

---

## 📋 Jika Masih Blank

### Clear Browser Cache
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Clear Server Cache
```bash
cd /www/wwwroot/billing.syakirulilmi.my.id

# Clear all cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Re-cache
php artisan config:cache
php artisan route:cache
```

### Restart Web Server
```bash
# Nginx
systemctl restart nginx

# Apache
systemctl restart apache2

# PHP-FPM
systemctl restart php8.1-fpm
```

---

## 🎯 Penjelasan Teknis

### Sebelum Fix
```
Browser request: /assets/index.js
Server mencari: /www/wwwroot/.../public/assets/index.js
Result: 404 (file tidak ada di sana)
```

### Setelah Fix
```
Browser request: /app/assets/index.js
Server mencari: /www/wwwroot/.../public/app/assets/index.js
Result: 200 (file ditemukan!)
```

### File Structure
```
public/
├── app/                    ← Base path
│   ├── index.html
│   └── assets/            ← Assets ada di sini
│       ├── index-*.css
│       └── index-*.js
├── storage/
└── index.php
```

---

## ✅ Setelah Update

Website akan menampilkan:
- ✅ Login page dengan styling
- ✅ Logo dan icons
- ✅ Form input yang styled
- ✅ Buttons dengan warna
- ✅ Responsive layout

Login:
- Email: `admin@example.com`
- Password: `password`

---

**Copy command update di atas dan jalankan di server! 🚀**
