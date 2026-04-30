# FreeRADIUS Billing System

Sistem billing terintegrasi dengan FreeRADIUS untuk manajemen Hotspot (Voucher) dan PPPoE Client.

## 🚀 Quick Start (5 Menit!)

### 1. Setup Laravel Application
```bash
cd /path/to/freeradius-api
./setup.sh
```

### 2. Install FreeRADIUS (Otomatis)
```bash
sudo ./install-freeradius.sh
```

### 3. Configure Mikrotik (Otomatis)
```bash
./configure-mikrotik.sh
```

### 4. Start Server
```bash
php artisan serve
```

**Done!** 🎉 Sistem siap digunakan!

## 📋 Fitur Utama

### Role & Permission
- **Superadmin**: Full access ke semua fitur
- **NOC**: Monitoring & troubleshooting
- **Reseller**: Generate & manage voucher
- **Client PPPoE**: Self-service portal

### Modul
- ✅ Authentication & Authorization
- ✅ Package Management (Paket Internet)
- ✅ Client PPPoE Management
- ✅ Voucher Management (Hotspot)
- ✅ Reseller Management
- ✅ Router Management (Mikrotik)
- ✅ Monitoring & Reporting
- ✅ Audit Log
- 🔄 Payment Gateway (Future)

## 🔧 Requirements

- PHP 8.1+
- MySQL 8.0+
- Composer
- Ubuntu/Debian (untuk FreeRADIUS)
- Mikrotik RouterOS 6/7

## 📦 Installation

### Automatic Installation (Recommended)

```bash
# 1. Setup Laravel
./setup.sh

# 2. Install FreeRADIUS
sudo ./install-freeradius.sh

# 3. Configure Mikrotik
./configure-mikrotik.sh
```

### Manual Installation

Lihat dokumentasi lengkap di:
- `SETUP.md` - Laravel setup guide
- `FREERADIUS_INSTALL.md` - FreeRADIUS installation guide

## 🔑 Default Credentials

| Role       | Email               | Password |
|------------|---------------------|----------|
| Superadmin | admin@example.com   | password |
| NOC        | noc@example.com     | password |

## 🔌 API Endpoints

### Authentication
```
POST   /api/login
POST   /api/logout
GET    /api/me
POST   /api/change-password
```

### Packages (Superadmin)
```
GET    /api/packages
POST   /api/packages
GET    /api/packages/{id}
PUT    /api/packages/{id}
DELETE /api/packages/{id}
```

### Clients (Superadmin)
```
GET    /api/clients
POST   /api/clients
GET    /api/clients/{id}
PUT    /api/clients/{id}
DELETE /api/clients/{id}
POST   /api/clients/{id}/suspend
POST   /api/clients/{id}/activate
```

## 🧪 Testing

### Test API dengan cURL

```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Get packages
curl -X GET http://localhost:8000/api/packages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test dengan Postman

Import file `postman_collection.json` ke Postman untuk testing lengkap.

### Test FreeRADIUS

```bash
# Test authentication
radtest username password localhost 0 testing123

# Debug mode
sudo freeradius -X
```

## 📁 Struktur Database

### Laravel Tables
- `users` - User authentication
- `clients` - PPPoE clients
- `resellers` - Reseller accounts
- `packages` - Internet packages
- `vouchers` - Hotspot vouchers
- `routers` - Mikrotik routers
- `transactions` - Financial transactions
- `audit_logs` - Activity logs

### FreeRADIUS Tables
- `radcheck` - User authentication
- `radreply` - User attributes
- `radgroupcheck` - Group check
- `radgroupreply` - Group reply
- `radusergroup` - User-group mapping
- `nas` - Network Access Servers
- `radacct` - Accounting logs
- `radpostauth` - Auth logs

## 📚 Documentation

- `README.md` - This file (overview)
- `SETUP.md` - Laravel installation guide
- `FREERADIUS_INSTALL.md` - FreeRADIUS installation guide
- `STRUCTURE.md` - Application structure
- `SYSTEM_FLOW_THEORY.md` - System flow & theory
- `SUMMARY.md` - What's been built
- `QUICK_REFERENCE.md` - Quick reference guide

## 🔐 FreeRADIUS Integration

### Automatic Installation

```bash
sudo ./install-freeradius.sh
```

Script akan otomatis:
- ✅ Install FreeRADIUS dan dependencies
- ✅ Configure SQL module
- ✅ Setup database connection
- ✅ Configure authentication
- ✅ Enable accounting
- ✅ Start service

### Mikrotik Configuration

```bash
./configure-mikrotik.sh
```

Script akan generate file `mikrotik-config.rsc` yang bisa langsung di-import ke Mikrotik.

## 🎯 Usage Examples

### Create PPPoE Client

```bash
curl -X POST http://localhost:8000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "username": "john123",
    "password": "password123",
    "package_id": 1,
    "installation_address": "Jl. Example No. 123",
    "phone": "081234567890",
    "billing_date": 1
  }'
```

### Generate Vouchers

```bash
curl -X POST http://localhost:8000/api/vouchers/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": 2,
    "quantity": 10
  }'
```

## 🐛 Troubleshooting

### Laravel Issues

```bash
# Clear cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Check logs
tail -f storage/logs/laravel.log
```

### FreeRADIUS Issues

```bash
# Check status
systemctl status freeradius

# View logs
journalctl -u freeradius -f

# Debug mode
sudo freeradius -X
```

### Database Issues

```bash
# Test connection
mysql -u radius -p radius

# Check tables
mysql -u radius -p radius -e "SHOW TABLES;"
```

## 🔧 Development

### Run Tests
```bash
php artisan test
```

### Generate API Documentation
```bash
php artisan route:list
```

## 📝 Roadmap

### Fase 1 (Core) ✅
- [x] Database migrations
- [x] Models & relationships
- [x] Authentication & authorization
- [x] Basic CRUD operations
- [x] FreeRADIUS integration

### Fase 2 (Advanced)
- [ ] Voucher batch generation
- [ ] Monitoring dashboard
- [ ] Usage statistics
- [ ] Email notifications
- [ ] PDF reports

### Fase 3 (Payment)
- [ ] Payment gateway integration
- [ ] Invoice generation
- [ ] Auto-suspend expired clients
- [ ] Recurring billing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-sourced software licensed under the MIT license.

## 📞 Support

For support, create an issue in this repository.

---

**Built with ❤️ using Laravel & FreeRADIUS**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
