# 🚀 Cara Menjalankan Aplikasi

## Masalah: "npm run dev" tidak jalan atau port conflict

---

## ✅ SOLUSI CEPAT (3 Langkah)

### Langkah 1: Free Port (Bersihkan Port)
```batch
kill-ports.bat
```

**Output yang benar:**
```
✓ Port 3000 is free
✓ Port 3001 is free
✓ Port 3002 is free
```

### Langkah 2: Start Aplikasi
```batch
start-all.bat
```

**Output yang benar:**

**Terminal 1 (Backend):**
```
🟢 Express Server: http://localhost:3001
✅ Cache loaded: 1200 pengaduan
```

**Terminal 2 (Frontend):**
```
VITE v6.3.5  ready in 432 ms
➜  Local:   http://localhost:3000/
```

### Langkah 3: Buka Browser
```
http://localhost:3000
```

**Login:**
- Username: `admin`
- Password: `admin123`

---

## 🔍 Jika Masih Port Conflict

### Cek Port yang Terpakai:
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

**Output contoh:**
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    1234
```

### Kill Manual:
```powershell
# Ganti 1234 dengan PID yang muncul
taskkill /PID 1234 /F
```

### Atau Kill Semua Node Process:
```powershell
taskkill /F /IM node.exe
```

---

## 📋 Troubleshooting

### Problem: Frontend jalan di port 3003 (bukan 3000)

**Penyebab:** Port 3000 sudah dipakai oleh process lain.

**Solusi A:** Gunakan port 3003 (Quick Fix)
```
http://localhost:3003
```
Aplikasi tetap berfungsi normal.

**Solusi B:** Free port 3000 lalu restart
```batch
kill-ports.bat
cd frontend
npm run dev
```

### Problem: Backend error "EADDRINUSE 3001"

**Penyebab:** Port 3001 sudah dipakai.

**Solusi:**
```batch
kill-ports.bat
cd backend
node server.js
```

### Problem: Terminal tidak muncul saat start-all.bat

**Penyebab:** Antivirus atau Windows Defender blocking.

**Solusi:** Jalankan manual:

**Terminal 1:**
```batch
cd backend
node server.js
```

**Terminal 2 (buka terminal baru):**
```batch
cd frontend
npm run dev
```

### Problem: Data tidak muncul di halaman

**Solusi:**
1. Cek backend jalan (cek terminal ada log "Cache loaded")
2. Test API: http://localhost:3001/api/tfidf?page=1&limit=1
3. Buka browser console (F12) lihat error
4. Baca: **TROUBLESHOOTING.md**

---

## 🎯 Checklist

Sebelum start:
- [ ] Jalankan `kill-ports.bat` untuk free port
- [ ] Jalankan `check-setup.bat` untuk cek setup
- [ ] Pastikan semua ✓ (tidak ada ✗)

Setelah start:
- [ ] Backend jalan di port 3001 (cek terminal)
- [ ] Frontend jalan di port 3000/3003 (cek terminal)
- [ ] Browser terbuka otomatis
- [ ] Login berhasil (admin/admin123)
- [ ] Dashboard menampilkan data (bukan loading)

---

## 📚 Dokumentasi Lengkap

| File | Purpose |
|------|---------|
| **CARA-MENJALANKAN.md** | Dokumen ini - cara cepat menjalankan |
| **SOLUSI-PORT-CONFLICT.md** | Detail solusi port conflict |
| **QUICK-START.md** | Quick start 3 langkah |
| **TROUBLESHOOTING.md** | Troubleshooting lengkap |
| **README-STARTUP.md** | Panduan startup detail |

---

## 🛠️ Script yang Tersedia

| Script | Fungsi |
|--------|--------|
| `kill-ports.bat` | Free port 3000, 3001, 3002 |
| `check-setup.bat` | Cek setup aplikasi |
| `start-all.bat` | Start backend + frontend |
| `start-backend.bat` | Start backend saja |
| `start-frontend.bat` | Start frontend saja |

---

## 🔄 Restart Aplikasi

**Jika aplikasi sudah jalan dan ingin restart:**

1. **Tutup terminal** yang menjalankan backend dan frontend
2. **Free port:**
   ```batch
   kill-ports.bat
   ```
3. **Start ulang:**
   ```batch
   start-all.bat
   ```

**Atau kill semua Node process:**
```batch
taskkill /F /IM node.exe
```

---

## 💡 Tips

1. **Selalu free port dulu** sebelum start aplikasi
2. **Gunakan `kill-ports.bat`** untuk kemudahan
3. **Jika port 3000 terpakai**, frontend akan auto-pakai 3003 (tetap OK)
4. **Backend HARUS di port 3001** (frontend proxy ke 3001)
5. **Cek terminal logs** untuk error messages

---

## 🎉 Quick Commands

```batch
# Free all ports
kill-ports.bat

# Check setup
check-setup.bat

# Start everything
start-all.bat

# Kill all Node processes
taskkill /F /IM node.exe
```

---

## ⚠️ Catatan Penting

### Port yang Digunakan:
- **Backend:** 3001 (HARUS ini, tidak bisa ganti)
- **Frontend:** 3000 (bisa 3003, 5173, dll jika terpakai)

### Jika Frontend Jalan di Port Lain:
Frontend tetap bisa akses backend karena proxy Vite otomatis forward `/api/*` ke `http://localhost:3001`

**Contoh:**
- Frontend di: http://localhost:3003
- Request: `fetch("/api/tfidf")`
- Auto-forward ke: http://localhost:3001/api/tfidf

---

**Aplikasi siap digunakan! 🚀**

Jika masih ada masalah, baca **TROUBLESHOOTING.md** atau **SOLUSI-PORT-CONFLICT.md**
