# 🚀 Quick Start - Deploy ke aaPanel

## Langkah Singkat

### 1. Persiapan Server
```bash
# Install PHP extensions di aaPanel
# App Store → PHP 8.1 → Install Extensions:
# dom, curl, mbstring, pdo_mysql, zip, gd, bcmath, opcache

# Install Node.js
# App Store → Node.js → Install (v18+)
```

### 2. Setup Website di aaPanel
- Domain: `billing.syakirulilmi.my.id`
- PHP: 8.1
- **Run Directory**: `/public` ⚠️ PENTING!

### 3. Upload & Deploy
```bash
# SSH ke server
cd /www/wwwroot/billing.syakirulilmi.my.id

# Upload project (git atau FTP)
git clone https://github.com/your-repo/freeradius-api.git .

# Setup .env
cp .env.example .env
nano .env  # Edit DB credentials

# Deploy otomatis
chmod +x deploy-simple.sh
bash deploy-simple.sh

# Set ownership
sudo chown -R www:www .
```

### 4. Akses Website
Buka: `https://billing.syakirulilmi.my.id`

Default login:
- Email: `admin@example.com`
- Password: `password`

---

## 📚 Dokumentasi Lengkap

- **[DEPLOY_AAPANEL.md](DEPLOY_AAPANEL.md)** - Panduan deployment lengkap
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solusi masalah umum
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API documentation

## 🔧 Script Deployment

### `deploy-simple.sh` (Otomatis, tanpa prompt)
```bash
bash deploy-simple.sh
```
Untuk deployment cepat tanpa interaksi.

### `deploy.sh` (Interaktif)
```bash
bash deploy.sh
```
Untuk deployment dengan konfirmasi setiap langkah.

## 📁 Struktur Project

```
freeradius-api/
├── public/              # Web root (Run Directory di aaPanel)
│   ├── app/            # Frontend React (hasil build)
│   ├── storage/        # Symlink ke storage/app/public
│   └── index.php       # Laravel entry point
├── frontend/           # Source code React
│   ├── src/
│   └── vite.config.js
├── app/               # Laravel application
├── routes/
│   ├── api.php        # API routes
│   └── web.php        # Web routes (serve React)
├── .env              # Configuration
├── deploy-simple.sh  # Deployment script
└── DEPLOY_AAPANEL.md # Deployment guide
```

## ⚙️ Konfigurasi Penting

### .env
```env
APP_URL=https://billing.syakirulilmi.my.id
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### aaPanel Settings
- **Site Directory** → Run Directory: `/public`
- **Rewrite**: Laravel
- **PHP Version**: 8.1+

## 🔄 Update Aplikasi

```bash
cd /www/wwwroot/billing.syakirulilmi.my.id
git pull
bash deploy-simple.sh
sudo chown -R www:www .
```

## ❓ Troubleshooting

### Masih muncul halaman Laravel?
```bash
# Build frontend
cd frontend && npm run build && cd ..
# Clear cache
php artisan optimize:clear
```

### Error 500?
```bash
# Check logs
tail -50 storage/logs/laravel.log
# Fix permissions
chmod -R 775 storage bootstrap/cache
sudo chown -R www:www .
```

Lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md) untuk solusi lengkap.

## 📞 Support

- Logs: `storage/logs/laravel.log`
- Web logs: `/www/wwwlogs/`
- PHP logs: `/www/server/php/81/var/log/`

---

**Made with ❤️ for easy deployment**
