# 🎨 Diagram & Visual Guide

## Struktur Aplikasi

### Before (Masalah)
```
User Request
    ↓
https://billing.syakirulilmi.my.id
    ↓
Laravel routes/web.php
    ↓
Route::get('/', function () {
    return view('welcome');  ← Halaman Laravel default
});
    ↓
❌ Menampilkan halaman Laravel default
```

### After (Solusi)
```
User Request
    ↓
https://billing.syakirulilmi.my.id
    ↓
Laravel routes/web.php
    ↓
Route::get('/{any}', function () {
    return response()->file(public_path('app/index.html'));  ← React app
});
    ↓
✅ Menampilkan aplikasi React
```

---

## Deployment Flow

```
┌─────────────────────────────────────────────────────────┐
│                  deploy-simple.sh                        │
└─────────────────────────────────────────────────────────┘
                          ↓
    ┌─────────────────────┴─────────────────────┐
    ↓                                             ↓
┌─────────────────┐                    ┌──────────────────┐
│ Build Frontend  │                    │  Setup Laravel   │
│                 │                    │                  │
│ cd frontend     │                    │ composer install │
│ npm install     │                    │ php artisan key  │
│ npm run build   │                    │ php artisan      │
│                 │                    │   migrate        │
│ Output:         │                    │ php artisan seed │
│ public/app/     │                    │ php artisan      │
│   index.html    │                    │   storage:link   │
│   assets/       │                    │                  │
└─────────────────┘                    └──────────────────┘
         ↓                                      ↓
         └──────────────┬───────────────────────┘
                        ↓
              ┌──────────────────┐
              │  Optimize Cache  │
              │                  │
              │ config:cache     │
              │ route:cache      │
              │ view:cache       │
              └──────────────────┘
                        ↓
              ┌──────────────────┐
              │ Set Permissions  │
              │                  │
              │ chmod 755        │
              │ chmod 775        │
              │ chown www:www    │
              └──────────────────┘
                        ↓
                   ✅ DONE!
```

---

## File Structure

### Development
```
freeradius-api/
├── frontend/                    ← React source code
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── components/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          ← Build config
│
├── public/
│   ├── index.php               ← Laravel entry
│   └── storage/                ← Symlink
│
├── routes/
│   ├── api.php                 ← API routes
│   └── web.php                 ← Web routes (serve React)
│
└── .env                        ← Configuration
```

### Production (After Build)
```
freeradius-api/
├── frontend/                    ← React source (tidak diakses)
│   └── ...
│
├── public/                      ← Web root
│   ├── app/                    ← React build (BARU!)
│   │   ├── index.html          ← Entry point
│   │   └── assets/
│   │       ├── index-abc123.js
│   │       └── index-xyz789.css
│   ├── storage/                ← Symlink
│   └── index.php               ← Laravel entry
│
├── routes/
│   ├── api.php
│   └── web.php                 ← Serve public/app/index.html
│
└── .env
```

---

## Request Flow

### API Request
```
User → https://billing.syakirulilmi.my.id/api/login
  ↓
Nginx/Apache
  ↓
public/index.php (Laravel)
  ↓
routes/api.php
  ↓
Controller
  ↓
JSON Response
```

### Static Files
```
User → https://billing.syakirulilmi.my.id/storage/images/logo.png
  ↓
Nginx/Apache
  ↓
public/storage/images/logo.png (symlink)
  ↓
storage/app/public/images/logo.png
  ↓
Image File
```

### Web Request (React App)
```
User → https://billing.syakirulilmi.my.id
  ↓
Nginx/Apache
  ↓
public/index.php (Laravel)
  ↓
routes/web.php
  ↓
Route::get('/{any}', ...)
  ↓
public/app/index.html
  ↓
React App Loads
  ↓
React Router handles /dashboard, /users, etc.
```

---

## aaPanel Configuration

### Site Settings
```
┌─────────────────────────────────────────┐
│ Website Settings                         │
├─────────────────────────────────────────┤
│ Domain: billing.syakirulilmi.my.id      │
│ Root: /www/wwwroot/billing.../          │
│ Run Directory: /public  ← PENTING!      │
│ PHP Version: 8.1                         │
│ Rewrite: Laravel  ← PENTING!            │
└─────────────────────────────────────────┘
```

### Directory Structure in aaPanel
```
/www/wwwroot/billing.syakirulilmi.my.id/
├── public/              ← Run Directory (Web Root)
│   ├── app/            ← React build
│   ├── storage/        ← Symlink
│   └── index.php       ← Entry point
├── app/
├── routes/
├── storage/
└── .env
```

---

## Build Process

### Vite Build
```
frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── components/
└── index.html

         ↓ npm run build

public/app/
├── index.html
└── assets/
    ├── index-abc123.js    ← Bundled JS
    └── index-xyz789.css   ← Bundled CSS
```

### Vite Config
```javascript
// frontend/vite.config.js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: '../public/app',  ← Output ke public/app
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: './index.html'
    }
  }
})
```

---

## Laravel Route Logic

### routes/web.php
```php
Route::get('/{any}', function () {
    $indexPath = public_path('app/index.html');
    
    if (file_exists($indexPath)) {
        // ✅ Serve React app
        return response()->file($indexPath);
    }
    
    // ❌ Frontend not built
    return response()->json([
        'error' => 'Frontend not built',
        'message' => 'Please run: cd frontend && npm run build'
    ], 503);
})->where('any', '^(?!api|storage).*$');
//              ↑
//              Exclude /api/* and /storage/*
```

---

## Deployment Timeline

```
Before Deploy:
├── ❌ public/app/ tidak ada
├── ✅ routes/web.php mengarah ke welcome.blade.php
└── ❌ Website menampilkan Laravel default

After Deploy:
├── ✅ public/app/ ada (hasil build)
├── ✅ routes/web.php mengarah ke public/app/index.html
└── ✅ Website menampilkan React app
```

---

## Troubleshooting Visual

### Problem: Laravel Default Page
```
Browser
  ↓
Request: https://billing.syakirulilmi.my.id
  ↓
Laravel routes/web.php
  ↓
Route::get('/', function () {
    return view('welcome');  ← MASALAH DI SINI
});
  ↓
❌ resources/views/welcome.blade.php
```

### Solution: React App
```
Browser
  ↓
Request: https://billing.syakirulilmi.my.id
  ↓
Laravel routes/web.php
  ↓
Route::get('/{any}', function () {
    return response()->file(public_path('app/index.html'));  ← SOLUSI
});
  ↓
✅ public/app/index.html (React)
```

---

## Checklist Visual

### Pre-Deploy
```
Server:
  ├── [ ] PHP 8.1+ installed
  ├── [ ] Node.js 18+ installed
  ├── [ ] MySQL running
  └── [ ] aaPanel configured

Project:
  ├── [ ] .env configured
  ├── [ ] Database created
  └── [ ] Run Directory: /public
```

### Deploy
```
Commands:
  ├── [1] cd /www/wwwroot/billing.../
  ├── [2] bash deploy-simple.sh
  └── [3] sudo chown -R www:www .
```

### Post-Deploy
```
Verify:
  ├── [ ] public/app/index.html exists
  ├── [ ] public/storage symlink exists
  ├── [ ] Website shows React app
  └── [ ] Can login
```

---

## Success Indicators

### ✅ Deployment Successful
```
Browser → https://billing.syakirulilmi.my.id
  ↓
✅ Modern UI with React
✅ Login page visible
✅ No Laravel logo
✅ Console: No errors
```

### ❌ Deployment Failed
```
Browser → https://billing.syakirulilmi.my.id
  ↓
❌ Laravel default page
❌ "Laravel" title
❌ Laravel logo visible
❌ Console: 404 errors
```

---

**Gunakan diagram ini untuk memahami flow aplikasi!**
