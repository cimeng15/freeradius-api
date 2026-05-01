# 🎯 MULAI DI SINI!

## Situasi Anda Saat Ini

✅ Database sudah migrate & seed  
✅ Storage link sudah dibuat  
❌ Website masih menampilkan halaman Laravel default  
❌ Seharusnya menampilkan aplikasi React  

**URL**: https://billing.syakirulilmi.my.id

---

## ⚡ Solusi Cepat (5 Menit)

### Langkah 1: SSH ke Server
```bash
ssh root@your-server-ip
```

### Langkah 2: Masuk ke Directory Project
```bash
cd /www/wwwroot/billing.syakirulilmi.my.id
```

### Langkah 3: Jalankan Deployment
```bash
bash deploy-simple.sh
```

### Langkah 4: Set Ownership
```bash
sudo chown -R www:www .
```

### Langkah 5: Buka Website
Akses: https://billing.syakirulilmi.my.id

**Seharusnya sekarang muncul aplikasi React!** 🎉

---

## ❓ Jika Ada Error

### Error: "bash: deploy-simple.sh: Permission denied"
```bash
chmod +x deploy-simple.sh
bash deploy-simple.sh
```

### Error: "npm: command not found"
Install Node.js dulu:
```bash
# Via aaPanel
App Store → Node.js → Install (v18+)

# Atau via SSH
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Lalu ulangi deployment:
```bash
bash deploy-simple.sh
```

### Masih Muncul Laravel Default
```bash
# Clear cache
php artisan optimize:clear

# Cek apakah frontend sudah di-build
ls -la public/app/

# Jika tidak ada, build manual
cd frontend
npm install
npm run build
cd ..
```

---

## 📚 Dokumentasi Lengkap

Jika butuh informasi lebih detail:

1. **[UNTUK_ANDA.md](UNTUK_ANDA.md)** - Panduan khusus untuk situasi Anda
2. **[PANDUAN_VISUAL_AAPANEL.md](PANDUAN_VISUAL_AAPANEL.md)** - Panduan visual step-by-step
3. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solusi masalah umum
4. **[INDEX_DOKUMENTASI.md](INDEX_DOKUMENTASI.md)** - Index semua dokumentasi

---

## 🔑 Login Setelah Berhasil

- **Email**: `admin@example.com`
- **Password**: `password`

⚠️ **Ganti password setelah login pertama!**

---

## 💡 Apa yang Dilakukan Script?

Script `deploy-simple.sh` akan:
1. ✅ Build frontend React → `public/app/`
2. ✅ Install dependencies Laravel
3. ✅ Generate app key (jika belum)
4. ✅ Run migrations & seeders
5. ✅ Create storage link
6. ✅ Cache config, routes, views
7. ✅ Set permissions

---

## 📞 Butuh Bantuan?

Cek logs jika ada error:
```bash
# Laravel logs
tail -50 storage/logs/laravel.log

# Web server logs
tail -50 /www/wwwlogs/billing.syakirulilmi.my.id.error.log
```

Kirim screenshot error ke developer dengan:
1. Output command yang error
2. Isi logs di atas
3. Screenshot browser (F12 → Console)

---

**Selamat mencoba! 🚀**
