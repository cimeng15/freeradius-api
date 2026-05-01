# ✅ Checklist - Siap Deploy

## File yang Sudah Dibuat/Diubah

### ✅ Script Deployment
- [x] `deploy-simple.sh` - Deployment otomatis (no prompts)
- [x] `deploy.sh` - Deployment interaktif
- [x] `test-deploy.sh` - Test deployment
- [x] `make-executable.sh` - Make all scripts executable

### ✅ Dokumentasi Deployment
- [x] `START_HERE.md` - Panduan mulai cepat ⭐
- [x] `UNTUK_ANDA.md` - Panduan khusus untuk situasi Anda ⭐
- [x] `DEPLOY_AAPANEL.md` - Panduan deployment lengkap
- [x] `PANDUAN_VISUAL_AAPANEL.md` - Panduan visual step-by-step
- [x] `TROUBLESHOOTING.md` - Solusi masalah umum
- [x] `DEPLOYMENT_CHECKLIST.md` - Checklist deployment
- [x] `QUICKSTART.md` - Quick start guide
- [x] `SUMMARY_PERBAIKAN.md` - Summary perubahan
- [x] `INDEX_DOKUMENTASI.md` - Index semua dokumentasi

### ✅ File Konfigurasi
- [x] `nginx-aapanel.conf` - Konfigurasi Nginx untuk aaPanel
- [x] `.gitignore` - Updated untuk exclude build files

### ✅ File yang Diubah
- [x] `routes/web.php` - Route untuk serve React app
- [x] `frontend/vite.config.js` - Build config untuk Laravel
- [x] `README.md` - Updated dengan info deployment

## Yang Perlu Anda Lakukan

### 1. Di Local (Opsional)
```bash
# Test deployment di local
cd /Users/syakirulilmi/Documents/freeradius-api
bash test-deploy.sh
```

### 2. Push ke Git (Jika pakai Git)
```bash
git add .
git commit -m "Add deployment scripts and documentation"
git push origin main
```

### 3. Di Server (PENTING!)
```bash
# SSH ke server
ssh root@your-server-ip

# Masuk ke directory
cd /www/wwwroot/billing.syakirulilmi.my.id

# Pull changes (jika pakai git)
git pull

# Atau upload manual via FTP/SFTP
# Upload semua file yang baru dibuat

# Deploy
bash deploy-simple.sh

# Set ownership
sudo chown -R www:www .
```

### 4. Verifikasi
- [ ] Buka https://billing.syakirulilmi.my.id
- [ ] Seharusnya muncul aplikasi React (bukan Laravel default)
- [ ] Login dengan admin@example.com / password
- [ ] Ganti password

## File Penting untuk Dibaca

### Untuk Deploy Sekarang
1. **[START_HERE.md](START_HERE.md)** ⭐⭐⭐ - BACA INI DULU!
2. **[UNTUK_ANDA.md](UNTUK_ANDA.md)** ⭐⭐ - Panduan khusus
3. **[PANDUAN_VISUAL_AAPANEL.md](PANDUAN_VISUAL_AAPANEL.md)** ⭐ - Step-by-step

### Jika Ada Masalah
1. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solusi masalah
2. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Checklist

### Referensi
1. **[INDEX_DOKUMENTASI.md](INDEX_DOKUMENTASI.md)** - Index semua docs
2. **[SUMMARY_PERBAIKAN.md](SUMMARY_PERBAIKAN.md)** - Summary perubahan

## Command Cepat

### Deploy
```bash
bash deploy-simple.sh
```

### Clear Cache
```bash
php artisan optimize:clear
```

### Rebuild Frontend
```bash
cd frontend && npm run build && cd ..
```

### Fix Permissions
```bash
chmod -R 775 storage bootstrap/cache
sudo chown -R www:www .
```

### Check Logs
```bash
tail -50 storage/logs/laravel.log
```

## Struktur Setelah Deploy

```
/www/wwwroot/billing.syakirulilmi.my.id/
├── public/
│   ├── app/              ← Frontend React (BARU!)
│   │   ├── index.html
│   │   └── assets/
│   ├── storage/          ← Symlink (sudah ada)
│   └── index.php
├── frontend/             ← Source code React
├── storage/
├── .env
└── deploy-simple.sh      ← Script deployment (BARU!)
```

## Flow Request

```
User → https://billing.syakirulilmi.my.id
  ↓
Nginx/Apache → public/index.php (Laravel)
  ↓
routes/web.php
  ↓
  ├─→ /api/* → API routes (JSON)
  ├─→ /storage/* → Static files
  └─→ /* → public/app/index.html (React app) ← INI YANG BARU!
```

## Verifikasi Deployment

### Cek File
```bash
# Harus ada file ini
ls -la public/app/index.html
ls -la public/app/assets/

# Harus ada symlink ini
ls -la public/storage
```

### Cek Website
- Buka: https://billing.syakirulilmi.my.id
- ✅ Muncul aplikasi React dengan UI modern
- ❌ Bukan halaman Laravel default dengan logo Laravel

### Cek Login
- Email: admin@example.com
- Password: password
- ✅ Bisa login
- ✅ Dashboard muncul

## Troubleshooting Cepat

### Masih Laravel Default?
```bash
cd frontend && npm run build && cd ..
php artisan optimize:clear
```

### Error 500?
```bash
chmod -R 775 storage bootstrap/cache
sudo chown -R www:www .
tail -50 storage/logs/laravel.log
```

### API Error?
```bash
php artisan route:clear
php artisan route:cache
```

## Status Saat Ini

- [x] Code sudah diperbaiki
- [x] Script deployment sudah dibuat
- [x] Dokumentasi sudah lengkap
- [ ] **Anda perlu deploy ke server** ← LANGKAH SELANJUTNYA!

## Next Steps

1. **Baca**: [START_HERE.md](START_HERE.md)
2. **Deploy**: `bash deploy-simple.sh` di server
3. **Verifikasi**: Buka website
4. **Login**: admin@example.com / password
5. **Ganti password**: Di settings

---

**Semua sudah siap! Tinggal deploy ke server! 🚀**

Jika ada pertanyaan, cek [INDEX_DOKUMENTASI.md](INDEX_DOKUMENTASI.md) untuk menemukan dokumentasi yang tepat.
