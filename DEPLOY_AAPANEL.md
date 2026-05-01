# 🚀 Panduan Deploy Cepat - aaPanel

## Langkah 1: Persiapan di aaPanel

### 1.1 Install PHP Extensions
Login ke aaPanel → **App Store** → **PHP 8.1** → **Settings** → **Install Extensions**

Install extensions berikut:
- ✅ dom (php-xml)
- ✅ curl
- ✅ mbstring
- ✅ pdo_mysql
- ✅ zip
- ✅ gd
- ✅ bcmath
- ✅ opcache

Restart PHP-FPM setelah install.

### 1.2 Install Node.js
```bash
# Via aaPanel App Store
App Store → Node.js → Install (versi 18 atau lebih tinggi)

# Atau via SSH
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.3 Setup Database
1. Buat database baru di aaPanel → **Database**
2. Catat: nama database, username, password

### 1.4 Setup Website
1. aaPanel → **Website** → **Add Site**
2. Domain: `billing.syakirulilmi.my.id`
3. Root Directory: `/www/wwwroot/billing.syakirulilmi.my.id`
4. PHP Version: **8.1**
5. **PENTING**: Setelah dibuat, ubah **Run Directory** ke `/public`
   - Klik site → **Settings** → **Site Directory** → Run Directory: `/public`

## Langkah 2: Upload & Deploy

### 2.1 Upload Project
```bash
# SSH ke server
ssh root@your-server-ip

# Masuk ke directory website
cd /www/wwwroot/billing.syakirulilmi.my.id

# Clone atau upload project
git clone https://github.com/your-repo/freeradius-api.git .
# ATAU upload via FTP/SFTP
```

### 2.2 Setup Environment
```bash
# Copy .env
cp .env.example .env

# Edit .env
nano .env
```

Edit bagian berikut di `.env`:
```env
APP_NAME="FreeRADIUS Billing"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://billing.syakirulilmi.my.id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nama_database_anda
DB_USERNAME=username_database_anda
DB_PASSWORD=password_database_anda

RADIUS_HOST=127.0.0.1
RADIUS_AUTH_PORT=1812
RADIUS_ACCT_PORT=1813
RADIUS_SECRET=testing123
```

Save dengan `Ctrl+X`, `Y`, `Enter`

### 2.3 Jalankan Deployment
```bash
# Buat script executable
chmod +x deploy-simple.sh

# Jalankan deployment
bash deploy-simple.sh
```

Script akan otomatis:
- ✅ Build frontend React
- ✅ Install dependencies
- ✅ Generate app key
- ✅ Run migrations & seeders
- ✅ Setup storage link
- ✅ Optimize cache
- ✅ Set permissions

### 2.4 Set Ownership (Penting!)
```bash
# Set ownership ke user web server
sudo chown -R www:www /www/wwwroot/billing.syakirulilmi.my.id
```

## Langkah 3: Verifikasi

### 3.1 Cek File Frontend
```bash
ls -la public/app/
# Harus ada: index.html, assets/, dll
```

### 3.2 Cek Storage Link
```bash
ls -la public/storage
# Harus ada symlink ke ../../storage/app/public
```

### 3.3 Test Website
Buka browser: `https://billing.syakirulilmi.my.id`

Seharusnya muncul aplikasi React, bukan halaman Laravel default.

## Troubleshooting

### ❌ Masih muncul halaman Laravel default
```bash
# Cek apakah frontend sudah di-build
ls public/app/index.html

# Jika tidak ada, build manual
cd frontend
npm install
npm run build
cd ..
```

### ❌ Error 500 / Permission Denied
```bash
# Set permissions
chmod -R 755 /www/wwwroot/billing.syakirulilmi.my.id
chmod -R 775 storage bootstrap/cache
sudo chown -R www:www /www/wwwroot/billing.syakirulilmi.my.id
```

### ❌ API tidak bisa diakses
```bash
# Clear cache
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Re-cache
php artisan config:cache
php artisan route:cache
```

### ❌ Database connection error
```bash
# Cek .env
cat .env | grep DB_

# Test connection
php artisan migrate:status
```

### ❌ Frontend tidak load assets
Pastikan di aaPanel:
1. Site Settings → **Site Directory** → Run Directory: `/public` ✅
2. Site Settings → **Rewrite** → Laravel rewrite rules aktif

## Update Aplikasi

Untuk update di kemudian hari:
```bash
cd /www/wwwroot/billing.syakirulilmi.my.id

# Pull changes (jika pakai git)
git pull

# Re-deploy
bash deploy-simple.sh

# Set ownership
sudo chown -R www:www .
```

## Default Login

Setelah seeding, gunakan:
- **Email**: `admin@example.com`
- **Password**: `password`

⚠️ **PENTING**: Ganti password setelah login pertama!

## Struktur Directory

```
/www/wwwroot/billing.syakirulilmi.my.id/
├── public/              ← Web server root (Run Directory)
│   ├── app/            ← Frontend React (hasil build)
│   │   ├── index.html
│   │   └── assets/
│   ├── storage/        ← Symlink ke storage/app/public
│   └── index.php       ← Laravel entry point
├── frontend/           ← Source code React
├── app/               ← Laravel app
├── storage/           ← File storage
└── .env              ← Configuration
```

## Perintah Berguna

```bash
# Lihat logs
tail -f storage/logs/laravel.log

# Clear semua cache
php artisan optimize:clear

# Re-optimize
php artisan optimize

# Check status
php artisan about

# Test RADIUS
php artisan radius:test username password
```

---

**Butuh bantuan?** Cek file `TROUBLESHOOTING.md` atau logs di `storage/logs/`
