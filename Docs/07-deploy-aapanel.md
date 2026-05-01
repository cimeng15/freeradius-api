# Deploy ke aaPanel

## 1. Install PHP Extensions yang Dibutuhkan

### Via aaPanel Web Interface (Recommended)
1. Login ke aaPanel (port 7800)
2. Klik **App Store** → **PHP 8.1** → **Settings**
3. Tab **Install Extensions**, install:
   - ✅ **dom** (php-xml)
   - ✅ **curl**
   - ✅ **mbstring**
   - ✅ **pdo_mysql**
   - ✅ **zip**
   - ✅ **gd**
   - ✅ **bcmath**
   - ✅ **opcache**

4. Restart PHP-FPM setelah install

### Via SSH (Alternatif)
```bash
# Install PHP extensions
sudo apt update
sudo apt install -y php8.1-dom php8.1-xml php8.1-curl php8.1-mbstring php8.1-mysql php8.1-zip php8.1-gd php8.1-bcmath

# Restart PHP-FPM
sudo systemctl restart php8.1-fpm
```

### Fix PHP Version Mismatch (Jika ada error module API)

**Masalah:** PHP 8.1 mencoba load extensions dari PHP 8.3 (`Module API=20230831` vs `20210902`)

**Solusi:**
```bash
# 1. Cek file konfigurasi PHP yang digunakan
php --ini

# 2. Edit php.ini untuk PHP 8.1 CLI
sudo nano /etc/php/8.1/cli/php.ini

# 3. Cari dan comment/hapus baris yang load extensions dari PHP 8.3:
# Cari baris seperti ini dan comment dengan ; di depannya:
# extension=/www/server/php/83/lib/php/extensions/...
# zend_extension=/www/server/php/83/lib/php/extensions/...

# Atau hapus semua symlink ke PHP 8.3:
sudo rm -f /etc/php/8.1/cli/conf.d/*83*
sudo rm -f /etc/php/8.1/fpm/conf.d/*83*

# 4. Restart PHP-FPM
sudo systemctl restart php8.1-fpm

# 5. Verifikasi (tidak boleh ada error)
php -v
php -m  # List semua modules
```

**Alternatif: Gunakan PHP 8.1 dari aaPanel langsung**
```bash
# Gunakan PHP binary dari aaPanel
/www/server/php/81/bin/php -v

# Buat alias permanent
echo "alias php='/www/server/php/81/bin/php'" >> ~/.bashrc
source ~/.bashrc

# Verifikasi
php -v  # Harus bersih tanpa error
```

## 2. Setup Project

```bash
# Jangan gunakan sudo untuk composer!
cd /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api

# Install dependencies (tanpa sudo)
composer install --optimize-autoloader --no-dev

# Setup environment
cp .env.example .env
nano .env

# Generate key
php artisan key:generate

# Setup database
php artisan migrate --force
php artisan db:seed --force

# Setup storage
php artisan storage:link

# Set permissions
chown -R www:www /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api
chmod -R 755 /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api
chmod -R 775 storage bootstrap/cache
```

## 3. Setup Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

## 4. Konfigurasi Nginx di aaPanel

1. **Website** → **billing.syakirulilmi.my.id** → **Settings**
2. **Site Directory** → Set ke: `/www/wwwroot/billing.syakirulilmi.my.id/freeradius-api/public`
3. **Run Directory** → Enable
4. **Rewrite** → Pilih **Laravel**

Atau manual edit Nginx config:

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}

location ~ \.php$ {
    fastcgi_pass unix:/tmp/php-cgi-81.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}
```

## 5. Setup Database di aaPanel

1. **Database** → **Add Database**
   - Database Name: `freeradius_api`
   - Username: `freeradius_user`
   - Password: (generate strong password)

2. **PENTING: Fix MySQL Remote Access**
   
   Error `Host 'xxx' is not allowed to connect` terjadi karena MySQL tidak mengizinkan koneksi dari hostname server.
   
   **Solusi 1: Gunakan localhost (Recommended)**
   ```env
   DB_HOST=localhost
   # atau
   DB_HOST=127.0.0.1
   ```
   
   **Solusi 2: Grant privileges untuk hostname**
   ```bash
   # Login ke MySQL
   mysql -u root -p
   
   # Grant privileges
   GRANT ALL PRIVILEGES ON freeradius_api.* TO 'freeradius_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON freeradius_api.* TO 'freeradius_user'@'%' IDENTIFIED BY 'your_password';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. Update `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=freeradius_api
DB_USERNAME=freeradius_user
DB_PASSWORD=your_password_here
```

## 6. Setup FreeRADIUS

```bash
# Install FreeRADIUS
sudo apt install -y freeradius freeradius-mysql

# Konfigurasi database
sudo nano /etc/freeradius/3.0/mods-available/sql

# Enable SQL module
sudo ln -s /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/

# Import schema
mysql -u freeradius_user -p freeradius_api < /etc/freeradius/3.0/mods-config/sql/main/mysql/schema.sql

# Restart FreeRADIUS
sudo systemctl restart freeradius
```

## 7. SSL Certificate (Let's Encrypt)

Di aaPanel:
1. **Website** → **billing.syakirulilmi.my.id** → **SSL**
2. Pilih **Let's Encrypt**
3. Klik **Apply**

## 8. Cron Jobs (Opsional)

Di aaPanel → **Cron**:
```bash
# Laravel Scheduler (setiap menit)
* * * * * cd /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api && php artisan schedule:run >> /dev/null 2>&1
```

## 9. Update Code (Git Pull)

Buat script: `/www/wwwroot/billing.syakirulilmi.my.id/deploy.sh`

```bash
#!/bin/bash
cd /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api

echo "🔄 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
composer install --optimize-autoloader --no-dev

echo "🗄️ Running migrations..."
php artisan migrate --force

echo "🧹 Clearing cache..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🎨 Building frontend..."
cd frontend
npm installHP Module API Mismatch
```bash
# Cek PHP version
php -v

# Jika menunjukkan PHP 8.3 tapi project butuh 8.1:
sudo update-alternatives --set php /usr/bin/php8.1

# Atau gunakan PHP 8.1 langsung untuk artisan
/usr/bin/php8.1 artisan migrate
```

### Error: Host not allowed to connect to MySQL
```bash
# Edit .env, ganti DB_HOST
DB_HOST=localhost  # Bukan 127.0.0.1 atau hostname

# Atau grant privileges
mysql -u root -p
GRANT ALL PRIVILEGES ON freeradius_api.* TO 'freeradius_user'@'localhost' IDENTIFIED BY 'password';
FLUSH PRIVILEGES;
```

### Error: P
npm run build
cd ..

echo "🔧 Setting permissions..."
chown -R www:www /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api
chmod -R 755 /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api
chmod -R 775 storage bootstrap/cache

echo "✅ Deploy complete!"
```

```bash
chmod +x /www/wwwroot/billing.syakirulilmi.my.id/deploy.sh
```

Untuk update:
```bash
./deploy.sh
```

## 10. Troubleshooting

### Error: Permission Denied
```bash
chown -R www:www /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api
chmod -R 775 storage bootstrap/cache
```

### Error: 500 Internal Server Error
```bash
# Cek logs
tail -f storage/logs/laravel.log
tail -f /www/wwwlogs/billing.syakirulilmi.my.id.error.log

# Clear cache
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### Error: SQLSTATE Connection Refused
- Pastikan MySQL running: `sudo systemctl status mysql`
- Cek credentials di `.env`
- Test koneksi: `php artisan tinker` → `DB::connection()->getPdo();`

### Frontend tidak muncul
```bash
cd frontend
npm run build
cd ..
php artisan storage:link
```

## 11. Monitoring

```bash
# Cek PHP version & extensions
php -v
php -m | grep -E 'dom|xml|curl|mbstring'

# Cek FreeRADIUS
sudo systemctl status freeradius
sudo freeradius -X  # Debug mode

# Cek Nginx
sudo nginx -t
sudo systemctl status nginx
```

## 12. Security Checklist

- ✅ `.env` file permissions: `chmod 600 .env`
- ✅ `APP_DEBUG=false` di production
- ✅ `APP_ENV=production`
- ✅ SSL certificate installed
- ✅ Firewall configured (port 80, 443, 1812, 1813)
- ✅ Database user dengan privileges minimal
- ✅ Backup database regular

## 13. Backup

```bash
# Backup database
mysqldump -u freeradius_user -p freeradius_api > backup_$(date +%Y%m%d).sql

# Backup files
tar -czf backup_files_$(date +%Y%m%d).tar.gz /www/wwwroot/billing.syakirulilmi.my.id/freeradius-api
```

Setup backup otomatis di aaPanel → **Cron** → **Backup**.
