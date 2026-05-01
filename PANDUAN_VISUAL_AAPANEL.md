# 🎨 Panduan Visual - Setup aaPanel

## 1. Install PHP Extensions

### Langkah-langkah:
1. Login ke aaPanel → `http://your-ip:7800`
2. Klik **App Store** (di sidebar kiri)
3. Cari **PHP 8.1**
4. Klik **Settings** (icon gear)
5. Tab **Install Extensions**
6. Install extensions berikut (centang dan klik Install):

```
✅ dom (php-xml)
✅ curl
✅ mbstring
✅ pdo_mysql
✅ zip
✅ gd
✅ bcmath
✅ opcache
```

7. Klik **Restart** PHP-FPM setelah selesai

---

## 2. Install Node.js

### Via aaPanel (Mudah):
1. **App Store** → Cari "Node.js"
2. Klik **Install**
3. Pilih versi **18.x** atau lebih tinggi
4. Tunggu sampai selesai

### Via SSH (Alternatif):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Verifikasi
npm -v   # Verifikasi
```

---

## 3. Setup Database

### Langkah-langkah:
1. aaPanel → **Database** (sidebar kiri)
2. Klik **Add Database**
3. Isi form:
   - **Database Name**: `radius` (atau nama lain)
   - **Username**: `radius_user` (atau nama lain)
   - **Password**: [generate atau buat sendiri]
   - **Access**: `localhost`
4. Klik **Submit**
5. **CATAT** nama database, username, dan password!

---

## 4. Setup Website

### Langkah-langkah:
1. aaPanel → **Website** (sidebar kiri)
2. Klik **Add Site**
3. Isi form:
   ```
   Domain: billing.syakirulilmi.my.id
   Root Directory: /www/wwwroot/billing.syakirulilmi.my.id
   PHP Version: 8.1
   Database: [skip, sudah dibuat di step 3]
   FTP: [skip]
   ```
4. Klik **Submit**

### ⚠️ PENTING - Set Run Directory:
1. Klik site yang baru dibuat
2. Klik **Settings**
3. Tab **Site Directory**
4. **Run Directory**: Ubah dari `/` menjadi `/public`
5. Klik **Save**

### Set Rewrite Rules:
1. Masih di **Settings**
2. Tab **Rewrite**
3. Pilih **Laravel** dari dropdown
4. Klik **Save**

---

## 5. Upload Project

### Via Git (Recommended):
```bash
# SSH ke server
ssh root@your-server-ip

# Masuk ke directory website
cd /www/wwwroot/billing.syakirulilmi.my.id

# Clone project
git clone https://github.com/your-repo/freeradius-api.git .

# Atau jika sudah ada, pull changes
git pull
```

### Via FTP/SFTP:
1. Gunakan FileZilla atau WinSCP
2. Connect ke server
3. Upload semua file ke `/www/wwwroot/billing.syakirulilmi.my.id/`

---

## 6. Setup Environment

```bash
# SSH ke server
ssh root@your-server-ip

# Masuk ke directory
cd /www/wwwroot/billing.syakirulilmi.my.id

# Copy .env
cp .env.example .env

# Edit .env
nano .env
```

### Edit bagian ini di .env:
```env
APP_NAME="FreeRADIUS Billing"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://billing.syakirulilmi.my.id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=radius              ← Sesuaikan dengan step 3
DB_USERNAME=radius_user         ← Sesuaikan dengan step 3
DB_PASSWORD=your_password       ← Sesuaikan dengan step 3
```

Save: `Ctrl+X` → `Y` → `Enter`

---

## 7. Deploy

```bash
# Masih di directory project
cd /www/wwwroot/billing.syakirulilmi.my.id

# Buat script executable
chmod +x deploy-simple.sh

# Jalankan deployment
bash deploy-simple.sh

# Set ownership
sudo chown -R www:www .
```

### Output yang Diharapkan:
```
🚀 Starting simple deployment...
📦 Building frontend...
   ✓ Frontend built successfully
⚙️  Setting up Laravel...
   ✓ Dependencies installed
🗄️  Running migrations...
   ✓ Migrations completed
⚡ Optimizing...
   ✓ Cache cleared
   ✓ Config cached
✅ Deployment completed!
```

---

## 8. Verifikasi

### Cek File Frontend:
```bash
ls -la public/app/
# Harus ada:
# - index.html
# - assets/
```

### Cek Storage Link:
```bash
ls -la public/storage
# Harus ada symlink: storage -> ../../storage/app/public
```

### Test Website:
1. Buka browser
2. Akses: `https://billing.syakirulilmi.my.id`
3. Seharusnya muncul aplikasi React (bukan Laravel default)

### Login:
- Email: `admin@example.com`
- Password: `password`

---

## 9. Setup SSL (Optional tapi Recommended)

### Via aaPanel:
1. Klik site → **Settings**
2. Tab **SSL**
3. Pilih **Let's Encrypt**
4. Centang domain
5. Klik **Apply**
6. Tunggu sampai selesai
7. Enable **Force HTTPS**

---

## 10. Monitoring

### Cek Logs via aaPanel:
1. **Website** → Klik site
2. **Logs** tab
3. Lihat **Access Log** dan **Error Log**

### Cek Logs via SSH:
```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Web server logs
tail -f /www/wwwlogs/billing.syakirulilmi.my.id.log
tail -f /www/wwwlogs/billing.syakirulilmi.my.id.error.log
```

---

## Troubleshooting Visual

### ❌ Masih muncul Laravel default
```
Browser → F12 → Console
Cek error apa yang muncul

Kemungkinan:
1. Frontend belum di-build
   → cd frontend && npm run build
   
2. Cache belum di-clear
   → php artisan optimize:clear
   
3. Run Directory salah
   → aaPanel → Site Settings → Run Directory: /public
```

### ❌ Error 500
```
1. Cek logs:
   tail -50 storage/logs/laravel.log
   
2. Cek permissions:
   ls -la storage/
   ls -la bootstrap/cache/
   
3. Fix permissions:
   chmod -R 775 storage bootstrap/cache
   sudo chown -R www:www .
```

### ❌ Database connection error
```
1. Cek .env:
   cat .env | grep DB_
   
2. Test MySQL:
   mysql -u radius_user -p radius
   
3. Cek MySQL service:
   sudo systemctl status mysql
```

---

## Checklist Akhir

- [ ] PHP 8.1+ installed dengan extensions
- [ ] Node.js 18+ installed
- [ ] Database created
- [ ] Website created di aaPanel
- [ ] Run Directory set ke `/public`
- [ ] Rewrite rules set ke Laravel
- [ ] Project uploaded
- [ ] .env configured
- [ ] `deploy-simple.sh` executed
- [ ] Ownership set ke `www:www`
- [ ] Website accessible
- [ ] Can login
- [ ] SSL installed (optional)

---

**Selamat! Aplikasi Anda sudah live! 🎉**
