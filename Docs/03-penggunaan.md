# 3. Panduan Penggunaan

## Login

### Staff Login (`/login`)
- Masukkan **username** atau **email** + password
- Auto-detect: jika ada `@` = email, tanpa `@` = username
- Role: superadmin, noc, reseller

### Client Login (`/client-login`)
- Masukkan **ID Pelanggan** (10 digit, awalan 1985) atau **Nomor HP**
- Tanpa password
- Langsung masuk ke dashboard pembayaran

---

## Menu Superadmin

### Dashboard
Statistik: online users, active clients, routers, vouchers, revenue, bandwidth.

### Paket
Kelola paket internet. Dua tipe:

**PPPoE:**
- Nama, bandwidth (download/upload), harga, deskripsi

**Hotspot Voucher:**
- Nama, bandwidth, harga
- Batas waktu online (menit/jam/hari)
- Masa aktif setelah login (hari)
- Kuota (opsional)
- Komisi reseller (nominal Rp per voucher)

### Pelanggan
Kelola client PPPoE:
- ID Pelanggan (auto-generate 1985XXXXXX)
- Username & password PPPoE (password ditampilkan untuk konfigurasi ulang)
- Paket, alamat, telepon, billing date
- Suspend / Activate / Delete

### Router
Kelola router Mikrotik:
- Nama, IP, secret, tipe, lokasi
- Auto-sync ke FreeRADIUS NAS table
- Test connection (ping)

### Voucher
Generate dan kelola voucher hotspot:

**Buat Manual:**
- Pilih paket → isi username → password otomatis sama dengan username
- Untuk kebutuhan custom (tamu VIP, dll)

**Generate (Bulk):**
- Pilih paket → jumlah → panjang kode (6/8/10/12) → prefix (opsional)
- Checkbox "Username & Password sama"
- Kode otomatis huruf kecil: `wifi-abcd1234`

**Filter:**
- Search kode, status (tersedia/terpakai/expired), waktu (hari ini/7/30/90 hari)

**Cek Voucher:**
- Masukkan kode → lihat status & detail paket

### Staff
Kelola user staff (admin, NOC, reseller):
- Tambah/edit/hapus user
- Pilih role: Super Admin, NOC, Reseller
- Username untuk login

### Monitoring
- Online users real-time
- Session history
- Bandwidth statistics
- Top users

### Pengaturan
- **Umum**: Nama aplikasi, deskripsi, info perusahaan
- **Tampilan**: Upload logo, dark/light mode
- **Password**: Ganti password akun
- **Tools**: Ping, Traceroute
- **Sistem**: Info PHP, Laravel, disk, memory, uptime

---

## Menu Reseller

### Dashboard
Statistik voucher: tersedia, terpakai, saldo.

### Voucher
- Hanya melihat voucher milik sendiri
- Generate voucher (harga sudah dipotong komisi)
- Cek voucher

---

## Menu Client (PPPoE)

### Dashboard Pelanggan
- Kartu ID Pelanggan
- Info paket & tagihan
- Jatuh tempo pembayaran
- Tombol "Bayar Sekarang" (payment gateway — coming soon)
- Usage: download, upload, waktu online
- Riwayat pembayaran

---

## Alur Kerja

### Tambah Client PPPoE
1. Admin → Pelanggan → Tambah
2. Isi data → Simpan
3. Otomatis: generate ID pelanggan + create di FreeRADIUS
4. Client bisa login PPPoE

### Generate Voucher
1. Admin/Reseller → Voucher → Generate
2. Pilih paket → jumlah → Generate
3. Voucher siap digunakan di hotspot
4. User login dengan kode voucher sebagai username (& password)

### Voucher Dipakai
1. User connect ke hotspot Mikrotik
2. Masukkan kode voucher sebagai username & password
3. FreeRADIUS authenticate → Accept + rate limit
4. Timer uptime & expire mulai berjalan
