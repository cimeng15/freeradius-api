# 🔧 Setup Git di Server

## Masalah: "fatal: not a git repository"

Project di server belum di-clone dari Git. Ada 2 cara:

---

## ✅ Cara 1: Clone Fresh (Recommended)

### Langkah 1: Backup Data Lama (Jika Ada)
```bash
# Backup database (jika sudah ada data)
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql

# Backup .env
cp /www/wwwroot/billing.syakirulilmi.my.id/.env ~/backup_env
```

### Langkah 2: Hapus Directory Lama
```bash
cd /www/wwwroot/
rm -rf billing.syakirulilmi.my.id
```

### Langkah 3: Clone dari Git
```bash
cd /www/wwwroot/
git clone https://github.com/cimeng15/freeradius-api.git billing.syakirulilmi.my.id
cd billing.syakirulilmi.my.id
```

### Langkah 4: Setup Environment
```bash
# Copy .env dari backup atau buat baru
cp ~/backup_env .env
# ATAU
cp .env.example .env
nano .env  # Edit database credentials
```

### Langkah 5: Set Permissions
```bash
chmod -R 755 .
chmod -R 775 storage bootstrap/cache
sudo chown -R www:www .
```

### Langkah 6: Clear Cache
```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

**Selesai!** Buka: https://billing.syakirulilmi.my.id

---

## ✅ Cara 2: Init Git di Directory Yang Ada

Jika Anda ingin keep file yang sudah ada:

### Langkah 1: Init Git
```bash
cd /www/wwwroot/billing.syakirulilmi.my.id
git init
```

### Langkah 2: Add Remote
```bash
git remote add origin https://github.com/cimeng15/freeradius-api.git
```

### Langkah 3: Fetch & Reset
```bash
git fetch origin
git reset --hard origin/main
```

### Langkah 4: Set Permissions
```bash
chmod -R 755 .
chmod -R 775 storage bootstrap/cache
sudo chown -R www:www .
```

### Langkah 5: Clear Cache
```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

---

## 🎯 Cara Tercepat (Jika Tidak Ada Data Penting)

```bash
# 1. Hapus directory lama
cd /www/wwwroot/
rm -rf billing.syakirulilmi.my.id

# 2. Clone fresh
git clone https://github.com/cimeng15/freeradius-api.git billing.syakirulilmi.my.id

# 3. Setup .env
cd billing.syakirulilmi.my.id
cp .env.example .env
nano .env  # Edit DB credentials

# 4. Deploy
bash deploy-simple.sh

# 5. Set ownership
sudo chown -R www:www .
```

**Selesai!** Frontend sudah ada di `public/app/` karena sudah di-commit.

---

## 📋 Checklist Setelah Clone

- [ ] `.env` file configured
- [ ] Database credentials correct
- [ ] `public/app/` directory exists (frontend build)
- [ ] `public/storage` symlink exists
- [ ] Permissions correct (755 & 775)
- [ ] Ownership set to `www:www`
- [ ] Cache cleared
- [ ] Website accessible

---

## 🔍 Verifikasi

### Cek Git Status
```bash
cd /www/wwwroot/billing.syakirulilmi.my.id
git status
git log --oneline -5
```

### Cek Frontend Files
```bash
ls -la public/app/
# Harus ada: index.html, assets/, favicon.svg
```

### Cek Permissions
```bash
ls -la storage/
ls -la bootstrap/cache/
# Harus writable (775)
```

---

## 🆘 Troubleshooting

### Error: Permission denied
```bash
sudo chown -R www:www /www/wwwroot/billing.syakirulilmi.my.id
```

### Error: Storage not writable
```bash
chmod -R 775 storage bootstrap/cache
```

### Frontend tidak muncul
```bash
# Cek apakah file ada
ls -la public/app/index.html

# Jika tidak ada (seharusnya ada karena sudah di-commit)
cd frontend
npm install
npm run build
cd ..
```

---

## 📝 Update di Kemudian Hari

Setelah setup Git, untuk update:

```bash
cd /www/wwwroot/billing.syakirulilmi.my.id
git pull
sudo chown -R www:www .
php artisan optimize:clear
php artisan config:cache
```

---

## 🎉 Kesimpulan

**Pilih Cara 1 (Clone Fresh)** jika:
- ✅ Belum ada data penting di server
- ✅ Ingin setup yang bersih
- ✅ Lebih mudah dan cepat

**Pilih Cara 2 (Init Git)** jika:
- ✅ Ada file yang ingin di-keep
- ✅ Sudah ada database dengan data
- ✅ Ingin preserve existing files

---

**Recommended**: Gunakan **Cara 1 (Clone Fresh)** untuk hasil terbaik!
