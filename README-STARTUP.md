# Panduan Startup Aplikasi

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Automatic (Recommended) - Windows
Jalankan file batch yang sudah disediakan:

```bash
# Klik 2x atau jalankan dari command prompt
start-all.bat
```

Script ini akan:
1. Membuka 2 terminal window
2. Menjalankan backend di port 3001
3. Menjalankan frontend di port 3000
4. Membuka browser otomatis

### Opsi 2: Manual (untuk Linux/Mac atau troubleshooting)

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # hanya pertama kali
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # hanya pertama kali
npm run dev
```

---

## ✅ Verifikasi Aplikasi Berjalan

### 1. Backend (Port 3001)
Buka: http://localhost:3001/api/tfidf?page=1&limit=1

**Output yang benar:**
```json
{
  "summary": {
    "fitur_tfidf": 2612,
    "fitur_selected": 1000,
    "ngram_range": [1, 2],
    ...
  },
  "items": [...],
  "total": 2612
}
```

### 2. Frontend (Port 3000)
Buka: http://localhost:3000

**Seharusnya muncul:**
- Halaman login
- Username: `admin`
- Password: `admin123`

### 3. Test Data Loading
Setelah login:
1. Klik menu **Dashboard** → Seharusnya ada statistik pengaduan
2. Klik menu **Ekstraksi Fitur** → **Statistik Keseluruhan TF-IDF** → Seharusnya ada angka fitur
3. Klik menu **Random Forest** → **Bootstrap Sampling** → Seharusnya ada data pohon
4. Klik menu **Evaluasi Model** → **Metrik Evaluasi** → Seharusnya ada akurasi, precision, dll

---

## ❌ Troubleshooting: Data Tidak Muncul

### Gejala:
- Halaman muncul tapi data kosong
- Loading terus menerus
- "Memuat data..." tidak hilang

### Penyebab & Solusi:

#### 1. Backend tidak jalan
**Cek:**
```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001
```

**Solusi:** Jalankan `cd backend && node server.js`

#### 2. File data tidak ada
**Cek:**
```bash
dir data\hasil_training.json
dir data\tfidf_terms.json
dir data\processed\final_processed.json
```

**Solusi:** Generate data dengan training model:
```bash
cd backend
python main.py --train
```

#### 3. CORS atau Proxy error
**Gejala di browser console (F12):**
```
Access to fetch has been blocked by CORS policy
```

**Solusi:** 
- Pastikan backend `server.js` punya konfigurasi CORS:
```javascript
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
```

- Pastikan `frontend/vite.config.js` punya proxy:
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

#### 4. Dependencies tidak lengkap
**Solusi:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 5. Port konflik
**Gejala:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solusi Windows:**
```bash
# Cari process yang pakai port 3001
netstat -ano | findstr :3001

# Kill process (ganti PID dengan hasil netstat)
taskkill /PID <PID> /F
```

**Solusi Linux/Mac:**
```bash
# Kill process di port 3001
kill -9 $(lsof -t -i:3001)
```

---

## 🔍 Cek Browser Console untuk Error

Buka Developer Tools (F12) → Tab **Console**

### Error Umum:

**1. Failed to fetch**
```
GET http://localhost:3000/api/tfidf net::ERR_CONNECTION_REFUSED
```
→ Backend tidak jalan → Jalankan `node server.js` di folder backend

**2. 404 Not Found**
```
GET http://localhost:3000/api/tfidf 404
```
→ Endpoint tidak ada atau proxy tidak berfungsi → Restart frontend dev server

**3. JSON Parse Error**
```
SyntaxError: Unexpected token < in JSON at position 0
```
→ Backend mengembalikan HTML bukan JSON → Cek backend log untuk error

**4. Module Not Found**
```
Failed to resolve import "./components/rf/RFFeatureImportance"
```
→ File komponen hilang → Cek file ada di: `frontend/src/components/rf/RFFeatureImportance.jsx`

---

## 📋 Checklist Sebelum Melaporkan Masalah

Sebelum menyatakan "data tidak muncul", pastikan sudah cek:

- [ ] Backend server jalan di port 3001
- [ ] Frontend dev server jalan di port 3000/5173
- [ ] File data lengkap (hasil_training.json, tfidf_terms.json, dll)
- [ ] API endpoint merespon (test di browser: http://localhost:3001/api/tfidf)
- [ ] Browser console (F12) tidak ada error merah
- [ ] Sudah login dengan benar (admin / admin123)
- [ ] Sudah coba refresh browser (Ctrl+F5)
- [ ] Sudah coba restart kedua server

---

## 🏗️ Struktur Aplikasi

```
chatbot/
├── backend/                 # Express.js server (Port 3001)
│   ├── server.js           # Main API server
│   ├── main.py             # Python ML training
│   └── package.json        # Node dependencies
│
├── frontend/                # React + Vite (Port 3000)
│   ├── src/
│   │   ├── App.jsx         # Main routing
│   │   ├── components/     # React components
│   │   │   ├── ekstraksi/  # TF-IDF pages
│   │   │   ├── rf/         # Random Forest pages
│   │   │   └── evaluasi/   # Evaluation pages
│   │   └── main.jsx
│   ├── vite.config.js      # Vite config + proxy
│   └── package.json        # React dependencies
│
├── data/                    # JSON data files
│   ├── hasil_training.json          # Model evaluation results
│   ├── tfidf_terms.json             # All TF-IDF terms with scores
│   ├── tfidf_sample_docs.json       # Sample vectorized documents
│   ├── processed/
│   │   └── final_processed.json     # All pengaduan data
│   └── raw/
│       └── dataset_berlabel.json    # Training dataset
│
├── start-all.bat           # Windows: Start both servers
├── start-backend.bat       # Windows: Start backend only
├── start-frontend.bat      # Windows: Start frontend only
└── TROUBLESHOOTING.md      # Detailed troubleshooting guide
```

---

## 🔄 Data Flow

```
User Browser
    ↓
Frontend (React + Vite) :3000
    ↓ fetch("/api/tfidf")
Vite Proxy
    ↓ forward to http://localhost:3001/api/tfidf
Backend (Express) :3001
    ↓ read from files
JSON Data Files (data/*.json)
```

**Jika salah satu bagian tidak jalan → Data tidak muncul**

---

## 📚 API Endpoints Reference

### TF-IDF & Feature Extraction
- `GET /api/tfidf?page=1&limit=50` → List of terms with TF-IDF scores
- `GET /api/tfidf?status=terpilih` → Only selected features (k=1000)
- `GET /api/tfidf?ngram=unigram` → Only unigrams
- `GET /api/tfidf/samples` → Sample vectorized documents

### Model Evaluation
- `GET /api/evaluasi` → Full model evaluation (confusion matrix, metrics, etc)
- `GET /api/stats` → Dashboard statistics
- `GET /api/stats/training` → Training dataset distribution

### Data Pengaduan
- `GET /api/pengaduan?page=1&limit=10` → Paginated pengaduan list
- `GET /api/pengaduan/:id` → Single pengaduan detail
- `GET /api/pengaduan/:id/processed` → With preprocessing pipeline

---

## 🛠️ Development Tools

### Restart Servers
```bash
# Kill all Node processes (Windows)
taskkill /F /IM node.exe

# Kill all Node processes (Linux/Mac)
killall node
```

### Clear Cache & Reinstall
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Re-generate Training Data
```bash
cd backend
python main.py --train
```

---

## 💡 Tips

1. **Selalu jalankan backend dulu**, baru frontend
2. **Tunggu backend selesai loading** (sampai muncul "Cache loaded") sebelum buka frontend
3. **Gunakan browser mode incognito** jika ada masalah cache
4. **Cek terminal logs** untuk error messages
5. **Gunakan `start-all.bat`** untuk kemudahan (Windows)

---

## ⚡ Quick Commands

```bash
# Start everything (Windows)
start-all.bat

# Start backend only
cd backend && node server.js

# Start frontend only
cd frontend && npm run dev

# Retrain model & regenerate data
cd backend && python main.py --train

# Check if ports are available
netstat -ano | findstr :3001
netstat -ano | findstr :3000
```

---

Jika masih ada masalah, baca **TROUBLESHOOTING.md** untuk panduan lengkap.
