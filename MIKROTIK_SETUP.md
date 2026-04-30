# 🔧 Konfigurasi Mikrotik untuk RadiusBill

## Status Sistem

| Komponen | Status | Keterangan |
|----------|--------|------------|
| Laravel API | ✅ Ready | http://127.0.0.1:8000 |
| FreeRADIUS | ✅ Ready | Port 1812/udp (auth), 1813/udp (acct) |
| MySQL | ✅ Ready | Database `radius` |
| radcheck | ✅ Ada user | `budi-pppoe` / `password` |

---

## 📋 Informasi yang Dibutuhkan

Sebelum konfigurasi Mikrotik, pastikan Anda tahu:

| Parameter | Nilai (Development) | Keterangan |
|-----------|-------------------|------------|
| RADIUS Server IP | `192.168.111.105` | IP Mac Anda di jaringan |
| RADIUS Secret | `testing123` | Shared secret |
| Auth Port | `1812` | Default |
| Acct Port | `1813` | Default |
| Test Username | `budi-pppoe` | PPPoE username |
| Test Password | `password` | PPPoE password |

> ⚠️ **PENTING**: Ganti `192.168.111.105` dengan IP Mac Anda yang bisa diakses dari Mikrotik!

---

## 🚀 Konfigurasi Mikrotik (Copy-Paste ke Terminal)

### Cara 1: Via Winbox Terminal / SSH

Buka Terminal di Winbox atau SSH ke Mikrotik, lalu paste script berikut:

```routeros
# ============================================
# RADIUS SERVER CONFIGURATION
# ============================================
# Ganti IP_MAC_ANDA dengan IP Mac/Server Anda
# Contoh: 192.168.111.105

/radius
add address=192.168.111.105 secret=testing123 service=ppp,hotspot timeout=3000

# ============================================
# PPPoE SERVER CONFIGURATION
# ============================================

# 1. Buat IP Pool untuk client PPPoE
/ip pool
add name=pppoe-pool ranges=10.10.10.2-10.10.10.254

# 2. Buat PPPoE Profile
/ppp profile
add name=radius-profile local-address=10.10.10.1 remote-address=pppoe-pool \
    use-encryption=no dns-server=8.8.8.8,8.8.4.4

# 3. Aktifkan RADIUS untuk PPP (AAA)
/ppp aaa
set use-radius=yes accounting=yes interim-update=5m

# 4. Buat PPPoE Server (ganti ether2 dengan interface yang terhubung ke client)
/interface pppoe-server server
add service-name=RadiusBill-PPPoE interface=ether2 default-profile=radius-profile \
    authentication=pap,chap,mschap1,mschap2 disabled=no

# ============================================
# HOTSPOT SERVER CONFIGURATION (Opsional)
# ============================================

# 1. Setup Hotspot (ganti ether3 dengan interface hotspot)
# /ip hotspot
# add name=hotspot1 interface=ether3 address-pool=hotspot-pool

# 2. Hotspot Profile
# /ip hotspot profile
# set default use-radius=yes accounting=yes

# ============================================
# FIREWALL (Opsional - untuk NAT client)
# ============================================
/ip firewall nat
add chain=srcnat out-interface=ether1 action=masquerade comment="NAT PPPoE Clients"

# ============================================
# VERIFIKASI
# ============================================
# Cek RADIUS server terdaftar:
/radius print

# Cek PPPoE server aktif:
/interface pppoe-server server print

# Cek AAA settings:
/ppp aaa print
```

---

## 🧪 Testing Step-by-Step

### Step 1: Pastikan Mikrotik bisa reach RADIUS server

Dari Mikrotik terminal:
```routeros
/ping 192.168.111.105 count=3
```

Harus reply. Jika tidak:
- Cek kabel/wifi
- Cek firewall Mac (System Preferences → Security → Firewall → matikan sementara)
- Pastikan Mikrotik dan Mac di network yang sama

### Step 2: Test RADIUS dari Mikrotik

```routeros
# Cek apakah RADIUS server merespons
/radius monitor 0
```

Lihat kolom `requests` dan `accepts`. Jika `accepts > 0`, RADIUS sudah terhubung.

### Step 3: Test PPPoE Login

1. **Di komputer client** (yang terhubung ke ether2 Mikrotik):
   - Buat koneksi PPPoE baru
   - Username: `budi-pppoe`
   - Password: `password`
   
2. **Di Windows:**
   - Control Panel → Network → Set up new connection → Broadband (PPPoE)
   - Username: `budi-pppoe`, Password: `password`

3. **Di Linux/Mac:**
   ```bash
   # Linux
   sudo pppoeconf
   # atau
   sudo pon dsl-provider
   ```

### Step 4: Verifikasi di Mikrotik

```routeros
# Lihat active connections
/ppp active print

# Harus muncul:
#  0 R name="budi-pppoe" service=pppoe caller-id="XX:XX:XX:XX:XX:XX" 
#    address=10.10.10.X uptime=...
```

### Step 5: Verifikasi di Panel (Laravel)

Buka browser → `http://localhost:3000/monitoring`
- Login sebagai admin
- Cek "Online Users" → harus muncul `budi-pppoe`

---

## 🔍 Troubleshooting

### Mikrotik tidak bisa connect ke RADIUS

```routeros
# 1. Cek RADIUS status
/radius print
# Pastikan status bukan "timeout"

# 2. Cek log
/log print where topics~"radius"
```

**Solusi umum:**
- Pastikan IP RADIUS server benar
- Pastikan secret sama di kedua sisi
- Pastikan port 1812/udp tidak diblokir firewall Mac
- Di Mac, matikan firewall sementara: System Settings → Network → Firewall → Off

### PPPoE client tidak bisa login

```routeros
# Cek log PPPoE
/log print where topics~"pppoe"

# Cek log RADIUS
/log print where topics~"radius"
```

**Pesan error umum:**
| Error | Penyebab | Solusi |
|-------|----------|--------|
| `radius timeout` | RADIUS server tidak bisa diakses | Cek network, firewall |
| `invalid user` | Username tidak ada di radcheck | Tambah user via panel |
| `authentication failed` | Password salah | Cek password di radcheck |
| `no response` | FreeRADIUS mati | `docker ps`, restart container |

### Cara cek dari sisi FreeRADIUS (debug)

```bash
# Lihat log real-time FreeRADIUS
docker logs -f radius-server

# Atau jalankan dalam mode debug
docker compose down
docker compose up freeradius  # tanpa -d, lihat output langsung
```

---

## 📊 Alur Kerja Lengkap

```
Client PPPoE                Mikrotik              FreeRADIUS           MySQL (Laravel)
     │                         │                      │                      │
     │── PPPoE Connect ──────▶│                      │                      │
     │   (user: budi-pppoe)   │                      │                      │
     │                         │── Access-Request ──▶│                      │
     │                         │   (user+pass+secret)│                      │
     │                         │                      │── SELECT radcheck ──▶│
     │                         │                      │◀── password match ───│
     │                         │                      │── SELECT radreply ──▶│
     │                         │                      │◀── rate-limit ───────│
     │                         │◀── Access-Accept ───│                      │
     │                         │   (Rate-Limit:5M/5M)│                      │
     │◀── PPPoE Connected ────│                      │                      │
     │   (IP: 10.10.10.x)    │                      │                      │
     │                         │── Acct-Start ──────▶│                      │
     │                         │                      │── INSERT radacct ───▶│
     │                         │                      │                      │
     │   ... browsing ...      │                      │                      │
     │                         │── Acct-Update ─────▶│                      │
     │                         │   (bytes in/out)    │── UPDATE radacct ───▶│
     │                         │                      │                      │
     │── Disconnect ──────────▶│                      │                      │
     │                         │── Acct-Stop ───────▶│                      │
     │                         │                      │── UPDATE radacct ───▶│
     │                         │                      │   (stop time, total) │
```

---

## ⚡ Quick Setup (Minimal)

Jika hanya ingin test cepat, paste ini di Mikrotik:

```routeros
# GANTI 192.168.111.105 dengan IP Mac Anda!
/radius add address=192.168.111.105 secret=testing123 service=ppp
/ppp aaa set use-radius=yes accounting=yes
/ip pool add name=pppoe-pool ranges=10.10.10.2-10.10.10.254
/ppp profile add name=radius-profile local-address=10.10.10.1 remote-address=pppoe-pool dns-server=8.8.8.8
/interface pppoe-server server add service-name=PPPoE interface=ether2 default-profile=radius-profile disabled=no
```

Lalu test dari client:
- Username: `budi-pppoe`
- Password: `password`

---

## 🔐 Untuk Production

Saat deploy ke server production, yang perlu diubah:

1. **RADIUS Secret** → ganti `testing123` dengan secret yang kuat
2. **IP Address** → ganti dengan IP server production
3. **clients.conf** → hapus `private-network`, tambahkan IP Mikrotik spesifik
4. **Firewall** → buka port 1812/udp dan 1813/udp hanya untuk IP Mikrotik

```routeros
# Production Mikrotik config
/radius
add address=IP_SERVER_PRODUCTION secret=SECRET_KUAT_PRODUCTION service=ppp,hotspot
```

---

## 📝 Menambah User Baru via Panel

1. Login ke panel: `http://localhost:3000/login` (admin/password)
2. Menu **Pelanggan** → **Add Client**
3. Isi data:
   - Username PPPoE (contoh: `client-001`)
   - Password
   - Pilih paket (menentukan speed)
4. Sistem otomatis:
   - Generate ID Pelanggan (1985XXXXXX)
   - Insert ke `radcheck` (username + password)
   - Insert ke `radreply` (rate limit dari paket)
5. Client langsung bisa login PPPoE!

---

## ✅ Checklist Sebelum Test

- [ ] Mac dan Mikrotik di network yang sama
- [ ] `docker ps` → radius-server running
- [ ] Firewall Mac dimatikan (untuk testing)
- [ ] IP Mac benar di konfigurasi Mikrotik
- [ ] Secret sama: `testing123`
- [ ] User `budi-pppoe` ada di radcheck (sudah ada dari seeder)
- [ ] PPPoE server aktif di Mikrotik
- [ ] Client terhubung ke interface PPPoE Mikrotik
