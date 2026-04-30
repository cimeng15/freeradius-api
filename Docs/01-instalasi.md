# 1. Instalasi

## Kebutuhan Sistem

- PHP 8.1+
- Composer
- Node.js 18+
- MySQL 8.0+
- Docker Desktop (untuk development di Mac/Windows)

## Setup Development (Mac)

```bash
# 1. Clone project
git clone <repo-url> freeradius-api
cd freeradius-api

# 2. Install PHP dependencies
composer install

# 3. Setup environment
cp .env.example .env
php artisan key:generate

# 4. Edit .env — sesuaikan database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=radius
DB_USERNAME=root
DB_PASSWORD=root

# 5. Start MySQL (jika belum ada)
# Jika sudah punya MySQL via Docker/native, skip step ini
docker compose --profile full up -d

# 6. Start FreeRADIUS
docker compose up -d freeradius

# 7. Jalankan socat forwarder (Mac only — agar Mikrotik bisa reach)
./docker/radius-forward.sh

# 8. Migrate & seed database
php artisan migrate:fresh --seed

# 9. Storage link (untuk upload logo)
php artisan storage:link

# 10. Start Laravel
php artisan serve

# 11. Install & start frontend
cd frontend
npm install
npm run dev
```

## Akses

| Service | URL |
|---------|-----|
| Panel Admin | http://localhost:3000 |
| API | http://localhost:8000/api |
| FreeRADIUS | localhost:1812/udp |

## Login Default

**Staff (http://localhost:3000/login):**
- Admin: `admin` / `password`
- NOC: `noc` / `password`
- Reseller: `reseller` / `password`

**Pelanggan (http://localhost:3000/client-login):**
- ID: `1985000001` atau HP: `081234567890` (tanpa password)
