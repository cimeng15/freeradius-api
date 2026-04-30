# Sistem Billing FreeRADIUS - Flow & Teori

## 📋 Daftar Isi
1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Role & Permission](#role--permission)
3. [Flow Diagram](#flow-diagram)
4. [Database Schema](#database-schema)
5. [Integrasi FreeRADIUS](#integrasi-freeradius)
6. [Roadmap Pengembangan](#roadmap-pengembangan)

---

## 🏗️ Arsitektur Sistem

### Komponen Utama

```
┌─────────────────────────────────────────────────────────────┐
│                    LARAVEL APPLICATION                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web Panel  │  │   REST API   │  │   Queue Job  │     │
│  │  (Blade/Vue) │  │   (JSON)     │  │   (Redis)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      FREERADIUS SERVER                       │
├─────────────────────────────────────────────────────────────┤
│  • Authentication (radcheck, radreply)                       │
│  • Authorization (radgroupcheck, radgroupreply)              │
│  • Accounting (radacct)                                      │
│  • NAS Management (nas)                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MIKROTIK DEVICES                          │
├─────────────────────────────────────────────────────────────┤
│  • Hotspot (Voucher Based)                                   │
│  • PPPoE Server (Username/Password)                          │
│  • RADIUS Client Configuration                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Role & Permission

### 1. **SUPERADMIN** (God Mode)
**Akses Penuh ke Seluruh Sistem**

#### Hak Akses:
- ✅ Manajemen semua user (create, read, update, delete)
- ✅ Konfigurasi FreeRADIUS (nas, profiles, attributes)
- ✅ Manajemen Mikrotik (add, edit, delete routers)
- ✅ Manajemen Paket Internet (create, edit, delete)
- ✅ Manajemen Reseller (create, approve, suspend)
- ✅ Manajemen Client PPPoE (create, edit, delete, suspend)
- ✅ Generate & Manage Voucher
- ✅ Lihat semua transaksi & laporan
- ✅ Konfigurasi Payment Gateway
- ✅ System Settings (SMTP, Logo, Company Info)
- ✅ Backup & Restore Database
- ✅ Audit Log (melihat semua aktivitas)

#### Menu Panel:
```
Dashboard
├── Overview (statistik keseluruhan)
├── Revenue Chart
└── Active Users

User Management
├── Superadmin
├── NOC
├── Reseller
└── Client PPPoE

Network Management
├── Mikrotik Routers
├── FreeRADIUS Config
├── NAS Management
└── IP Pool Management

Package Management
├── Hotspot Packages
├── PPPoE Packages
└── Pricing Management

Voucher Management
├── Generate Voucher
├── Voucher List
├── Voucher Usage Report
└── Batch Management

Client Management
├── PPPoE Clients
├── Client Status
├── Bandwidth Usage
└── Connection History

Reseller Management
├── Reseller List
├── Reseller Balance
├── Commission Settings
└── Reseller Transactions

Financial
├── Transactions
├── Payment Gateway Config
├── Invoice Management
└── Reports

System
├── Settings
├── Audit Log
├── Backup & Restore
└── API Documentation
```

---

### 2. **NOC (Network Operations Center)**
**Fokus pada Monitoring & Troubleshooting**

#### Hak Akses:
- ✅ View Dashboard (monitoring)
- ✅ View Mikrotik Status (read-only)
- ✅ View FreeRADIUS Logs
- ✅ View Client PPPoE Status
- ✅ View Voucher Usage
- ✅ Disconnect/Reconnect Client (troubleshooting)
- ✅ View Bandwidth Usage
- ✅ View Connection History
- ❌ Tidak bisa create/delete user
- ❌ Tidak bisa ubah harga/paket
- ❌ Tidak bisa akses financial

#### Menu Panel:
```
Dashboard
├── Network Status
├── Active Sessions
└── Bandwidth Monitor

Monitoring
├── Client Status (PPPoE & Hotspot)
├── Router Status
├── FreeRADIUS Logs
└── Connection History

Troubleshooting
├── Disconnect Client
├── Reset Password
├── Check Radius Auth
└── Ping Test

Reports
├── Usage Report
├── Connection Report
└── Error Logs
```

---

### 3. **RESELLER**
**Fokus pada Penjualan Voucher**

#### Hak Akses:
- ✅ View Dashboard (statistik penjualan sendiri)
- ✅ Generate Voucher (sesuai saldo)
- ✅ View Voucher List (milik sendiri)
- ✅ View Voucher Usage Report (milik sendiri)
- ✅ View Balance & Transaction History
- ✅ Request Top-up Balance
- ✅ View Commission
- ✅ Print Voucher
- ❌ Tidak bisa akses client PPPoE
- ❌ Tidak bisa akses router/FreeRADIUS
- ❌ Tidak bisa ubah harga
- ❌ Tidak bisa lihat data reseller lain

#### Menu Panel:
```
Dashboard
├── My Sales Statistics
├── Balance Info
└── Commission Earned

Voucher Management
├── Generate Voucher
├── My Voucher List
├── Voucher Usage
└── Print Voucher

Financial
├── My Balance
├── Top-up Request
├── Transaction History
└── Commission Report

Profile
├── My Profile
├── Change Password
└── Bank Account Info
```

---

### 4. **CLIENT PPPoE**
**Fokus pada Self-Service**

#### Hak Akses:
- ✅ View Dashboard (info akun sendiri)
- ✅ View Package Info
- ✅ View Usage Statistics
- ✅ View Invoice & Payment History
- ✅ Make Payment (fase pengembangan)
- ✅ Change Password
- ✅ View Connection History
- ✅ Download Invoice
- ❌ Tidak bisa akses data client lain
- ❌ Tidak bisa akses voucher
- ❌ Tidak bisa akses router/FreeRADIUS

#### Menu Panel:
```
Dashboard
├── Account Status
├── Package Info
└── Usage Statistics

My Account
├── Profile Info
├── Change Password
└── Connection History

Billing
├── Current Invoice
├── Payment History
├── Make Payment (future)
└── Download Invoice

Support
├── Ticket System (future)
└── FAQ
```

---

## 🔄 Flow Diagram

### Flow 1: Autentikasi PPPoE Client

```
┌─────────────┐
│   Client    │
│  (Mikrotik  │
│   PPPoE)    │
└──────┬──────┘
       │ 1. Dial PPPoE
       │    (username + password)
       ▼
┌─────────────────┐
│    Mikrotik     │
│  PPPoE Server   │
└──────┬──────────┘
       │ 2. RADIUS Auth Request
       │    (Access-Request)
       ▼
┌─────────────────┐
│   FreeRADIUS    │
│     Server      │
└──────┬──────────┘
       │ 3. Query Database
       │    SELECT * FROM radcheck
       │    WHERE username = ?
       ▼
┌─────────────────┐
│   MySQL DB      │
│  (radcheck,     │
│   radreply)     │
└──────┬──────────┘
       │ 4. Return User Data
       │    + Attributes
       ▼
┌─────────────────┐
│   FreeRADIUS    │
│  (Decision)     │
└──────┬──────────┘
       │ 5. Access-Accept/Reject
       │    + Rate-Limit Attributes
       ▼
┌─────────────────┐
│    Mikrotik     │
│  (Apply Rules)  │
└──────┬──────────┘
       │ 6. Connection Established
       │    + Bandwidth Applied
       ▼
┌─────────────────┐
│     Client      │
│   (Connected)   │
└─────────────────┘
       │
       │ 7. Accounting Start
       │    (Session Info)
       ▼
┌─────────────────┐
│   FreeRADIUS    │
│   (radacct)     │
└─────────────────┘
```

### Flow 2: Autentikasi Hotspot (Voucher)

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. Connect to WiFi
       │    Redirect to Login Page
       ▼
┌─────────────────┐
│    Mikrotik     │
│ Hotspot Portal  │
└──────┬──────────┘
       │ 2. Input Voucher Code
       │    (username + password)
       ▼
┌─────────────────┐
│    Mikrotik     │
│ (RADIUS Client) │
└──────┬──────────┘
       │ 3. RADIUS Auth Request
       ▼
┌─────────────────┐
│   FreeRADIUS    │
│     Server      │
└──────┬──────────┘
       │ 4. Validate Voucher
       │    - Check expiry
       │    - Check usage limit
       │    - Check time limit
       ▼
┌─────────────────┐
│   MySQL DB      │
│  (radcheck)     │
└──────┬──────────┘
       │ 5. Return Attributes
       │    - Session-Timeout
       │    - Max-Daily-Session
       │    - Rate-Limit
       ▼
┌─────────────────┐
│   FreeRADIUS    │
│ (Access-Accept) │
└──────┬──────────┘
       │ 6. Grant Access
       ▼
┌─────────────────┐
│     Client      │
│  (Internet OK)  │
└─────────────────┘
```

### Flow 3: Reseller Generate Voucher

```
┌─────────────┐
│  Reseller   │
│   Login     │
└──────┬──────┘
       │ 1. Request Generate Voucher
       │    - Package: 1 Hari 5GB
       │    - Quantity: 10
       ▼
┌─────────────────┐
│ Laravel Panel   │
│ (Validation)    │
└──────┬──────────┘
       │ 2. Check Balance
       │    Balance >= (Price × Qty)?
       ▼
┌─────────────────┐
│   MySQL DB      │
│ (resellers)     │
└──────┬──────────┘
       │ 3. Balance OK
       ▼
┌─────────────────┐
│ Laravel Panel   │
│ (Generate)      │
└──────┬──────────┘
       │ 4. Create Vouchers
       │    - Generate random codes
       │    - Set attributes
       │    - Deduct balance
       ▼
┌─────────────────┐
│   MySQL DB      │
│ (radcheck,      │
│  vouchers,      │
│  transactions)  │
└──────┬──────────┘
       │ 5. Return Voucher List
       │    + Print Option
       ▼
┌─────────────────┐
│   Reseller      │
│ (Print/Export)  │
└─────────────────┘
```

### Flow 4: Superadmin Create PPPoE Client

```
┌─────────────┐
│ Superadmin  │
│   Login     │
└──────┬──────┘
       │ 1. Create New Client
       │    - Username
       │    - Password
       │    - Package
       │    - Billing Info
       ▼
┌─────────────────┐
│ Laravel Panel   │
│ (Validation)    │
└──────┬──────────┘
       │ 2. Validate Input
       │    - Username unique?
       │    - Package exists?
       ▼
┌─────────────────┐
│ Laravel Panel   │
│ (Create User)   │
└──────┬──────────┘
       │ 3. Insert to Multiple Tables
       │    
       ▼
┌─────────────────────────────────────┐
│         MySQL Database              │
├─────────────────────────────────────┤
│ • users (Laravel auth)              │
│ • clients (billing info)            │
│ • radcheck (username, password)     │
│ • radreply (rate-limit attributes)  │
│ • radusergroup (assign to group)    │
└──────┬──────────────────────────────┘
       │ 4. Send Welcome Email
       │    (credentials + info)
       ▼
┌─────────────────┐
│   Email Queue   │
│   (Laravel)     │
└──────┬──────────┘
       │ 5. Client Created
       │    Can login immediately
       ▼
┌─────────────────┐
│     Client      │
│  (Can Connect)  │
└─────────────────┘
```

---

## 🗄️ Database Schema

### Laravel Tables (Billing System)

```sql
-- Users (Laravel Auth)
users
├── id
├── name
├── email
├── password
├── role (enum: superadmin, noc, reseller, client)
├── status (enum: active, suspended, inactive)
├── created_at
└── updated_at

-- Clients (PPPoE Users)
clients
├── id
├── user_id (FK to users)
├── username (unique, for PPPoE)
├── package_id (FK to packages)
├── ip_address (static IP, nullable)
├── installation_address
├── phone
├── billing_date (tanggal tagihan)
├── status (enum: active, suspended, terminated)
├── created_at
└── updated_at

-- Resellers
resellers
├── id
├── user_id (FK to users)
├── balance (decimal)
├── commission_rate (percentage)
├── bank_name
├── bank_account
├── status (enum: active, suspended)
├── created_at
└── updated_at

-- Packages (Internet Plans)
packages
├── id
├── name (e.g., "Paket 10 Mbps")
├── type (enum: pppoe, hotspot)
├── speed_download (Mbps)
├── speed_upload (Mbps)
├── quota (GB, nullable for unlimited)
├── duration (days, for hotspot)
├── price (decimal)
├── description
├── is_active
├── created_at
└── updated_at

-- Vouchers
vouchers
├── id
├── code (unique)
├── package_id (FK to packages)
├── reseller_id (FK to resellers, nullable)
├── batch_id (for bulk generation)
├── status (enum: unused, used, expired)
├── used_by (username, nullable)
├── used_at (timestamp, nullable)
├── expires_at
├── created_at
└── updated_at

-- Transactions
transactions
├── id
├── user_id (FK to users)
├── type (enum: topup, voucher_purchase, payment, commission)
├── amount (decimal)
├── description
├── status (enum: pending, success, failed)
├── payment_method
├── payment_proof (file path, nullable)
├── created_at
└── updated_at

-- Routers (Mikrotik)
routers
├── id
├── name
├── ip_address
├── secret (RADIUS shared secret)
├── type (enum: hotspot, pppoe, both)
├── location
├── status (enum: active, inactive)
├── created_at
└── updated_at

-- Audit Logs
audit_logs
├── id
├── user_id (FK to users)
├── action (e.g., "create_client", "delete_voucher")
├── table_name
├── record_id
├── old_values (JSON)
├── new_values (JSON)
├── ip_address
├── user_agent
├── created_at
└── updated_at
```

### FreeRADIUS Tables (Standard Schema)

```sql
-- User Authentication
radcheck
├── id
├── username (unique)
├── attribute (e.g., "Cleartext-Password", "Expiration")
├── op (operator: :=, ==, +=)
├── value
└── created_at

-- User Reply Attributes (Rate Limit, etc)
radreply
├── id
├── username
├── attribute (e.g., "Mikrotik-Rate-Limit")
├── op
├── value
└── created_at

-- Group Check Attributes
radgroupcheck
├── id
├── groupname
├── attribute
├── op
├── value
└── created_at

-- Group Reply Attributes
radgroupreply
├── id
├── groupname
├── attribute
├── op
├── value
└── created_at

-- User Group Mapping
radusergroup
├── id
├── username
├── groupname
├── priority
└── created_at

-- NAS (Network Access Server) - Mikrotik Routers
nas
├── id
├── nasname (IP address)
├── shortname
├── type (e.g., "mikrotik")
├── ports
├── secret (shared secret)
├── server
├── community
├── description
└── created_at

-- Accounting (Session Logs)
radacct
├── radacctid (PK)
├── acctsessionid
├── acctuniqueid
├── username
├── groupname
├── realm
├── nasipaddress
├── nasportid
├── nasporttype
├── acctstarttime
├── acctstoptime
├── acctsessiontime (seconds)
├── acctauthentic
├── connectinfo_start
├── connectinfo_stop
├── acctinputoctets (bytes downloaded)
├── acctoutputoctets (bytes uploaded)
├── calledstationid
├── callingstationid (MAC address)
├── acctterminatecause
├── servicetype
├── framedprotocol
├── framedipaddress
└── acctstartdelay

-- Post Auth Log
radpostauth
├── id
├── username
├── pass (password attempt)
├── reply (Accept/Reject)
├── authdate
└── nasipaddress
```

---

## 🔗 Integrasi FreeRADIUS

### 1. Konfigurasi FreeRADIUS

**File: `/etc/freeradius/3.0/radiusd.conf`**
```conf
# Enable SQL module
$INCLUDE sql.conf
```

**File: `/etc/freeradius/3.0/mods-available/sql`**
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
    
    # Query untuk authentication
    authorize_check_query = "SELECT id, username, attribute, value, op \
        FROM ${authcheck_table} \
        WHERE username = '%{SQL-User-Name}' \
        ORDER BY id"
    
    # Query untuk reply attributes
    authorize_reply_query = "SELECT id, username, attribute, value, op \
        FROM ${authreply_table} \
        WHERE username = '%{SQL-User-Name}' \
        ORDER BY id"
    
    # Accounting queries
    accounting_start_query = "INSERT INTO ${acct_table1} (...) VALUES (...)"
    accounting_stop_query = "UPDATE ${acct_table1} SET ... WHERE ..."
}
```

### 2. Laravel Integration

**Model: `app/Models/RadiusUser.php`**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RadiusUser extends Model
{
    protected $table = 'radcheck';
    public $timestamps = false;
    
    protected $fillable = ['username', 'attribute', 'op', 'value'];
    
    // Create PPPoE user in FreeRADIUS
    public static function createPPPoEUser($username, $password, $package)
    {
        // Insert password
        self::create([
            'username' => $username,
            'attribute' => 'Cleartext-Password',
            'op' => ':=',
            'value' => $password
        ]);
        
        // Insert rate limit
        RadiusReply::create([
            'username' => $username,
            'attribute' => 'Mikrotik-Rate-Limit',
            'op' => ':=',
            'value' => "{$package->speed_upload}M/{$package->speed_download}M"
        ]);
        
        // Insert to group
        RadiusUserGroup::create([
            'username' => $username,
            'groupname' => 'pppoe_users',
            'priority' => 1
        ]);
    }
    
    // Create Hotspot voucher
    public static function createVoucher($code, $package)
    {
        // Insert voucher code
        self::create([
            'username' => $code,
            'attribute' => 'Cleartext-Password',
            'op' => ':=',
            'value' => $code
        ]);
        
        // Session timeout (in seconds)
        $timeout = $package->duration * 24 * 3600;
        self::create([
            'username' => $code,
            'attribute' => 'Session-Timeout',
            'op' => ':=',
            'value' => $timeout
        ]);
        
        // Rate limit
        RadiusReply::create([
            'username' => $code,
            'attribute' => 'Mikrotik-Rate-Limit',
            'op' => ':=',
            'value' => "{$package->speed_upload}M/{$package->speed_download}M"
        ]);
    }
}
```

### 3. Mikrotik Configuration

**PPPoE Server + RADIUS:**
```routeros
# Add RADIUS server
/radius
add address=192.168.1.100 secret=sharedsecret123 service=ppp

# Enable RADIUS for PPPoE
/ppp aaa
set use-radius=yes

# Create PPPoE server
/interface pppoe-server server
add interface=ether2 service-name=ISP default-profile=default-encryption
```

**Hotspot + RADIUS:**
```routeros
# Add RADIUS server
/radius
add address=192.168.1.100 secret=sharedsecret123 service=hotspot

# Enable RADIUS for Hotspot
/ip hotspot profile
set default use-radius=yes

# Create Hotspot
/ip hotspot
add interface=ether3 address-pool=hotspot-pool profile=default
```

---

## 🚀 Roadmap Pengembangan

### **FASE 1: Core System (Prioritas Tinggi)**
**Target: 2-3 Minggu**

✅ **Week 1-2:**
- [ ] Setup Laravel project + authentication
- [ ] Database migration (semua tabel)
- [ ] Role & permission system (Spatie Permission)
- [ ] Dashboard untuk semua role
- [ ] CRUD Packages (paket internet)
- [ ] CRUD Routers (Mikrotik)
- [ ] FreeRADIUS integration (radcheck, radreply)

✅ **Week 3:**
- [ ] CRUD Client PPPoE
- [ ] Generate Voucher (basic)
- [ ] Reseller management (CRUD + balance)
- [ ] NOC monitoring dashboard
- [ ] Audit log system

### **FASE 2: Advanced Features**
**Target: 2-3 Minggu**

✅ **Week 4-5:**
- [ ] Voucher batch generation
- [ ] Voucher print template (PDF)
- [ ] Reseller commission system
- [ ] Transaction history
- [ ] Usage statistics & reports
- [ ] Client self-service portal

✅ **Week 6:**
- [ ] Real-time monitoring (online users)
- [ ] Bandwidth usage charts
- [ ] Connection history
- [ ] Email notifications
- [ ] WhatsApp notifications (optional)

### **FASE 3: Payment Integration (Future)**
**Target: 2-4 Minggu**

✅ **Week 7-8:**
- [ ] Payment gateway integration (Midtrans/Xendit)
- [ ] Invoice generation
- [ ] Auto-suspend expired clients
- [ ] Payment reminder system
- [ ] Recurring billing

✅ **Week 9-10:**
- [ ] Payment confirmation workflow
- [ ] Refund system
- [ ] Financial reports
- [ ] Tax calculation (if needed)

### **FASE 4: Optimization & Polish**
**Target: 1-2 Minggu**

✅ **Week 11-12:**
- [ ] Performance optimization
- [ ] Security hardening
- [ ] API documentation
- [ ] User manual
- [ ] Backup & restore system
- [ ] Mobile responsive UI

---

## 📊 Teknologi Stack

### Backend
- **Framework:** Laravel 10.x
- **Database:** MySQL 8.0
- **Queue:** Redis
- **Cache:** Redis
- **Authentication:** Laravel Sanctum
- **Authorization:** Spatie Laravel Permission

### Frontend
- **Template Engine:** Blade
- **CSS Framework:** Tailwind CSS / Bootstrap 5
- **JavaScript:** Alpine.js / Vue.js 3
- **Charts:** Chart.js / ApexCharts
- **Icons:** Heroicons / Font Awesome

### Infrastructure
- **RADIUS:** FreeRADIUS 3.x
- **Router:** Mikrotik RouterOS 6/7
- **Web Server:** Nginx
- **PHP:** PHP 8.1+
- **Process Manager:** Supervisor (for queue workers)

---

## 🔐 Security Considerations

### 1. Authentication & Authorization
- Multi-factor authentication (optional)
- Strong password policy
- Session timeout
- IP whitelist untuk Superadmin
- Rate limiting untuk API

### 2. Data Protection
- Encrypt sensitive data (passwords, secrets)
- HTTPS only
- SQL injection prevention (Eloquent ORM)
- XSS protection
- CSRF protection

### 3. RADIUS Security
- Strong shared secret
- Firewall rules (hanya Mikrotik yang bisa akses RADIUS)
- Regular password rotation
- Monitor failed authentication attempts

### 4. Audit & Compliance
- Log semua aktivitas penting
- Regular backup (daily)
- Disaster recovery plan
- GDPR compliance (jika diperlukan)

---

## 📈 Monitoring & Maintenance

### Daily Tasks
- Monitor active sessions
- Check RADIUS logs
- Review failed authentications
- Monitor bandwidth usage

### Weekly Tasks
- Review audit logs
- Check system performance
- Backup verification
- Update statistics

### Monthly Tasks
- Generate financial reports
- Review reseller performance
- System updates & patches
- Database optimization

---

## 🎯 Key Performance Indicators (KPI)

### Technical KPIs
- RADIUS response time < 100ms
- System uptime > 99.9%
- API response time < 200ms
- Database query time < 50ms

### Business KPIs
- Total active clients
- Monthly recurring revenue (MRR)
- Voucher sales per reseller
- Customer churn rate
- Average revenue per user (ARPU)

---

## 📞 Support & Documentation

### User Documentation
- Admin manual (Superadmin)
- NOC operational guide
- Reseller guide
- Client user guide

### Technical Documentation
- API documentation (Swagger/Postman)
- Database schema
- Deployment guide
- Troubleshooting guide

---

## ✅ Kesimpulan

Sistem ini dirancang untuk:
1. **Scalable** - Bisa handle ribuan user
2. **Secure** - Multi-layer security
3. **Flexible** - Mudah dikembangkan
4. **User-friendly** - Interface intuitif untuk semua role
5. **Maintainable** - Code structure yang clean

**Prioritas Pengembangan:**
1. ✅ Core system (auth, CRUD, FreeRADIUS)
2. ✅ Voucher & Reseller management
3. ✅ Monitoring & reporting
4. 🔄 Payment integration (fase akhir)

Apakah ada bagian yang ingin saya jelaskan lebih detail atau ada yang ingin diubah?
