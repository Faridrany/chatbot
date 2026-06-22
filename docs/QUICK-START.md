# 🚀 Quick Start Guide

## Menjalankan Aplikasi dalam 3 Langkah

### Langkah 1: Cek Setup ✅
Klik 2x file ini:
```
check-setup.bat
```

**Pastikan semua ✓ (centang hijau):**
- ✓ Node.js is installed
- ✓ Python is installed
- ✓ Backend node_modules exists
- ✓ Frontend node_modules exists
- ✓ All data files exist
- ✓ Ports are available

**Jika ada ✗ (silang merah):**
- `npm install` → Jalankan di folder backend dan frontend
- File data missing → Jalankan `cd backend && python main.py --train`

---

### Langkah 2: Start Aplikasi 🚀
Klik 2x file ini:
```
start-all.bat
```

**Akan muncul 2 terminal:**

**Terminal 1 - Backend:**
```
⏳ Loading core data into memory...
✅ Cache loaded: 1200 pengaduan
🟢 Express Server: http://localhost:3001
```

**Terminal 2 - Frontend:**
```
VITE v6.3.5  ready in 432 ms
➜  Local:   http://localhost:3000/
```

**Tunggu 5-10 detik** sampai kedua server siap.

---

### Langkah 3: Buka Browser 🌐
Otomatis terbuka, atau buka manual:
```
http://localhost:3000
```

**Login:**
- Username: `admin`
- Password: `admin123`

---

## Verifikasi Data Muncul ✅

Cek halaman-halaman ini untuk memastikan data loading:

### 1. Dashboard
- Total Pengaduan: harus ada angka (bukan 0)
- Chart/grafik: harus muncul
- Kategori Terbanyak: harus ada nilai

### 2. Ekstraksi Fitur → Statistik Keseluruhan TF-IDF
- Total Fitur TF-IDF: **2612**
- Fitur Terpilih: **1000**
- Unigram: **~2200**
- Bigram: **~400**

### 3. Ekstraksi Fitur → Term & Tokenisasi
- Tabel dengan 50 term
- Ada kolom: Term, TF-IDF Score, N-gram
- Pagination berfungsi

### 4. Random Forest → Bootstrap Sampling
- Jumlah Pohon: **500**
- Data Train: **960**
- Data Test: **240**
- Tabel daftar pohon

### 5. Random Forest → Feature Importance
- Tabel 50 fitur dengan importance bar
- Rank #1 sampai #50
- Ada filter n-gram dan search

### 6. Evaluasi Model → Metrik Evaluasi
- Akurasi: **~89%** (tergantung training)
- Precision: **~0.89**
- Recall: **~0.89**
- F1-Score: **~0.89**

---

## ❌ Troubleshooting Cepat

### Problem: Terminal backend error "Cannot find module 'express'"
**Solusi:**
```bash
cd backend
npm install
```

### Problem: Terminal frontend error "Cannot find module"
**Solusi:**
```bash
cd frontend
npm install
```

### Problem: Data tidak muncul setelah login
**Solusi:**
1. Cek terminal backend, pastikan ada log "Cache loaded"
2. Buka: http://localhost:3001/api/tfidf?page=1&limit=1
   - Jika muncul JSON → Backend OK
   - Jika error → Backend tidak jalan atau file data tidak ada
3. Tekan F12 di browser → Cek tab Console untuk error
4. Jika ada error "Failed to fetch" → Backend tidak jalan
5. Jika ada error "404" → Proxy tidak berfungsi, restart frontend

### Problem: Port 3001 atau 3000 sudah dipakai
**Solusi Windows:**
```bash
# Cari PID yang pakai port
netstat -ano | findstr :3001

# Kill process (ganti 1234 dengan PID yang muncul)
taskkill /PID 1234 /F
```

**Solusi Linux/Mac:**
```bash
# Kill process di port 3001
kill -9 $(lsof -t -i:3001)
```

### Problem: File data tidak ada
**Solusi:**
```bash
cd backend
python main.py --train
```
Tunggu ~30-60 detik sampai selesai.

---

## 📁 File yang Harus Ada

Cek folder `data/`:
- ✅ `hasil_training.json` (~2 KB)
- ✅ `tfidf_terms.json` (~400 KB)
- ✅ `processed/final_processed.json` (~500 KB)
- ✅ `raw/dataset_berlabel.json` (~500 KB)

**Jika tidak ada, regenerate:**
```bash
cd backend
python main.py --train
```

---

## 🔗 URL Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web UI |
| Backend API | http://localhost:3001/api/* | REST API |
| Test Endpoint | http://localhost:3001/api/tfidf?page=1&limit=1 | Quick test |

---

## 💾 Backup Commands

**Jika start-all.bat tidak berfungsi, gunakan manual:**

**Terminal 1 (Backend):**
```bash
cd backend
node server.js
```

**Terminal 2 (Frontend) - buka terminal baru:**
```bash
cd frontend
npm run dev
```

---

## 📚 Dokumentasi Lengkap

- **Masalah data tidak muncul?** → Baca `TROUBLESHOOTING.md`
- **Cara startup lengkap?** → Baca `README-STARTUP.md`
- **Penjelasan solusi?** → Baca `SOLUSI-DATA-TIDAK-MUNCUL.md`

---

## ✅ Checklist Sebelum Mulai

- [ ] Node.js terinstall (cek: `node --version`)
- [ ] Python terinstall (cek: `python --version`)
- [ ] Dependencies terinstall (`npm install` di backend & frontend)
- [ ] File data lengkap (jalankan `check-setup.bat`)
- [ ] Port 3000 dan 3001 available
- [ ] Backend jalan dan menampilkan "Cache loaded"
- [ ] Frontend jalan dan membuka browser
- [ ] Login berhasil (admin/admin123)
- [ ] Data muncul di Dashboard

**Jika semua ✅ → Aplikasi siap digunakan! 🎉**

---

## 🆘 Bantuan

Masih bermasalah?
1. Jalankan `check-setup.bat` dan screenshot hasilnya
2. Screenshot browser console (F12 → tab Console)
3. Screenshot terminal backend dan frontend
4. Baca dokumentasi lengkap di `TROUBLESHOOTING.md`
