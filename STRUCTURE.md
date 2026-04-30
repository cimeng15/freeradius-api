# Struktur Aplikasi FreeRADIUS Billing System

## 📁 Struktur Direktori

```
freeradius-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── AuthController.php          # Authentication & user management
│   │   │       ├── PackageController.php       # Package CRUD
│   │   │       ├── ClientController.php        # PPPoE Client management
│   │   │       ├── VoucherController.php       # Voucher generation & management
│   │   │       ├── ResellerController.php      # Reseller management
│   │   │       ├── RouterController.php        # Mikrotik router management
│   │   │       ├── DashboardController.php     # Dashboard statistics
│   │   │       └── MonitoringController.php    # Monitoring & session management
│   │   │
│   │   └── Middleware/
│   │       ├── AuditMiddleware.php             # Audit logging middleware
│   │       └── RoleMiddleware.php              # Role-based access control
│   │
│   └── Models/
│       ├── User.php                            # User model (Laravel auth)
│       ├── Client.php                          # PPPoE client model
│       ├── Reseller.php                        # Reseller model
│       ├── Package.php                         # Internet package model
│       ├── Voucher.php                         # Voucher model
│       ├── Router.php                          # Mikrotik router model
│       ├── Transaction.php                     # Financial transaction model
│       ├── AuditLog.php                        # Audit log model
│       ├── RadiusUser.php                      # FreeRADIUS radcheck model
│       ├── RadiusReply.php                     # FreeRADIUS radreply model
│       ├── RadiusNas.php                       # FreeRADIUS nas model
│       ├── RadiusUserGroup.php                 # FreeRADIUS radusergroup model
│       └── RadiusAccounting.php                # FreeRADIUS radacct model
│
├── database/
│   ├── migrations/
│   │   ├── 2024_01_01_000001_create_permission_tables.php
│   │   ├── 2024_01_01_000002_add_role_to_users_table.php
│   │   ├── 2024_01_01_000003_create_packages_table.php
│   │   ├── 2024_01_01_000004_create_clients_table.php
│   │   ├── 2024_01_01_000005_create_resellers_table.php
│   │   ├── 2024_01_01_000006_create_vouchers_table.php
│   │   ├── 2024_01_01_000007_create_transactions_table.php
│   │   ├── 2024_01_01_000008_create_routers_table.php
│   │   ├── 2024_01_01_000009_create_audit_logs_table.php
│   │   └── 2024_01_01_000010_create_freeradius_tables.php
│   │
│   └── seeders/
│       └── DatabaseSeeder.php
│
├── routes/
│   ├── api.php                                 # API routes
│   └── web.php                                 # Web routes (untuk UI nanti)
│
├── config/
│   ├── auth.php                                # Authentication config
│   ├── database.php                            # Database config
│   └── permission.php                          # Spatie permission config
│
├── .env                                        # Environment variables
├── composer.json                               # PHP dependencies
├── README.md                                   # Documentation
└── SYSTEM_FLOW_THEORY.md                       # System flow & theory
```

## 🗄️ Database Schema

### Laravel Tables

#### users
```sql
- id (PK)
- name
- email (unique)
- password
- role (enum: superadmin, noc, reseller, client)
- status (enum: active, suspended, inactive)
- created_at
- updated_at
```

#### clients
```sql
- id (PK)
- user_id (FK -> users)
- username (unique, for PPPoE)
- package_id (FK -> packages)
- ip_address (nullable)
- installation_address
- phone
- billing_date (1-31)
- status (enum: active, suspended, terminated)
- created_at
- updated_at
```

#### resellers
```sql
- id (PK)
- user_id (FK -> users)
- balance (decimal)
- commission_rate (percentage)
- bank_name
- bank_account
- bank_account_name
- status (enum: active, suspended)
- created_at
- updated_at
```

#### packages
```sql
- id (PK)
- name
- type (enum: pppoe, hotspot)
- speed_download (Mbps)
- speed_upload (Mbps)
- quota (GB, nullable)
- duration (days, nullable)
- price (decimal)
- description
- is_active (boolean)
- created_at
- updated_at
```

#### vouchers
```sql
- id (PK)
- code (unique)
- package_id (FK -> packages)
- reseller_id (FK -> resellers, nullable)
- batch_id (for bulk generation)
- status (enum: unused, used, expired)
- used_by (username, nullable)
- used_at (timestamp, nullable)
- expires_at (timestamp, nullable)
- created_at
- updated_at
```

#### routers
```sql
- id (PK)
- name
- ip_address (unique)
- secret (RADIUS shared secret)
- type (enum: hotspot, pppoe, both)
- location
- status (enum: active, inactive)
- created_at
- updated_at
```

#### transactions
```sql
- id (PK)
- user_id (FK -> users)
- type (enum: topup, voucher_purchase, payment, commission, refund)
- amount (decimal)
- description
- status (enum: pending, success, failed, cancelled)
- payment_method
- payment_proof (file path)
- reference_id
- created_at
- updated_at
```

#### audit_logs
```sql
- id (PK)
- user_id (FK -> users, nullable)
- action
- table_name
- record_id
- old_values (JSON)
- new_values (JSON)
- ip_address
- user_agent
- created_at
- updated_at
```

### FreeRADIUS Tables

#### radcheck
```sql
- id (PK)
- username (indexed)
- attribute (e.g., "Cleartext-Password")
- op (operator: :=, ==, +=)
- value
- created_at
- updated_at
```

#### radreply
```sql
- id (PK)
- username (indexed)
- attribute (e.g., "Mikrotik-Rate-Limit")
- op (operator: =, :=)
- value
- created_at
- updated_at
```

#### nas (Network Access Servers)
```sql
- id (PK)
- nasname (IP address, unique)
- shortname
- type (e.g., "mikrotik")
- ports
- secret (shared secret)
- server
- community
- description
- created_at
- updated_at
```

#### radacct (Accounting)
```sql
- radacctid (PK)
- acctsessionid (indexed)
- acctuniqueid (unique)
- username (indexed)
- nasipaddress (indexed)
- acctstarttime (indexed)
- acctstoptime (indexed)
- acctsessiontime (seconds)
- acctinputoctets (bytes downloaded)
- acctoutputoctets (bytes uploaded)
- framedipaddress (indexed)
- ... (dan field lainnya)
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/login                          # Login
POST   /api/logout                         # Logout
GET    /api/me                             # Get current user
POST   /api/change-password                # Change password
```

### Packages (Superadmin)
```
GET    /api/packages                       # List all packages
POST   /api/packages                       # Create package
GET    /api/packages/{id}                  # Show package
PUT    /api/packages/{id}                  # Update package
DELETE /api/packages/{id}                  # Delete package
```

### Clients (Superadmin)
```
GET    /api/clients                        # List all clients
POST   /api/clients                        # Create client
GET    /api/clients/{id}                   # Show client
PUT    /api/clients/{id}                   # Update client
DELETE /api/clients/{id}                   # Delete client
POST   /api/clients/{id}/suspend           # Suspend client
POST   /api/clients/{id}/activate          # Activate client
```

### Vouchers (Superadmin, Reseller)
```
GET    /api/vouchers                       # List vouchers
POST   /api/vouchers/generate              # Generate vouchers
GET    /api/vouchers/batch/{batchId}       # Show batch
GET    /api/vouchers/{id}                  # Show voucher
```

### Routers (Superadmin)
```
GET    /api/routers                        # List routers
POST   /api/routers                        # Add router
GET    /api/routers/{id}                   # Show router
PUT    /api/routers/{id}                   # Update router
DELETE /api/routers/{id}                   # Delete router
```

### Monitoring (Superadmin, NOC)
```
GET    /api/monitoring/active-sessions     # Active sessions
GET    /api/monitoring/bandwidth           # Bandwidth usage
POST   /api/monitoring/disconnect/{user}   # Disconnect user
```

## 🔐 Role & Permission Matrix

| Feature                  | Superadmin | NOC | Reseller | Client |
|--------------------------|------------|-----|----------|--------|
| Dashboard                | ✅         | ✅  | ✅       | ✅     |
| Manage Packages          | ✅         | ❌  | ❌       | ❌     |
| Manage Clients           | ✅         | ❌  | ❌       | ❌     |
| Manage Resellers         | ✅         | ❌  | ❌       | ❌     |
| Manage Routers           | ✅         | ❌  | ❌       | ❌     |
| Generate Vouchers        | ✅         | ❌  | ✅       | ❌     |
| View All Vouchers        | ✅         | ❌  | Own Only | ❌     |
| Monitoring               | ✅         | ✅  | ❌       | ❌     |
| Disconnect Users         | ✅         | ✅  | ❌       | ❌     |
| View Own Account         | ✅         | ✅  | ✅       | ✅     |
| View Own Usage           | ✅         | ✅  | ✅       | ✅     |
| Audit Logs               | ✅         | ❌  | ❌       | ❌     |

## 🚀 Next Steps

### Untuk Development UI
1. **Frontend Framework**: Pilih antara:
   - Blade + Alpine.js + Tailwind CSS (Simple & Fast)
   - Vue.js 3 + Inertia.js (SPA Experience)
   - React + Next.js (Separate Frontend)

2. **Dashboard Components**:
   - Statistics cards
   - Charts (revenue, bandwidth, users)
   - Recent activities
   - Quick actions

3. **CRUD Pages**:
   - Data tables dengan pagination
   - Forms dengan validation
   - Modal dialogs
   - Toast notifications

4. **Monitoring Pages**:
   - Real-time active sessions
   - Bandwidth graphs
   - Connection history
   - Disconnect actions

### Untuk Backend Development
1. **Voucher Controller**: Generate batch, print PDF
2. **Reseller Controller**: Balance management, commission
3. **Router Controller**: Sync dengan Mikrotik API
4. **Dashboard Controller**: Statistics & charts data
5. **Monitoring Controller**: Real-time session data

### Untuk Testing
1. Unit tests untuk Models
2. Feature tests untuk API endpoints
3. Integration tests untuk FreeRADIUS

## 📝 Notes

- Semua password di-hash menggunakan bcrypt
- API menggunakan Laravel Sanctum untuk authentication
- Audit log otomatis mencatat semua perubahan penting
- Router otomatis sync ke FreeRADIUS NAS table
- Client suspend/activate otomatis update FreeRADIUS

## 🔧 Configuration Files

### .env (Example)
```env
APP_NAME="FreeRADIUS Billing"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=radius
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
```

### bootstrap/app.php (Middleware Registration)
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\RoleMiddleware::class,
        'audit' => \App\Http\Middleware\AuditMiddleware::class,
    ]);
})
```

---

**Status**: ✅ Backend structure complete, ready for UI development
