# Panduan Penggunaan - FreeRADIUS Billing System

## 📖 Daftar Isi

1. [Setup Awal](#setup-awal)
2. [Login & Authentication](#login--authentication)
3. [Manajemen Package](#manajemen-package)
4. [Manajemen Router](#manajemen-router)
5. [Manajemen Client PPPoE](#manajemen-client-pppoe)
6. [Manajemen Voucher Hotspot](#manajemen-voucher-hotspot)
7. [Manajemen Reseller](#manajemen-reseller)
8. [Monitoring](#monitoring)
9. [Dashboard](#dashboard)

---

## Setup Awal

### 1. Install Aplikasi

```bash
# Clone repository
git clone <repo-url>
cd freeradius-api

# Install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Konfigurasi database di .env
nano .env

# Run migrations
php artisan migrate
php artisan db:seed

# Start server
php artisan serve
```

### 2. Install FreeRADIUS

```bash
# Jalankan script otomatis
chmod +x install-freeradius.sh
sudo ./install-freeradius.sh

# Ikuti instruksi, masukkan:
# - Database host (default: localhost)
# - Database name (default: freeradius_billing)
# - Database user
# - Database password
# - RADIUS secret (untuk Mikrotik)
```

### 3. Konfigurasi Mikrotik

```bash
# Generate config file
chmod +x configure-mikrotik.sh
./configure-mikrotik.sh

# Ikuti instruksi, masukkan:
# - FreeRADIUS server IP
# - RADIUS secret (sama dengan step 2)
# - Interface untuk PPPoE
# - Interface untuk Hotspot

# Import ke Mikrotik
# File: mikrotik-config.rsc
# Via Winbox: Files > Upload > Terminal > import mikrotik-config.rsc
```

---

## Login & Authentication

### Login via API

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

**Response:**
```json
{
  "token": "1|abc123xyz...",
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@example.com",
    "role": "superadmin"
  }
}
```

**Simpan token** untuk digunakan di request selanjutnya.

### Gunakan Token

Semua request selanjutnya harus menyertakan header:
```
Authorization: Bearer YOUR_TOKEN
```

---

## Manajemen Package

### 1. Lihat Semua Package

```bash
curl -X GET http://localhost:8000/api/packages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Tambah Package PPPoE

```bash
curl -X POST http://localhost:8000/api/packages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paket 10 Mbps",
    "type": "pppoe",
    "price": 250000,
    "speed_profile": "10M/10M",
    "duration": 30,
    "description": "Paket internet 10 Mbps unlimited",
    "status": "active"
  }'
```

### 3. Tambah Package Hotspot

```bash
curl -X POST http://localhost:8000/api/packages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Voucher 5 Mbps - 7 Hari",
    "type": "hotspot",
    "price": 50000,
    "speed_profile": "5M/5M",
    "duration": 7,
    "quota": 10240,
    "description": "Voucher hotspot 5 Mbps, 7 hari, kuota 10 GB",
    "status": "active"
  }'
```

**Field Penting:**
- `type`: `pppoe` atau `hotspot`
- `speed_profile`: Format `DOWNLOAD/UPLOAD` (contoh: `10M/10M`, `512K/1M`)
- `duration`: Durasi dalam hari
- `quota`: Kuota dalam MB (opsional, untuk hotspot)

---

## Manajemen Router

### 1. Tambah Router Mikrotik

```bash
curl -X POST http://localhost:8000/api/routers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Router Pusat",
    "ip_address": "192.168.1.1",
    "secret": "rahasia123",
    "api_port": 8728,
    "api_username": "admin",
    "api_password": "adminpass",
    "location": "Kantor Pusat",
    "status": "active"
  }'
```

**Response:**
```json
{
  "message": "Router created successfully",
  "router": {
    "id": 1,
    "name": "Router Pusat",
    "ip_address": "192.168.1.1"
  },
  "radius_synced": true
}
```

**Catatan:** Router otomatis ditambahkan ke FreeRADIUS NAS table.

### 2. Test Koneksi Router

```bash
curl -X POST http://localhost:8000/api/routers/1/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Lihat Statistik Router

```bash
curl -X GET http://localhost:8000/api/routers/1/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "router": {
    "id": 1,
    "name": "Router Pusat"
  },
  "statistics": {
    "total_clients": 50,
    "active_clients": 45,
    "suspended_clients": 3,
    "expired_clients": 2
  }
}
```

---

## Manajemen Client PPPoE

### 1. Tambah Client Baru

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
    "ip_address": "192.168.100.10",
    "installation_address": "Jl. Merdeka No. 123, Jakarta",
    "phone": "081234567890",
    "billing_date": 1
  }'
```

**Yang Terjadi:**
1. ✅ User account dibuat
2. ✅ Client record dibuat
3. ✅ User ditambahkan ke FreeRADIUS (radcheck + radreply)
4. ✅ Rate limit diset sesuai package
5. ✅ Client bisa langsung login via PPPoE

### 2. Suspend Client

```bash
curl -X POST http://localhost:8000/api/clients/1/suspend \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Yang Terjadi:**
- Password di FreeRADIUS diganti random string
- Client tidak bisa login
- Session aktif tetap berjalan (disconnect manual via Mikrotik)

### 3. Activate Client

```bash
curl -X POST http://localhost:8000/api/clients/1/activate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Yang Terjadi:**
- Password di FreeRADIUS dikembalikan
- Client bisa login lagi

### 4. Update Package Client

```bash
curl -X PUT http://localhost:8000/api/clients/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": 2
  }'
```

**Yang Terjadi:**
- Rate limit di FreeRADIUS otomatis diupdate
- Client perlu reconnect untuk apply rate limit baru

### 5. Hapus Client

```bash
curl -X DELETE http://localhost:8000/api/clients/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Yang Terjadi:**
- Client dihapus dari database
- User dihapus dari FreeRADIUS
- User account dihapus

---

## Manajemen Voucher Hotspot

### 1. Generate Voucher (Single)

```bash
curl -X POST http://localhost:8000/api/vouchers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": 2,
    "reseller_id": 1,
    "quantity": 1,
    "expired_at": "2026-12-31"
  }'
```

**Response:**
```json
{
  "message": "1 voucher(s) created successfully",
  "vouchers": [
    {
      "id": 1,
      "code": "ABCD1234EFGH5678",
      "package_id": 2,
      "status": "available",
      "expired_at": "2026-12-31"
    }
  ]
}
```

### 2. Generate Voucher Bulk

```bash
curl -X POST http://localhost:8000/api/vouchers/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": 2,
    "reseller_id": 1,
    "quantity": 100,
    "expired_at": "2026-12-31"
  }'
```

**Response:**
```json
{
  "message": "100 vouchers generated successfully",
  "count": 100,
  "vouchers": [...]
}
```

### 3. Cek Validitas Voucher

```bash
curl -X POST http://localhost:8000/api/vouchers/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ABCD1234EFGH5678"
  }'
```

**Response (Valid):**
```json
{
  "valid": true,
  "voucher": {
    "code": "ABCD1234EFGH5678",
    "package": {
      "name": "Voucher 5 Mbps - 7 Hari",
      "duration": 7,
      "speed_profile": "5M/5M"
    },
    "status": "available"
  },
  "message": "Voucher is valid"
}
```

### 4. Gunakan Voucher

```bash
curl -X POST http://localhost:8000/api/vouchers/1/use \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Yang Terjadi:**
- Status voucher berubah jadi `used`
- `used_at` timestamp diset
- Voucher tidak bisa digunakan lagi

---

## Manajemen Reseller

### 1. Tambah Reseller

```bash
curl -X POST http://localhost:8000/api/resellers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Reseller ABC",
    "email": "reseller@example.com",
    "password": "password123",
    "phone": "081234567890",
    "commission_percentage": 10,
    "balance": 0,
    "status": "active"
  }'
```

**Yang Terjadi:**
1. User account dibuat dengan role `reseller`
2. Reseller profile dibuat
3. Reseller bisa login dan generate voucher

### 2. Lihat Laporan Penjualan

```bash
curl -X GET "http://localhost:8000/api/resellers/1/sales-report?start_date=2026-04-01&end_date=2026-04-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "reseller": {
    "id": 1,
    "user": {
      "name": "Reseller ABC"
    }
  },
  "report": {
    "period": {
      "start": "2026-04-01",
      "end": "2026-04-30"
    },
    "total_vouchers_generated": 150,
    "vouchers_used": 120,
    "vouchers_available": 25,
    "vouchers_expired": 5,
    "total_revenue": 6000000,
    "commission_earned": 600000
  }
}
```

### 3. Top Up Balance

```bash
curl -X POST http://localhost:8000/api/resellers/1/add-balance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500000,
    "note": "Top up saldo"
  }'
```

---

## Monitoring

### 1. Lihat User Online

```bash
curl -X GET http://localhost:8000/api/monitoring/online-users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "online_count": 45,
  "sessions": {
    "data": [
      {
        "username": "john123",
        "nas_ip": "192.168.1.1",
        "framed_ip": "10.10.10.5",
        "session_id": "abc123",
        "start_time": "2026-04-30 10:00:00",
        "duration_formatted": "02:30:15",
        "download_formatted": "150.50 MB",
        "upload_formatted": "45.20 MB",
        "total_formatted": "195.70 MB"
      }
    ]
  }
}
```

### 2. Lihat Statistik Bandwidth

```bash
curl -X GET "http://localhost:8000/api/monitoring/bandwidth-stats?period=today" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "period": "today",
  "statistics": {
    "unique_users": 120,
    "total_sessions": 350,
    "total_bandwidth": 10737418240,
    "total_formatted": "10.00 GB",
    "download_formatted": "6.50 GB",
    "upload_formatted": "3.50 GB"
  },
  "top_users": [
    {
      "username": "john123",
      "total_bandwidth": 1073741824,
      "formatted": "1.00 GB"
    }
  ]
}
```

### 3. Lihat Session History

```bash
curl -X GET "http://localhost:8000/api/monitoring/session-history?username=john123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Real-time Stats

```bash
curl -X GET http://localhost:8000/api/monitoring/realtime-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "online_users": 45,
  "total_clients": 150,
  "active_clients": 120,
  "total_vouchers": 500,
  "available_vouchers": 350,
  "today_bandwidth": {
    "download": 5368709120,
    "upload": 2147483648,
    "total": 7516192768,
    "total_formatted": "7.00 GB"
  }
}
```

---

## Dashboard

### Get Dashboard (Role-based)

```bash
curl -X GET http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response berbeda berdasarkan role:**

#### Superadmin/NOC Dashboard
- Overview statistics (clients, packages, routers, resellers)
- Revenue statistics
- Bandwidth usage
- Recent clients
- Expiring clients
- Package distribution
- Monthly revenue chart

#### Reseller Dashboard
- Voucher statistics
- Sales this month
- Recent vouchers
- Daily sales chart
- Balance & commission info

#### Client Dashboard
- Account status
- Days remaining
- Online status
- Total usage (download/upload)
- Recent sessions
- Recent transactions

---

## Tips & Best Practices

### 1. Naming Convention

**Username Client:**
- Gunakan format: `area-nama` (contoh: `jkt-john`, `bdg-jane`)
- Hindari spasi dan karakter khusus
- Maksimal 64 karakter

**Router Name:**
- Gunakan nama lokasi (contoh: `Router-Pusat`, `Router-Cabang-A`)

### 2. Speed Profile Format

Format: `DOWNLOAD/UPLOAD`

Contoh:
- `10M/10M` = 10 Mbps download, 10 Mbps upload
- `20M/5M` = 20 Mbps download, 5 Mbps upload
- `512K/512K` = 512 Kbps download, 512 Kbps upload
- `1G/1G` = 1 Gbps download, 1 Gbps upload

### 3. Billing Date

- Gunakan tanggal 1-31
- Jika tanggal > hari di bulan tersebut, akan diset ke hari terakhir
- Contoh: billing_date = 31, di bulan Februari akan jadi 28/29

### 4. Voucher Code

- Auto-generate 16 karakter (ABCD1234EFGH5678)
- Unique per voucher
- Case-insensitive saat check

### 5. Commission Calculation

```
Commission = (Package Price × Commission Percentage) / 100
```

Contoh:
- Package price: Rp 50.000
- Commission: 10%
- Commission earned: Rp 5.000

### 6. Rate Limit di Mikrotik

Rate limit format di FreeRADIUS:
```
Mikrotik-Rate-Limit = "UPLOAD/DOWNLOAD"
```

Contoh:
- Speed profile: `10M/10M`
- FreeRADIUS value: `10240k/10240k` (dalam Kbps)

---

## Troubleshooting

### Client tidak bisa login PPPoE

1. **Cek FreeRADIUS:**
```bash
sudo tail -f /var/log/freeradius/radius.log
```

2. **Cek database:**
```sql
SELECT * FROM radcheck WHERE username = 'john123';
SELECT * FROM radreply WHERE username = 'john123';
```

3. **Cek NAS:**
```sql
SELECT * FROM nas WHERE nasname = '192.168.1.1';
```

4. **Test RADIUS:**
```bash
radtest john123 password123 localhost 0 testing123
```

### Voucher tidak valid

1. **Cek status voucher:**
```bash
curl -X POST http://localhost:8000/api/vouchers/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"code": "ABCD1234EFGH5678"}'
```

2. **Cek expired_at:**
- Pastikan belum expired
- Format: YYYY-MM-DD

### Rate limit tidak apply

1. **Client harus reconnect** setelah update package
2. **Cek radreply:**
```sql
SELECT * FROM radreply WHERE username = 'john123' AND attribute = 'Mikrotik-Rate-Limit';
```

3. **Disconnect client dari Mikrotik:**
```
/ppp active print
/ppp active remove [number]
```

---

## Workflow Lengkap

### Setup ISP Baru

1. **Install aplikasi** (Laravel + FreeRADIUS)
2. **Tambah router** Mikrotik
3. **Buat package** (PPPoE & Hotspot)
4. **Tambah reseller** (opsional)
5. **Generate voucher** untuk hotspot
6. **Tambah client** PPPoE
7. **Monitor** usage & sessions

### Onboarding Client PPPoE

1. Admin tambah client via API
2. Client terima username & password
3. Client setup PPPoE di router/device
4. Client connect
5. FreeRADIUS authenticate
6. Mikrotik apply rate limit
7. Client online

### Penjualan Voucher

1. Reseller generate voucher bulk
2. Reseller jual voucher ke end-user
3. End-user gunakan voucher di hotspot
4. System mark voucher as used
5. Commission dihitung untuk reseller
6. Admin lihat laporan penjualan

---

## Integrasi dengan Frontend

Aplikasi ini adalah **backend API only**. Untuk membuat frontend:

### Recommended Stack
- **React** + Vite + TailwindCSS
- **Vue.js** + Nuxt + TailwindCSS
- **Next.js** + TailwindCSS

### Authentication Flow
1. User login → dapat token
2. Simpan token di localStorage/cookie
3. Setiap request kirim token di header
4. Handle 401 (redirect ke login)

### Example (React)
```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:8000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
};

// Fetch with token
const fetchClients = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:8000/api/clients', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

---

## Support

Untuk pertanyaan lebih lanjut, lihat:
- [API Documentation](API_DOCUMENTATION.md)
- [System Flow Theory](SYSTEM_FLOW_THEORY.md)
- [Setup Guide](SETUP.md)
