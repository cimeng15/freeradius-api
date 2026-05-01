# Troubleshooting Guide

## 🔍 Diagnosis Cepat

### Cek Status Aplikasi
```bash
# Masuk ke directory project
cd /www/wwwroot/billing.syakirulilmi.my.id

# Cek Laravel
php artisan about

# Cek database connection
php artisan migrate:status

# Cek frontend build
ls -la public/app/
```

## ❌ Masalah Umum & Solusi

### 1. Masih Menampilkan Halaman Laravel Default

**Penyebab**: Frontend belum di-build atau route tidak benar

**Solusi**:
```bash
# Build frontend
cd frontend
npm install
npm run build
cd ..

# Cek hasil build
ls public/app/index.html

# Jika file ada, clear cache Laravel
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Re-cache
php artisan config:cache
php artisan route:cache
```

### 2. Error 500 - Internal Server Error

**Penyebab**: Permission atau konfigurasi salah

**Solusi**:
```bash
# Set permissions
chmod -R 755 /www/wwwroot/billing.syakirulilmi.my.id
chmod -R 775 storage bootstrap/cache

# Set ownership
sudo chown -R www:www /www/wwwroot/billing.syakirulilmi.my.id

# Cek logs
tail -50 storage/logs/laravel.log
```

### 3. Error 404 - Not Found

**Penyebab**: Rewrite rules tidak aktif atau Run Directory salah

**Solusi di aaPanel**:
1. Site Settings → **Site Directory**
   - Run Directory: `/public` ✅
2. Site Settings → **Rewrite**
   - Pilih: **Laravel** ✅
3. Restart web server

**Solusi via SSH**:
```bash
# Untuk Apache
sudo a2enmod rewrite
sudo systemctl restart apache2

# Untuk Nginx
sudo systemctl restart nginx
```

### 4. API Returns 404

**Penyebab**: Route cache atau rewrite rules

**Solusi**:
```bash
# Clear route cache
php artisan route:clear

# List all routes
php artisan route:list | grep api

# Re-cache
php artisan route:cache
```

### 5. Database Connection Error

**Penyebab**: Kredensial salah atau MySQL tidak running

**Solusi**:
```bash
# Cek .env
cat .env | grep DB_

# Test MySQL connection
mysql -u username -p database_name

# Jika MySQL tidak running
sudo systemctl start mysql
sudo systemctl enable mysql

# Update .env dengan kredensial yang benar
nano .env

# Clear config cache
php artisan config:clear
```

### 6. Frontend Assets Tidak Load (404)

**Penyebab**: Path salah atau build tidak lengkap

**Solusi**:
```bash
# Cek struktur build
ls -la public/app/
ls -la public/app/assets/

# Rebuild frontend
cd frontend
rm -rf node_modules dist
npm install
npm run build
cd ..

# Cek hasil
ls -la public/app/
```

### 7. Storage/Upload Error

**Penyebab**: Storage link tidak ada atau permission salah

**Solusi**:
```bash
# Hapus link lama (jika ada)
rm -f public/storage

# Buat link baru
php artisan storage:link

# Set permissions
chmod -R 775 storage
sudo chown -R www:www storage

# Cek link
ls -la public/storage
```

### 8. CORS Error di Frontend

**Penyebab**: CORS configuration

**Solusi**:
```bash
# Edit config/cors.php
nano config/cors.php
```

Pastikan:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['*'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

```bash
# Clear config
php artisan config:clear
php artisan config:cache
```

### 9. Session/Auth Error

**Penyebab**: Session configuration atau cache

**Solusi**:
```bash
# Clear sessions
php artisan session:clear

# Clear auth cache
php artisan cache:clear

# Regenerate key
php artisan key:generate

# Update .env
nano .env
# Set: SESSION_DRIVER=file
# Set: SESSION_DOMAIN=billing.syakirulilmi.my.id

# Clear config
php artisan config:clear
php artisan config:cache
```

### 10. Composer/NPM Install Error

**Penyebab**: Memory limit atau dependencies conflict

**Solusi**:
```bash
# Composer memory limit
COMPOSER_MEMORY_LIMIT=-1 composer install

# NPM dengan legacy peer deps
cd frontend
npm install --legacy-peer-deps
cd ..

# Atau gunakan yarn
cd frontend
yarn install
cd ..
```

## 🔧 Perintah Maintenance

### Clear All Cache
```bash
php artisan optimize:clear
# Atau manual:
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
```

### Optimize for Production
```bash
php artisan optimize
# Atau manual:
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Reset Application
```bash
# HATI-HATI: Ini akan menghapus semua data!
php artisan migrate:fresh --seed
```

### Check Logs
```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Web server logs (aaPanel)
tail -f /www/wwwlogs/billing.syakirulilmi.my.id.log
tail -f /www/wwwlogs/billing.syakirulilmi.my.id.error.log

# PHP-FPM logs
tail -f /www/server/php/81/var/log/php-fpm.log
```

## 🔍 Debug Mode

### Enable Debug (Development Only!)
```bash
nano .env
# Set: APP_DEBUG=true
# Set: APP_ENV=local

php artisan config:clear
```

⚠️ **JANGAN aktifkan debug di production!**

### Disable Debug (Production)
```bash
nano .env
# Set: APP_DEBUG=false
# Set: APP_ENV=production

php artisan config:cache
```

## 📊 Performance Issues

### Slow Response Time
```bash
# Enable opcache
# Edit php.ini
nano /www/server/php/81/etc/php.ini

# Pastikan:
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000

# Restart PHP-FPM
sudo systemctl restart php8.1-fpm
```

### High Memory Usage
```bash
# Check memory
free -h

# Optimize composer autoload
composer dump-autoload --optimize

# Clear old logs
rm storage/logs/*.log
```

## 🆘 Emergency Recovery

### Aplikasi Tidak Bisa Diakses Sama Sekali
```bash
# 1. Cek web server
sudo systemctl status nginx
# atau
sudo systemctl status apache2

# 2. Restart web server
sudo systemctl restart nginx
# atau
sudo systemctl restart apache2

# 3. Cek PHP-FPM
sudo systemctl status php8.1-fpm
sudo systemctl restart php8.1-fpm

# 4. Cek MySQL
sudo systemctl status mysql
sudo systemctl restart mysql

# 5. Cek permissions
sudo chown -R www:www /www/wwwroot/billing.syakirulilmi.my.id
chmod -R 755 /www/wwwroot/billing.syakirulilmi.my.id
chmod -R 775 storage bootstrap/cache
```

### Restore dari Backup
```bash
# Restore database
mysql -u username -p database_name < backup.sql

# Restore files
tar -xzf backup.tar.gz -C /www/wwwroot/billing.syakirulilmi.my.id

# Re-run deployment
bash deploy-simple.sh
```

## 📞 Kontak Support

Jika masalah masih berlanjut:
1. Cek logs: `storage/logs/laravel.log`
2. Cek web server logs di `/www/wwwlogs/`
3. Screenshot error message
4. Catat langkah-langkah yang sudah dilakukan

---

**Tips**: Selalu backup database dan files sebelum melakukan perubahan besar!
