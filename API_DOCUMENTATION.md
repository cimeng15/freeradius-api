# API Documentation - FreeRADIUS Billing System

## Base URL
```
http://your-domain.com/api
```

## Authentication
All protected endpoints require Bearer token authentication.

### Headers
```
Authorization: Bearer {your_token}
Content-Type: application/json
Accept: application/json
```

---

## Authentication Endpoints

### 1. Login
**POST** `/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com",
    "role": "superadmin"
  }
}
```

### 2. Logout
**POST** `/logout`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### 3. Get Current User
**GET** `/me`

**Response:**
```json
{
  "id": 1,
  "name": "Admin",
  "email": "admin@example.com",
  "role": "superadmin"
}
```

### 4. Change Password
**POST** `/change-password`

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword",
  "new_password_confirmation": "newpassword"
}
```

---

## Dashboard Endpoints

### Get Dashboard Statistics
**GET** `/dashboard`

Returns different data based on user role (superadmin/noc/reseller/client).

**Response (Superadmin):**
```json
{
  "statistics": {
    "total_clients": 150,
    "active_clients": 120,
    "online_users": 45,
    "total_routers": 5
  },
  "revenue": {
    "this_month": 15000000,
    "pending": 2000000,
    "total": 50000000
  },
  "bandwidth": {
    "download": 1073741824,
    "upload": 536870912,
    "download_formatted": "1.00 GB",
    "upload_formatted": "512.00 MB"
  }
}
```

---

## Package Endpoints

### 1. List Packages
**GET** `/packages`

**Query Parameters:**
- `type` (optional): `pppoe` or `hotspot`
- `status` (optional): `active` or `inactive`
- `search` (optional): Search by name

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Paket 10 Mbps",
      "type": "pppoe",
      "price": 250000,
      "speed_profile": "10M/10M",
      "duration": 30,
      "status": "active"
    }
  ]
}
```

### 2. Create Package
**POST** `/packages` (Superadmin only)

**Request Body:**
```json
{
  "name": "Paket 20 Mbps",
  "type": "pppoe",
  "price": 350000,
  "speed_profile": "20M/20M",
  "duration": 30,
  "quota": null,
  "description": "Paket internet 20 Mbps unlimited",
  "status": "active"
}
```

### 3. Update Package
**PUT** `/packages/{id}` (Superadmin only)

### 4. Delete Package
**DELETE** `/packages/{id}` (Superadmin only)

---

## Client Endpoints

### 1. List Clients
**GET** `/clients`

**Query Parameters:**
- `status` (optional): `active`, `suspended`, `expired`
- `search` (optional): Search by username, name, or email

### 2. Create Client
**POST** `/clients` (Superadmin only)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "john123",
  "password": "password123",
  "package_id": 1,
  "ip_address": "192.168.1.100",
  "installation_address": "Jl. Contoh No. 123",
  "phone": "081234567890",
  "billing_date": 1
}
```

### 3. Suspend Client
**POST** `/clients/{id}/suspend` (Superadmin only)

### 4. Activate Client
**POST** `/clients/{id}/activate` (Superadmin only)

### 5. Delete Client
**DELETE** `/clients/{id}` (Superadmin only)

---

## Router Endpoints

### 1. List Routers
**GET** `/routers`

**Query Parameters:**
- `status` (optional): `active` or `inactive`
- `search` (optional): Search by name, IP, or location

### 2. Create Router
**POST** `/routers` (Superadmin only)

**Request Body:**
```json
{
  "name": "Router Pusat",
  "ip_address": "192.168.1.1",
  "secret": "secretkey123",
  "api_port": 8728,
  "api_username": "admin",
  "api_password": "adminpass",
  "location": "Kantor Pusat",
  "status": "active"
}
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

### 3. Test Router Connection
**POST** `/routers/{id}/test`

**Response:**
```json
{
  "router": "Router Pusat",
  "ip_address": "192.168.1.1",
  "reachable": true,
  "message": "Router is reachable"
}
```

### 4. Get Router Statistics
**GET** `/routers/{id}/statistics`

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

## Voucher Endpoints

### 1. List Vouchers
**GET** `/vouchers`

**Query Parameters:**
- `status` (optional): `available`, `used`, `expired`
- `package_id` (optional): Filter by package
- `reseller_id` (optional): Filter by reseller (superadmin only)
- `search` (optional): Search by code

### 2. Create Voucher
**POST** `/vouchers`

**Request Body:**
```json
{
  "package_id": 2,
  "reseller_id": 1,
  "quantity": 1,
  "expired_at": "2026-12-31"
}
```

### 3. Generate Bulk Vouchers
**POST** `/vouchers/bulk`

**Request Body:**
```json
{
  "package_id": 2,
  "reseller_id": 1,
  "quantity": 100,
  "expired_at": "2026-12-31"
}
```

**Response:**
```json
{
  "message": "100 vouchers generated successfully",
  "count": 100,
  "vouchers": [...]
}
```

### 4. Check Voucher
**POST** `/vouchers/check`

**Request Body:**
```json
{
  "code": "ABCD1234EFGH5678"
}
```

**Response:**
```json
{
  "valid": true,
  "voucher": {
    "code": "ABCD1234EFGH5678",
    "package": {
      "name": "Paket Hotspot 5 Mbps",
      "duration": 30
    },
    "status": "available"
  },
  "message": "Voucher is valid"
}
```

### 5. Use Voucher
**POST** `/vouchers/{id}/use`

---

## Reseller Endpoints

### 1. List Resellers
**GET** `/resellers` (Superadmin only)

### 2. Create Reseller
**POST** `/resellers` (Superadmin only)

**Request Body:**
```json
{
  "name": "Reseller ABC",
  "email": "reseller@example.com",
  "password": "password123",
  "phone": "081234567890",
  "commission_percentage": 10,
  "balance": 0,
  "status": "active"
}
```

### 3. Get Sales Report
**GET** `/resellers/{id}/sales-report`

**Query Parameters:**
- `start_date` (optional): Start date (default: start of month)
- `end_date` (optional): End date (default: end of month)

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
    "total_revenue": 12000000,
    "commission_earned": 1200000
  }
}
```

### 4. Add Balance
**POST** `/resellers/{id}/add-balance` (Superadmin only)

**Request Body:**
```json
{
  "amount": 500000,
  "note": "Top up balance"
}
```

### 5. Deduct Balance
**POST** `/resellers/{id}/deduct-balance` (Superadmin only)

---

## Monitoring Endpoints

### 1. Get Online Users
**GET** `/monitoring/online-users` (Superadmin/NOC)

**Query Parameters:**
- `search` (optional): Search by username
- `nasipaddress` (optional): Filter by router IP

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

### 2. Get Session History
**GET** `/monitoring/session-history` (Superadmin/NOC)

**Query Parameters:**
- `username` (optional): Filter by username
- `start_date` (optional): Start date
- `end_date` (optional): End date
- `nasipaddress` (optional): Filter by router IP

### 3. Get Bandwidth Statistics
**GET** `/monitoring/bandwidth-stats` (Superadmin/NOC)

**Query Parameters:**
- `period` (optional): `today`, `week`, `month` (default: `today`)

**Response:**
```json
{
  "period": "today",
  "statistics": {
    "unique_users": 120,
    "total_sessions": 350,
    "total_bandwidth": 10737418240,
    "total_formatted": "10.00 GB",
    "avg_duration_formatted": "01:45:30"
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

### 4. Get User Sessions
**GET** `/monitoring/user-sessions/{username}` (Superadmin/NOC)

### 5. Disconnect User
**POST** `/monitoring/disconnect-user` (Superadmin/NOC)

**Request Body:**
```json
{
  "username": "john123"
}
```

### 6. Get Real-time Statistics
**GET** `/monitoring/realtime-stats` (Superadmin/NOC)

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
    "download_formatted": "5.00 GB",
    "upload_formatted": "2.00 GB",
    "total_formatted": "7.00 GB"
  }
}
```

---

## Role-Based Access Control

### Superadmin
- Full access to all endpoints
- Can create, update, delete all resources
- Can manage users, packages, clients, routers, resellers, vouchers
- Full monitoring access

### NOC (Network Operations Center)
- Read-only access to most resources
- Full monitoring access
- Can view clients, packages, routers
- Cannot create, update, or delete resources

### Reseller
- Can manage their own vouchers
- Can generate bulk vouchers
- Can view their sales reports
- Can check voucher validity
- Access to reseller dashboard

### Client
- Can view their own profile
- Can view their session history
- Can view their usage statistics
- Access to client dashboard

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "message": "Unauthorized access"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## Notes

1. All timestamps are in format: `YYYY-MM-DD HH:MM:SS`
2. All monetary values are in IDR (Indonesian Rupiah)
3. Bandwidth values are in bytes (use `_formatted` fields for human-readable format)
4. Duration values are in seconds (use `_formatted` fields for HH:MM:SS format)
5. Pagination is available on list endpoints (default: 15-20 items per page)
