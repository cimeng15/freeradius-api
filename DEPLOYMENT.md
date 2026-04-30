# 🚀 Deployment Guide - RadiusBill

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    DEVELOPMENT (Mac)                      │
│                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Laravel  │───▶│  MySQL (Docker) │◀───│ FreeRADIUS   │  │
│  │  :8000   │    │  :3306        │    │  (Docker)    │  │
│  └──────────┘    └──────────────┘    │  :1812/udp   │  │
│  ┌──────────┐                        └──────────────┘  │
│  │ Frontend │                                           │
│  │  :3000   │                                           │
│  └──────────┘                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   PRODUCTION (Server)                     │
│                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Laravel  │───▶│    MySQL      │◀───│ FreeRADIUS   │  │
│  │  (Nginx) │    │  (native)    │    │  (native)    │  │
│  └──────────┘    └──────────────┘    │  :1812/udp   │  │
│  ┌──────────┐                        └──────────────┘  │
│  │ Frontend │                               ▲           │
│  │ (static) │                               │           │
│  └──────────┘                        ┌──────────────┐  │
│                                      │   Mikrotik    │  │
│                                      │   Router(s)   │  │
│                                      └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🖥️ Setup Lokal (Mac - Development)

### Prerequisites
- Docker Desktop for Mac
- PHP 8.1+ (via Homebrew)
- Composer
- Node.js 18+
- MySQL client (optional, untuk debugging)

### Quick Start

```bash
# 1. Clone & install
cd freeradius-api
composer install
cd frontend && npm install && cd ..

# 2. Setup environment
cp .env.example .env
php artisan key:generate

# 3. Start Docker (MySQL + FreeRADIUS)
docker compose up -d

# 4. Wait for MySQL, then migrate
sleep 10
php artisan migrate:fresh --seed

# 5. Start Laravel
php artisan serve

# 6. Start Frontend (terminal baru)
cd frontend && npm run dev
```

Atau gunakan script otomatis:
```bash
chmod +x docker/start-dev.sh
./docker/start-dev.sh
```

### Test FreeRADIUS

```bash
# Install radtest (Mac)
brew install freeradius-server

# Test authentication
radtest budi-pppoe password 127.0.0.1 0 testing123

# Atau via Docker
docker exec radius-server radtest budi-pppoe password localhost 0 testing123
```

### Stop Development

```bash
docker compose down          # Stop containers (data tetap)
docker compose down -v       # Stop + hapus data (fresh start)
```

---

## 🌐 Setup Production (Ubuntu/Debian Server)

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PHP 8.1
sudo apt install -y php8.1 php8.1-fpm php8.1-mysql php8.1-mbstring \
    php8.1-xml php8.1-curl php8.1-zip php8.1-bcmath

# Install MySQL
sudo apt install -y mysql-server

# Install FreeRADIUS
sudo apt install -y freeradius freeradius-mysql freeradius-utils

# Install Nginx
sudo apt install -y nginx

# Install Node.js (untuk build frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 2. Setup Database

```bash
sudo mysql -u root << 'EOF'
CREATE DATABASE radius CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'radius'@'localhost' IDENTIFIED BY 'password_kuat_disini';
GRANT ALL PRIVILEGES ON radius.* TO 'radius'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 3. Deploy Laravel

```bash
# Clone project
cd /var/www
git clone <your-repo-url> radiusbill
cd radiusbill

# Install dependencies
composer install --no-dev --optimize-autoloader

# Setup environment
cp .env.example .env
php artisan key:generate
```

Edit `.env` untuk production:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://billing.yourdomain.com

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=radius
DB_USERNAME=radius
DB_PASSWORD=password_kuat_disini

# FreeRADIUS (di server yang sama)
RADIUS_HOST=127.0.0.1
RADIUS_AUTH_PORT=1812
RADIUS_ACCT_PORT=1813
RADIUS_SECRET=secret_radius_production_kuat
```

```bash
# Migrate & seed
php artisan migrate --force
php artisan db:seed --force

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 4. Build Frontend

```bash
cd frontend
npm install
npm run build

# Copy build ke public Laravel (atau serve terpisah)
cp -r dist/* ../public/
```

### 5. Configure FreeRADIUS (Production)

```bash
# Enable SQL module
sudo ln -sf /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/sql

# Edit SQL config
sudo nano /etc/freeradius/3.0/mods-enabled/sql
```

Isi konfigurasi SQL:
```
sql {
    driver = "rlm_sql_mysql"
    dialect = "mysql"
    server = "localhost"
    port = 3306
    login = "radius"
    password = "password_kuat_disini"
    radius_db = "radius"
    read_clients = yes
    client_table = "nas"
}
```

```bash
# Edit default site untuk gunakan SQL
sudo nano /etc/freeradius/3.0/sites-enabled/default
# Tambahkan 'sql' di section authorize, accounting, session, post-auth

# Edit clients.conf - tambahkan Mikrotik
sudo nano /etc/freeradius/3.0/clients.conf
```

Tambahkan router Mikrotik:
```
client mikrotik-router {
    ipaddr = IP_MIKROTIK_ANDA
    secret = secret_radius_production_kuat
    shortname = router-pusat
    nastype = mikrotik
}
```

```bash
# Restart FreeRADIUS
sudo systemctl restart freeradius
sudo systemctl enable freeradius

# Test
radtest budi-pppoe password localhost 0 secret_radius_production_kuat
```

### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/radiusbill
```

```nginx
server {
    listen 80;
    server_name billing.yourdomain.com;
    root /var/www/radiusbill/public;
    index index.php;

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Laravel API
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/radiusbill /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Setup SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d billing.yourdomain.com
```

---

## 🔧 Konfigurasi Mikrotik

Di Mikrotik router, tambahkan RADIUS server:

```
/radius
add address=IP_SERVER_ANDA secret=secret_radius_production_kuat service=ppp,hotspot

/ppp aaa
set use-radius=yes accounting=yes

/ip hotspot profile
set default use-radius=yes accounting=yes
```

---

## 📋 Perbedaan Lokal vs Production

| Aspek | Lokal (Mac) | Production (Server) |
|-------|-------------|---------------------|
| MySQL | Docker container | Native install |
| FreeRADIUS | Docker container | Native install |
| Laravel | `php artisan serve` | Nginx + PHP-FPM |
| Frontend | `npm run dev` (Vite) | `npm run build` (static) |
| RADIUS Secret | `testing123` | Secret kuat |
| DB Password | `root` | Password kuat |
| SSL | Tidak perlu | Let's Encrypt |
| Mikrotik | Tidak perlu | Konfigurasi RADIUS client |

### Yang SAMA (tidak perlu ubah kode):
- ✅ Semua kode Laravel
- ✅ Semua kode Frontend
- ✅ Database schema (migrations)
- ✅ FreeRADIUS membaca database yang sama
- ✅ API endpoints

### Yang BEDA (hanya `.env`):
- 🔧 `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`
- 🔧 `RADIUS_SECRET`
- 🔧 `APP_URL`, `APP_ENV`

---

## 🔄 Update/Deploy Ulang

```bash
cd /var/www/radiusbill

# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run new migrations (jika ada)
php artisan migrate --force

# Rebuild frontend
cd frontend && npm install && npm run build && cp -r dist/* ../public/

# Clear cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart services
sudo systemctl restart php8.1-fpm
sudo systemctl restart nginx
```

---

## 🐛 Troubleshooting

### FreeRADIUS tidak bisa connect ke MySQL
```bash
# Check FreeRADIUS logs
sudo tail -f /var/log/freeradius/radius.log

# Test MySQL connection
mysql -u radius -p radius -e "SELECT * FROM radcheck LIMIT 5;"

# Restart FreeRADIUS in debug mode
sudo freeradius -X
```

### Client tidak bisa login PPPoE
```bash
# Test RADIUS authentication
radtest username password localhost 0 secret

# Check radcheck table
mysql -u radius -p radius -e "SELECT * FROM radcheck WHERE username='budi-pppoe';"

# Check NAS table
mysql -u radius -p radius -e "SELECT * FROM nas;"
```

### Docker issues (lokal)
```bash
# Lihat logs
docker compose logs -f freeradius
docker compose logs -f mysql

# Restart
docker compose restart

# Fresh start
docker compose down -v
docker compose up -d
```
