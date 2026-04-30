# Setup Guide - FreeRADIUS Billing System

## 📋 Prerequisites

- PHP 8.1 atau lebih tinggi
- MySQL 8.0 atau lebih tinggi
- Composer
- FreeRADIUS 3.x (untuk production)
- Mikrotik RouterOS 6/7 (untuk production)

## 🚀 Installation Steps

### 1. Clone & Install Dependencies

```bash
cd /path/to/freeradius-api
composer install
```

### 2. Environment Configuration

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` dan sesuaikan database configuration:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=radius
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 3. Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE radius CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. Run Migrations

```bash
php artisan migrate
```

Output yang diharapkan:
```
✓ 2024_01_01_000001_create_permission_tables
✓ 2024_01_01_000002_add_role_to_users_table
✓ 2024_01_01_000003_create_packages_table
✓ 2024_01_01_000004_create_clients_table
✓ 2024_01_01_000005_create_resellers_table
✓ 2024_01_01_000006_create_vouchers_table
✓ 2024_01_01_000007_create_transactions_table
✓ 2024_01_01_000008_create_routers_table
✓ 2024_01_01_000009_create_audit_logs_table
✓ 2024_01_01_000010_create_freeradius_tables
```

### 5. Seed Database

```bash
php artisan db:seed
```

Output:
```
✅ Superadmin created: admin@example.com / password
✅ NOC user created: noc@example.com / password
✅ Sample packages created (5 packages)

========================================
Database seeded successfully!
========================================
Superadmin: admin@example.com / password
NOC: noc@example.com / password
========================================
```

### 6. Run Development Server

```bash
php artisan serve
```

Server akan berjalan di: `http://localhost:8000`

## 🧪 Testing API

### 1. Login

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@example.com",
      "role": "superadmin",
      "status": "active"
    },
    "token": "1|xxxxxxxxxxxxxxxxxxxxx"
  }
}
```

**Simpan token untuk request selanjutnya!**

### 2. Get Current User

```bash
curl -X GET http://localhost:8000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. List Packages

```bash
curl -X GET http://localhost:8000/api/packages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Create Client

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

## 🔧 FreeRADIUS Setup (Production)

### 1. Install FreeRADIUS

```bash
sudo apt update
sudo apt install freeradius freeradius-mysql
```

### 2. Configure SQL Module

Edit `/etc/freeradius/3.0/mods-available/sql`:

```conf
sql {
    driver = "rlm_sql_mysql"
    dialect = "mysql"
    
    server = "localhost"
    port = 3306
    login = "radius"
    password = "radiuspassword"
    radius_db = "radius"
    
    read_clients = yes
}
```

### 3. Enable SQL Module

```bash
sudo ln -s /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/
```

### 4. Test Configuration

```bash
sudo freeradius -X
```

Jika tidak ada error, tekan `Ctrl+C` dan restart service:

```bash
sudo systemctl restart freeradius
sudo systemctl enable freeradius
sudo systemctl status freeradius
```

### 5. Test RADIUS Authentication

```bash
radtest john123 password123 localhost 0 testing123
```

Expected output:
```
Received Access-Accept
```

## 🌐 Mikrotik Configuration

### 1. Add RADIUS Server

```routeros
/radius
add address=192.168.1.100 secret=sharedsecret123 service=ppp,hotspot
```

### 2. Enable RADIUS for PPPoE

```routeros
/ppp aaa
set use-radius=yes
```

### 3. Enable RADIUS for Hotspot

```routeros
/ip hotspot profile
set default use-radius=yes
```

### 4. Test Connection

```routeros
/radius incoming
print
```

## 📊 Verify Installation

### Check Database Tables

```bash
mysql -u root -p radius
```

```sql
SHOW TABLES;
```

Expected output (24 tables):
```
+---------------------------+
| Tables_in_radius          |
+---------------------------+
| audit_logs                |
| clients                   |
| failed_jobs               |
| migrations                |
| model_has_permissions     |
| model_has_roles           |
| nas                       |
| packages                  |
| password_reset_tokens     |
| permissions               |
| personal_access_tokens    |
| radacct                   |
| radcheck                  |
| radgroupcheck             |
| radgroupreply             |
| radpostauth               |
| radreply                  |
| radusergroup              |
| resellers                 |
| role_has_permissions      |
| roles                     |
| routers                   |
| transactions              |
| users                     |
| vouchers                  |
+---------------------------+
```

### Check Sample Data

```sql
-- Check users
SELECT id, name, email, role FROM users;

-- Check packages
SELECT id, name, type, price FROM packages;
```

## 🐛 Troubleshooting

### Error: "SQLSTATE[HY000] [2002] Connection refused"

**Solution**: Pastikan MySQL service berjalan
```bash
sudo systemctl start mysql
sudo systemctl status mysql
```

### Error: "Access denied for user 'root'@'localhost'"

**Solution**: Update password di `.env` atau reset MySQL password

### Error: "Class 'Spatie\Permission\...' not found"

**Solution**: Clear cache dan reinstall
```bash
composer dump-autoload
php artisan config:clear
php artisan cache:clear
```

### FreeRADIUS tidak bisa connect ke MySQL

**Solution**: Check MySQL user permissions
```sql
GRANT ALL PRIVILEGES ON radius.* TO 'radius'@'localhost' IDENTIFIED BY 'radiuspassword';
FLUSH PRIVILEGES;
```

## 📝 Next Steps

1. ✅ Backend API sudah siap
2. 🔄 Develop Frontend UI (Blade/Vue/React)
3. 🔄 Implement Voucher generation & printing
4. 🔄 Add monitoring dashboard
5. 🔄 Integrate payment gateway

## 📞 Support

Jika ada pertanyaan atau issue, silakan buat issue di repository atau hubungi tim development.

---

**Happy Coding! 🚀**
