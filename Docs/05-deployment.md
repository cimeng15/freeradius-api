# 5. Deployment (Production)

## Server Requirements

- Ubuntu 22.04+ / Debian 12+
- PHP 8.1+ dengan extensions: mysql, mbstring, xml, curl, zip, bcmath
- MySQL 8.0+
- FreeRADIUS 3.x
- Nginx
- Node.js 18+ (untuk build frontend)

## Step-by-Step

### 1. Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y php8.1 php8.1-fpm php8.1-mysql php8.1-mbstring php8.1-xml php8.1-curl php8.1-zip php8.1-bcmath
sudo apt install -y mysql-server nginx freeradius freeradius-mysql freeradius-utils
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer
```

### 2. Setup Database

```bash
sudo mysql -u root << 'EOF'
CREATE DATABASE radius CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'radius'@'localhost' IDENTIFIED BY 'PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON radius.* TO 'radius'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 3. Deploy Laravel

```bash
cd /var/www
git clone <repo-url> radiusbill
cd radiusbill
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
# Edit .env: DB, APP_URL, APP_ENV=production, APP_DEBUG=false
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache && php artisan route:cache
sudo chown -R www-data:www-data storage bootstrap/cache
```

### 4. Build Frontend

```bash
cd frontend && npm install && npm run build
cp -r dist/* ../public/
```

### 5. Configure FreeRADIUS

```bash
sudo ln -sf /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql
# Edit /etc/freeradius/3.0/mods-enabled/sql → set server, login, password, radius_db
# Edit /etc/freeradius/3.0/sites-enabled/default → tambah 'sql' di authorize, accounting, session, post-auth
# Edit /etc/freeradius/3.0/clients.conf → tambah IP Mikrotik
sudo systemctl restart freeradius && sudo systemctl enable freeradius
```

### 6. Configure Nginx

```nginx
server {
    listen 80;
    server_name billing.domain.com;
    root /var/www/radiusbill/public;
    index index.php;
    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/radiusbill /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d billing.domain.com  # SSL
```

## Update

```bash
cd /var/www/radiusbill
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
cd frontend && npm install && npm run build && cp -r dist/* ../public/
php artisan config:cache && php artisan route:cache
sudo systemctl restart php8.1-fpm nginx
```
