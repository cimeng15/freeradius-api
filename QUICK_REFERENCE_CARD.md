# ⚡ Quick Reference Card

## 🚀 Deploy (3 Commands)

```bash
cd /www/wwwroot/billing.syakirulilmi.my.id
bash deploy-simple.sh
sudo chown -R www:www .
```

---

## 📚 Dokumentasi (Baca Berurutan)

1. **[START_HERE.md](START_HERE.md)** ⭐⭐⭐ - Mulai di sini!
2. **[UNTUK_ANDA.md](UNTUK_ANDA.md)** ⭐⭐ - Panduan khusus
3. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** ⭐ - Jika ada masalah

---

## 🔑 Login Default

- Email: `admin@example.com`
- Password: `password`

---

## 🛠️ Commands

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

---

## ✅ Verifikasi

### Cek File
```bash
ls -la public/app/index.html
ls -la public/storage
```

### Cek Website
- URL: https://billing.syakirulilmi.my.id
- ✅ Muncul React app
- ❌ Bukan Laravel default

---

## 🆘 Troubleshooting

### Laravel Default?
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

### No Node.js?
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 📁 File Structure

```
public/
├── app/              ← React build (BARU!)
│   ├── index.html
│   └── assets/
├── storage/          ← Symlink
└── index.php         ← Laravel entry
```

---

## 🔄 Update

```bash
cd /www/wwwroot/billing.syakirulilmi.my.id
git pull
bash deploy-simple.sh
sudo chown -R www:www .
```

---

**Print atau bookmark halaman ini untuk referensi cepat!**
