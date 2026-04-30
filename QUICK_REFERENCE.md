# Quick Reference - FreeRADIUS Billing System

## 🚀 Quick Start

```bash
# 1. Setup (otomatis)
./setup.sh

# 2. Start server
php artisan serve

# 3. Test API
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## 🔑 Default Credentials

| Role       | Email               | Password |
|------------|---------------------|----------|
| Superadmin | admin@example.com   | password |
| NOC        | noc@example.com     | password |

## 📋 Artisan Commands

```bash
# Database
php artisan migrate              # Run migrations
php artisan migrate:fresh        # Fresh migrations
php artisan db:seed              # Seed database
php artisan migrate:fresh --seed # Fresh + seed

# Cache
php artisan config:clear         # Clear config cache
php artisan cache:clear          # Clear application cache
php artisan route:clear          # Clear route cache

# Development
php artisan serve                # Start dev server
php artisan tinker               # Laravel REPL
php artisan route:list           # List all routes
```

## 🔌 API Endpoints Cheat Sheet

### Authentication
```bash
POST   /api/login                # Login
POST   /api/logout               # Logout
GET    /api/me                   # Current user
POST   /api/change-password      # Change password
```

### Packages (Superadmin)
```bash
GET    /api/packages             # List
POST   /api/packages             # Create
GET    /api/packages/{id}        # Show
PUT    /api/packages/{id}        # Update
DELETE /api/packages/{id}        # Delete
```

### Clients (Superadmin)
```bash
GET    /api/clients              # List
POST   /api/clients              # Create
GET    /api/clients/{id}         # Show
PUT    /api/clients/{id}         # Update
DELETE /api/clients/{id}         # Delete
POST   /api/clients/{id}/suspend # Suspend
POST   /api/clients/{id}/activate # Activate
```

## 📊 Database Quick Reference

### Main Tables
- `users` - User accounts
- `clients` - PPPoE clients
- `packages` - Internet packages
- `vouchers` - Hotspot vouchers
- `resellers` - Reseller accounts
- `routers` - Mikrotik routers
- `transactions` - Financial records
- `audit_logs` - Activity logs

### FreeRADIUS Tables
- `radcheck` - User authentication
- `radreply` - User attributes
- `nas` - Network Access Servers
- `radacct` - Accounting logs

## 🔍 Common Queries

```sql
-- List all users by role
SELECT id, name, email, role, status FROM users;

-- List active clients
SELECT c.username, u.name, p.name as package 
FROM clients c 
JOIN users u ON c.user_id = u.id 
JOIN packages p ON c.package_id = p.id 
WHERE c.status = 'active';

-- List packages
SELECT id, name, type, price FROM packages WHERE is_active = 1;

-- Check RADIUS users
SELECT username, attribute, value FROM radcheck;

-- Active sessions
SELECT username, nasipaddress, acctstarttime 
FROM radacct 
WHERE acctstoptime IS NULL;
```

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u root -p

# Update .env
DB_HOST=127.0.0.1
DB_DATABASE=radius
DB_USERNAME=root
DB_PASSWORD=your_password
```

### Migration Error
```bash
# Fresh start
php artisan migrate:fresh --seed

# Rollback
php artisan migrate:rollback

# Reset
php artisan migrate:reset
```

### Permission Error
```bash
# Fix storage permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Clear All Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
composer dump-autoload
```

## 📝 Model Relationships

```php
// User
$user->client          // HasOne
$user->reseller        // HasOne
$user->transactions    // HasMany
$user->auditLogs       // HasMany

// Client
$client->user          // BelongsTo
$client->package       // BelongsTo

// Package
$package->clients      // HasMany
$package->vouchers     // HasMany

// Voucher
$voucher->package      // BelongsTo
$voucher->reseller     // BelongsTo

// Reseller
$reseller->user        // BelongsTo
$reseller->vouchers    // HasMany
```

## 🎯 Helper Methods

```php
// User
$user->isSuperadmin()
$user->isNoc()
$user->isReseller()
$user->isClient()

// Client
$client->suspend()
$client->activate()
$client->terminate()

// Package
$package->getRateLimitAttribute()
$package->getFormattedPriceAttribute()

// Reseller
$reseller->addBalance($amount)
$reseller->deductBalance($amount)
$reseller->calculateCommission($amount)

// Voucher
Voucher::generateCode()
Voucher::generateBatch($packageId, $quantity, $resellerId)
$voucher->markAsUsed($username)
$voucher->isExpired()

// RadiusUser
RadiusUser::createPPPoEUser($username, $password, $package)
RadiusUser::createVoucher($code, $package)
RadiusUser::updatePassword($username, $newPassword)
RadiusUser::deleteUser($username)

// RadiusAccounting
RadiusAccounting::getActiveSessions()
RadiusAccounting::getUserHistory($username)
RadiusAccounting::getUserTotalUsage($username)
RadiusAccounting::disconnectUser($username)
```

## 📦 Package Types

### PPPoE Package
```json
{
  "name": "PPPoE 10 Mbps",
  "type": "pppoe",
  "speed_download": 10,
  "speed_upload": 10,
  "quota": null,
  "duration": null,
  "price": 200000
}
```

### Hotspot Package
```json
{
  "name": "Voucher 1 Hari 5GB",
  "type": "hotspot",
  "speed_download": 5,
  "speed_upload": 5,
  "quota": 5,
  "duration": 1,
  "price": 10000
}
```

## 🔐 Role Permissions

| Feature              | Superadmin | NOC | Reseller | Client |
|---------------------|------------|-----|----------|--------|
| Manage Packages     | ✅         | ❌  | ❌       | ❌     |
| Manage Clients      | ✅         | ❌  | ❌       | ❌     |
| Manage Resellers    | ✅         | ❌  | ❌       | ❌     |
| Manage Routers      | ✅         | ❌  | ❌       | ❌     |
| Generate Vouchers   | ✅         | ❌  | ✅       | ❌     |
| Monitoring          | ✅         | ✅  | ❌       | ❌     |
| View Own Account    | ✅         | ✅  | ✅       | ✅     |

## 📚 Documentation Files

- `README.md` - Overview & usage
- `SETUP.md` - Installation guide
- `STRUCTURE.md` - Application structure
- `SYSTEM_FLOW_THEORY.md` - System flow & theory
- `SUMMARY.md` - What's been built
- `QUICK_REFERENCE.md` - This file

## 🎨 Next Steps

1. ✅ Backend structure complete
2. 🔄 Develop remaining controllers
3. 🔄 Build frontend UI
4. 🔄 Setup FreeRADIUS server
5. 🔄 Configure Mikrotik
6. 🔄 Test end-to-end

## 💡 Tips

- Use Postman collection (`postman_collection.json`) for API testing
- Check `audit_logs` table for debugging
- Use `php artisan tinker` for quick testing
- Always backup database before major changes
- Test in development before production

---

**Need help?** Check the full documentation in `SETUP.md` and `STRUCTURE.md`
