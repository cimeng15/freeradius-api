# 🔧 Fix Composer Error di Server

## Masalah: "Failed to open stream: No such file or directory"

Composer di server rusak atau tidak terinstall dengan benar.

---

## ✅ Solusi: Reinstall Composer

### Copy-Paste Command Ini:

```bash
# 1. Hapus composer lama
rm -f /usr/bin/composer

# 2. Download composer installer
cd /tmp
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"

# 3. Verify installer (optional)
php -r "if (hash_file('sha384', 'composer-setup.php') === file_get_contents('https://composer.github.io/installer.sig')) { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"

# 4. Install composer
php composer-setup.php --install-dir=/usr/local/bin --filename=composer

# 5. Cleanup
php -r "unlink('composer-setup.php');"

# 6. Verify installation
composer --version

echo ""
echo "✅ Composer installed successfully!"
```

---

## 🚀 Setelah Composer Terinstall

Kembali ke project dan install dependencies:

```bash
# Masuk ke directory project
cd /www/wwwroot/billing.syakirulilmi.my.id

# Install dependencies
composer install --optimize-autoloader --no-dev

# Set permissions
chmod -R 755 .
chmod -R 775 storage bootstrap/cache
chown -R www:www .
```

---

## 🎯 Atau Gunakan Composer dari aaPanel

Jika aaPanel sudah install Composer:

```bash
# Cek lokasi composer dari aaPanel
which composer
# atau
/www/server/composer/composer --version

# Gunakan path lengkap
/www/server/composer/composer install --optimize-autoloader --no-dev
```

---

## 📋 Full Deployment Command

Setelah Composer fixed:

```bash
cd /www/wwwroot/billing.syakirulilmi.my.id

# Install dependencies
composer install --optimize-autoloader --no-dev

# Setup .env (jika belum)
if [ ! -f .env ]; then
    cp .env.example .env
    php artisan key:generate
    echo "⚠️  Please edit .env: nano .env"
fi

# Run migrations
php artisan migrate --force
php artisan db:seed --force

# Create storage link
php artisan storage:link

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chmod -R 755 .
chmod -R 775 storage bootstrap/cache
chown -R www:www .

echo ""
echo "✅ Deployment complete!"
echo "Open: https://billing.syakirulilmi.my.id"
```

---

## 🔍 Troubleshooting

### Composer masih error setelah reinstall?

Gunakan PHP dari aaPanel:

```bash
# Gunakan PHP 8.1 dari aaPanel
/www/server/php/81/bin/php /usr/local/bin/composer install --optimize-autoloader --no-dev
```

### Permission denied saat install composer?

```bash
# Gunakan sudo
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
```

### Composer sangat lambat?

```bash
# Disable xdebug
php -d xdebug.mode=off /usr/local/bin/composer install --optimize-autoloader --no-dev

# Atau increase memory
php -d memory_limit=-1 /usr/local/bin/composer install --optimize-autoloader --no-dev
```

---

## ✅ Verifikasi

```bash
# Cek composer version
composer --version
# Output: Composer version 2.x.x

# Cek PHP version
php -v
# Output: PHP 8.1.x

# Cek vendor directory
ls -la vendor/
# Harus ada: autoload.php, composer/, laravel/, dll
```

---

## 🎉 Setelah Berhasil

1. **Cek website**: https://billing.syakirulilmi.my.id
2. **Login**: admin@example.com / password
3. **Ganti password**: Di settings

---

**Copy-paste command reinstall Composer di atas untuk fix masalah ini! 🚀**
