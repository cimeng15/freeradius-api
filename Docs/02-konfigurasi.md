# 2. Konfigurasi

## Environment (.env)

```env
# Aplikasi
APP_NAME=RadiusBill
APP_ENV=local          # production untuk deploy
APP_DEBUG=true         # false untuk production

# Database (sama untuk Laravel & FreeRADIUS)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=radius
DB_USERNAME=root
DB_PASSWORD=root

# FreeRADIUS
RADIUS_HOST=127.0.0.1
RADIUS_AUTH_PORT=1812
RADIUS_ACCT_PORT=1813
RADIUS_SECRET=radius123
```

## FreeRADIUS (Docker)

File konfigurasi di `docker/freeradius/`:

| File | Fungsi |
|------|--------|
| `clients.conf` | Daftar client (Mikrotik) yang boleh akses RADIUS |
| `mods-enabled/sql` | Koneksi ke MySQL |
| `sites-enabled/default` | Virtual server config |

### Mengubah RADIUS Secret

1. Edit `docker/freeradius/clients.conf` — ubah `secret`
2. Restart: `docker compose restart freeradius`
3. Update juga di Mikrotik: `/radius set 0 secret=SECRET_BARU`

## Database

Semua tabel dibuat otomatis via migration. Tabel utama:

| Tabel | Fungsi |
|-------|--------|
| `users` | Akun staff & client |
| `clients` | Data pelanggan PPPoE |
| `packages` | Paket internet & voucher |
| `vouchers` | Voucher hotspot |
| `routers` | Router Mikrotik |
| `resellers` | Profil reseller |
| `settings` | Pengaturan sistem |
| `radcheck` | FreeRADIUS — autentikasi user |
| `radreply` | FreeRADIUS — atribut reply (rate limit) |
| `radacct` | FreeRADIUS — accounting (usage) |
| `nas` | FreeRADIUS — NAS/router |

## Reset Password

Jika lupa password superadmin:

```bash
php artisan app:reset-password --user=admin --password=passwordbaru
```
