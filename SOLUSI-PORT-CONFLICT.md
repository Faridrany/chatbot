# Solusi: Port Conflict & "npm run dev" Tidak Jalan

## 🔍 Masalah yang Terjadi

Ketika menjalankan `npm run dev`, Vite mencoba port 3000, 3001, 3002 tapi semuanya sudah dipakai, akhirnya jalan di **port 3003**.

**Output:**
```
Port 3000 is in use, trying another one...
Port 3001 is in use, trying another one...
Port 3002 is in use, trying another one...
VITE v6.3.5  ready in 862 ms
➜  Local:   http://localhost:3003/
```

---

## ✅ Solusi yang Sudah Dilakukan

### 1. Perbaikan Warning di RFVoting.jsx
**Warning:**
```
The "??" operator here will always return the left operand
training?.akurasi * 100 ?? 91.67
```

**Diperbaiki menjadi:**
```javascript
(training?.akurasi ?? 0.9167) * 100
```

Ini lebih aman karena default value diterapkan sebelum perkalian.

---

## 🔧 Cara Mengatasi Port Conflict

### Opsi 1: Kill Process yang Menggunakan Port (Recommended)

#### Windows:

**1. Cari process yang pakai port 3000, 3001, 3002:**
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3002
```

**Output contoh:**
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    1234
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    5678
```

Angka di kolom terakhir adalah **PID** (Process ID).

**2. Kill process berdasarkan PID:**
```powershell
taskkill /PID 1234 /F
taskkill /PID 5678 /F
```

**3. Jalankan ulang frontend:**
```powershell
cd frontend
npm run dev
```

Sekarang seharusnya jalan di port 3000.

#### Linux/Mac:

**1. Kill process di port tertentu:**
```bash
# Kill port 3000
kill -9 $(lsof -t -i:3000)

# Kill port 3001
kill -9 $(lsof -t -i:3001)

# Kill port 3002
kill -9 $(lsof -t -i:3002)
```

**2. Jalankan ulang frontend:**
```bash
cd frontend
npm run dev
```

---

### Opsi 2: Gunakan Port 3003 (Quick Fix)

Jika Anda tidak masalah dengan port berbeda, frontend sudah jalan di **port 3003**.

**Akses aplikasi:**
```
http://localhost:3003
```

**Login:**
- Username: `admin`
- Password: `admin123`

**Catatan:** Proxy Vite masih berfungsi karena konfigurasi proxy tidak tergantung port frontend.

---

### Opsi 3: Konfigurasi Port Manual di vite.config.js

Edit `frontend/vite.config.js` untuk set port spesifik (misal 5173):

```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,          // Port yang Anda inginkan
    strictPort: false,   // false = cari port lain jika terpakai
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 🔍 Debugging: Cek Port yang Terpakai

### Windows:

**Lihat semua port yang listening:**
```powershell
netstat -ano | findstr LISTENING
```

**Lihat process spesifik:**
```powershell
netstat -ano | findstr :3000
```

**Lihat detail process berdasarkan PID:**
```powershell
tasklist | findstr "1234"
```

### Linux/Mac:

**Lihat semua port yang listening:**
```bash
lsof -i -P -n | grep LISTEN
```

**Lihat port spesifik:**
```bash
lsof -i :3000
```

---

## 🚀 Script Otomatis untuk Kill Port

### Windows (kill-ports.bat):

```batch
@echo off
echo Killing processes on ports 3000, 3001, 3002...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing PID %%a on port 3000
    taskkill /PID %%a /F 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing PID %%a on port 3001
    taskkill /PID %%a /F 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
    echo Killing PID %%a on port 3002
    taskkill /PID %%a /F 2>nul
)

echo Done!
pause
```

**Usage:**
```batch
kill-ports.bat
```

### Linux/Mac (kill-ports.sh):

```bash
#!/bin/bash
echo "Killing processes on ports 3000, 3001, 3002..."

kill -9 $(lsof -t -i:3000) 2>/dev/null && echo "Port 3000 freed"
kill -9 $(lsof -t -i:3001) 2>/dev/null && echo "Port 3001 freed"
kill -9 $(lsof -t -i:3002) 2>/dev/null && echo "Port 3002 freed"

echo "Done!"
```

**Usage:**
```bash
chmod +x kill-ports.sh
./kill-ports.sh
```

---

## 📋 Checklist: Frontend Berjalan dengan Benar

- [ ] **Backend jalan di port 3001** (cek: http://localhost:3001/api/tfidf)
- [ ] **Frontend jalan di port 3000 atau 3003** (cek terminal output)
- [ ] **Browser terbuka otomatis** atau buka manual http://localhost:3000
- [ ] **Login berhasil** (admin / admin123)
- [ ] **Dashboard menampilkan data** (bukan loading terus)
- [ ] **Ekstraksi Fitur menampilkan tabel** (term list muncul)
- [ ] **Random Forest menampilkan statistik** (pohon, akurasi, dll)
- [ ] **Evaluasi Model menampilkan metrik** (accuracy, precision, dll)

---

## ⚠️ Warning yang Muncul di Vite

### Warning: "?? operator will always return the left operand"

**Sudah diperbaiki di:** `frontend/src/components/rf/RFVoting.jsx`

**Sebelum:**
```javascript
{(training?.akurasi * 100 ?? 91.67).toFixed(2)}
```

**Sesudah:**
```javascript
{((training?.akurasi ?? 0.9167) * 100).toFixed(2)}
```

**Penjelasan:**
- `training?.akurasi * 100` akan selalu return number (bisa NaN tapi bukan null/undefined)
- Jadi `?? 91.67` tidak akan pernah dipakai
- Solusi: Berikan default value pada `training?.akurasi` sebelum perkalian

---

## 🎯 Kesimpulan

### Masalah:
1. ✅ Port 3000, 3001, 3002 sudah dipakai → Frontend jalan di 3003
2. ✅ Warning di RFVoting.jsx → Sudah diperbaiki

### Solusi:
1. **Quick fix:** Gunakan port 3003 → http://localhost:3003
2. **Permanent fix:** Kill process yang pakai port 3000-3002
3. **Alternative:** Set port manual di vite.config.js

### Aplikasi Sudah Berjalan:
```
Frontend: http://localhost:3003
Backend:  http://localhost:3001
```

**Akses aplikasi:** http://localhost:3003  
**Login:** admin / admin123

---

## 🔄 Restart Frontend (Jika Perlu)

**Windows:**
```powershell
# Stop frontend (Ctrl+C di terminal)
# Atau tutup terminal

# Start ulang
cd frontend
npm run dev
```

**Linux/Mac:**
```bash
# Stop frontend (Ctrl+C)

# Start ulang
cd frontend
npm run dev
```

---

## 📞 Masih Bermasalah?

1. **Cek backend jalan:**
   ```bash
   curl http://localhost:3001/api/tfidf?page=1&limit=1
   ```
   Atau buka di browser.

2. **Cek browser console (F12):**
   - Lihat ada error merah?
   - Test fetch API berhasil?

3. **Restart kedua server:**
   ```bash
   # Kill semua
   taskkill /F /IM node.exe   # Windows
   killall node               # Linux/Mac

   # Start ulang dengan script
   start-all.bat              # Windows
   ```

4. **Baca dokumentasi:**
   - TROUBLESHOOTING.md → Untuk semua masalah
   - README-STARTUP.md → Untuk cara startup lengkap

---

**Frontend sudah berjalan! 🎉**

Akses: http://localhost:3003 (atau 3000 jika port sudah dibersihkan)
