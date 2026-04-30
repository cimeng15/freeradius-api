# 6. Troubleshooting

## RADIUS Timeout (Mikrotik tidak bisa connect)

**Gejala:** Mikrotik log: "radius timeout"

**Cek:**
1. Ping dari Mikrotik ke server: `/ping IP_SERVER`
2. Pastikan secret sama di kedua sisi
3. Pastikan FreeRADIUS running: `docker ps` atau `systemctl status freeradius`
4. Di Mac: jalankan `./docker/radius-forward.sh` (Docker Mac tidak forward UDP ke LAN)

**Di production (Linux):** Masalah ini tidak ada.

## User PPPoE Tidak Bisa Login

```bash
# Cek user di radcheck
mysql -u root -p radius -e "SELECT * FROM radcheck WHERE username='USERNAME';"

# Test RADIUS auth
radtest USERNAME PASSWORD localhost 0 radius123

# Cek log FreeRADIUS
docker logs -f radius-server
# atau
sudo tail -f /var/log/freeradius/radius.log
```

## Voucher Error "Field 'code' doesn't have a default value"

Pastikan menggunakan VoucherController terbaru yang auto-generate kode.

## Logo Tidak Muncul

1. Pastikan `php artisan storage:link` sudah dijalankan
2. Di development: pastikan Vite proxy `/storage` ke Laravel:
   ```js
   // frontend/vite.config.js
   proxy: {
     '/api': { target: 'http://localhost:8000' },
     '/storage': { target: 'http://localhost:8000' }
   }
   ```

## Nama Aplikasi Reset Setelah Logout

Pastikan menggunakan `SettingsContext` terbaru yang:
- Fetch dari `/api/public/settings` (tanpa auth)
- Cache ke `localStorage`

## Lupa Password Superadmin

```bash
php artisan app:reset-password --user=admin --password=passwordbaru
```

Atau via API (butuh APP_KEY dari .env):
```bash
curl -X POST http://localhost:8000/api/reset-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin","new_password":"pass123","master_key":"APP_KEY_DARI_ENV"}'
```

## Reseller Tidak Bisa Lihat Paket

Pastikan route `GET /api/packages` ada di group `role:reseller,superadmin`.

## Dark Mode Tidak Tersimpan

Dark mode disimpan di `localStorage`. Jika clear browser data, akan reset ke light mode.
