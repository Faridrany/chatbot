# Troubleshooting - Data Tidak Memuat

## Masalah: Data tidak memuat di halaman frontend

Jika Anda mengalami masalah data tidak muncul di halaman web, ikuti langkah-langkah berikut:

---

## 🔍 Langkah 1: Cek Backend Server

Backend server harus berjalan di **port 3001** agar frontend dapat mengambil data.

### Cara Mengecek:
1. Buka terminal/command prompt
2. Jalankan:
   ```bash
   cd backend
   node server.js
   ```

### Output yang Benar:
```
⏳ Loading core data into memory...
✅ Cache loaded: 1200 pengaduan (training + klasifikasi), 1200 data latih
🟢 Express Server: http://localhost:3001
📊 Data Pengaduan: 1200 entri siap
```

### Jika Error:
- **Error: Cannot find module 'express'** → Jalankan `npm install` di folder `backend/`
- **Error: EADDRINUSE (port sudah dipakai)** → Tutup proses lain yang menggunakan port 3001
- **Error loading cache** → Pastikan file data ada di folder `data/`:
  - `data/processed/final_processed.json`
  - `data/hasil_training.json`
  - `data/tfidf_terms.json`
  - `data/raw/dataset_berlabel.json`

---

## 🌐 Langkah 2: Cek Frontend Dev Server

Frontend harus berjalan di **port 3000** (atau 5173).

### Cara Mengecek:
1. Buka terminal baru (biarkan backend tetap berjalan)
2. Jalankan:
   ```bash
   cd frontend
   npm run dev
   ```

### Output yang Benar:
```
VITE v6.3.5  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### Jika Error:
- **Error: Cannot find module** → Jalankan `npm install` di folder `frontend/`
- **Error: Port 3000 already in use** → Vite akan otomatis menggunakan port lain (misal 5173)
- **Blank screen** → Buka browser console (F12) dan lihat error messages

---

## 🔗 Langkah 3: Verifikasi API Endpoints

Pastikan backend API merespon dengan benar.

### Test Manual:
1. Buka browser
2. Kunjungi: http://localhost:3001/api/tfidf?page=1&limit=1
3. Seharusnya muncul JSON response:
   ```json
   {
     "summary": {
       "fitur_tfidf": 2612,
       "fitur_selected": 1000,
       ...
     },
     "items": [...],
     "total": 2612,
     ...
   }
   ```

### Endpoint yang Harus Bekerja:
- ✅ `http://localhost:3001/api/tfidf` → Data TF-IDF terms
- ✅ `http://localhost:3001/api/evaluasi` → Hasil training model
- ✅ `http://localhost:3001/api/pengaduan` → Data pengaduan
- ✅ `http://localhost:3001/api/stats` → Statistik dashboard

**Jika endpoint tidak merespon:**
- Backend server belum jalan → kembali ke Langkah 1
- File data tidak ada → jalankan `python main.py --train` di folder `backend/`

---

## 🖥️ Langkah 4: Cek Browser Console

Buka Developer Tools di browser (tekan **F12**) dan lihat tab **Console**.

### Error yang Umum:

#### 1. **Network Error / Failed to fetch**
```
GET http://localhost:3000/api/tfidf net::ERR_CONNECTION_REFUSED
```
**Solusi:** Backend tidak berjalan → kembali ke Langkah 1

#### 2. **404 Not Found**
```
GET http://localhost:3000/api/tfidf 404 (Not Found)
```
**Solusi:** Proxy Vite tidak berfungsi → pastikan `vite.config.js` sudah benar:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

#### 3. **CORS Error**
```
Access to fetch at 'http://localhost:3001/api/tfidf' has been blocked by CORS policy
```
**Solusi:** Backend CORS tidak dikonfigurasi → pastikan `backend/server.js` punya:
```javascript
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
```

#### 4. **Module Not Found**
```
Failed to resolve import "./components/ekstraksi/EkstraksiStatistik"
```
**Solusi:** File komponen tidak ada atau import path salah → cek file ada di lokasi yang benar

---

## 📦 Langkah 5: Reinstall Dependencies

Jika masih bermasalah, coba install ulang dependencies:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🐍 Langkah 6: Re-generate Data (Jika Perlu)

Jika file data corrupt atau tidak lengkap:

```bash
cd backend
python main.py --train
```

Proses ini akan:
1. Membaca dataset dari `data/raw/dataset_berlabel.json`
2. Melakukan preprocessing lengkap
3. Training model Random Forest
4. Generate file:
   - `data/processed/final_processed.json`
   - `data/hasil_training.json`
   - `data/tfidf_terms.json`
   - `data/tfidf_sample_docs.json`

---

## ✅ Checklist Lengkap

Gunakan checklist ini untuk memastikan semuanya berfungsi:

- [ ] **Backend server berjalan** di port 3001
- [ ] **Frontend dev server berjalan** di port 3000 atau 5173
- [ ] **File data lengkap**:
  - [ ] `data/processed/final_processed.json`
  - [ ] `data/hasil_training.json`
  - [ ] `data/tfidf_terms.json`
  - [ ] `data/raw/dataset_berlabel.json`
- [ ] **API endpoints merespon**:
  - [ ] http://localhost:3001/api/tfidf
  - [ ] http://localhost:3001/api/evaluasi
  - [ ] http://localhost:3001/api/stats
- [ ] **Browser console tidak ada error**
- [ ] **Login berhasil** (username: admin, password: admin123)
- [ ] **Data muncul di halaman Dashboard**
- [ ] **Data muncul di halaman Ekstraksi Fitur**

---

## 🚀 Quick Start Script

Untuk memudahkan, gunakan script ini:

### Windows (PowerShell):
```powershell
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend (buka terminal baru)
cd frontend
npm run dev
```

### Linux/Mac:
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 📞 Masih Bermasalah?

Jika masih mengalami masalah setelah mengikuti semua langkah di atas:

1. **Screenshot error message** dari:
   - Terminal backend
   - Terminal frontend
   - Browser console (F12)

2. **Cek versi Node.js:**
   ```bash
   node --version
   ```
   Minimal: **Node.js v16** atau lebih baru

3. **Cek versi Python:**
   ```bash
   python --version
   ```
   Minimal: **Python 3.8** atau lebih baru

4. **Pastikan dependencies Python terinstall:**
   ```bash
   cd backend
   pip install -r requirement.txt
   ```

---

## 📝 Catatan Penting

### Port yang Digunakan:
- **Backend Express:** 3001
- **Frontend Vite:** 3000 (atau 5173 jika 3000 terpakai)
- **WhatsApp Bot (opsional):** 3002

### Proxy Configuration:
Frontend menggunakan Vite proxy untuk forward request `/api/*` ke backend:
```
http://localhost:3000/api/tfidf → http://localhost:3001/api/tfidf
```

Ini berarti di kode frontend, Anda bisa langsung `fetch("/api/tfidf")` tanpa perlu specify full URL.

### Data Flow:
```
Browser → Frontend (Vite:3000) → Proxy → Backend (Express:3001) → JSON Files
```

Jika salah satu bagian tidak jalan, data tidak akan muncul.
