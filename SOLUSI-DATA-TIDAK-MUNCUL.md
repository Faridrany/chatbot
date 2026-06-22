# Solusi: Data Tidak Muncul di Frontend

## 📋 Ringkasan Masalah

User melaporkan: **"data tidak memuat makanya tidak ada tampilan data yang terbaca"**

Masalah ini terjadi karena beberapa kemungkinan:
1. Backend server tidak berjalan
2. Frontend tidak terkoneksi ke backend
3. File data tidak ada atau corrupt
4. Error pada fetch API yang tidak tertangani

---

## ✅ Yang Sudah Diperbaiki

### 1. **Error Handling di RFFeatureImportance.jsx**

**Sebelumnya:**
```javascript
.catch(() => setLoading(false));  // Silent error, tidak ada feedback
```

**Sekarang:**
```javascript
.catch((err) => {
  console.error("Error fetching feature importance data:", err);
  setError(err.message || "Gagal memuat data. Pastikan backend server berjalan di port 3001.");
  setLoading(false);
});
```

**Perubahan:**
- ✅ Error ditampilkan ke user dengan pesan yang jelas
- ✅ Error di-log ke console untuk debugging
- ✅ Menampilkan troubleshooting steps langsung di UI
- ✅ Link ke API endpoint untuk test manual

### 2. **UI Error State yang Informatif**

Ditambahkan error state yang menampilkan:
- ❌ Pesan error yang user-friendly
- 🔧 Troubleshooting checklist:
  1. Cek backend server jalan
  2. Test API endpoint langsung
  3. Cek file data ada
  4. Buka browser console untuk detail

**Tampilan error:**
```jsx
{error ? (
  <div className="text-center py-10">
    <p className="text-red-500 font-semibold mb-2">❌ Gagal memuat data</p>
    <p className="text-sm text-gray-500 mb-4">{error}</p>
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="font-semibold text-red-800 mb-2">Troubleshooting:</p>
      <ol className="list-decimal list-inside space-y-1 text-red-700">
        <li>Pastikan backend server berjalan: <code>cd backend && node server.js</code></li>
        <li>Cek API endpoint: <a href="http://localhost:3001/api/tfidf?page=1&limit=1">http://localhost:3001/api/tfidf</a></li>
        <li>Pastikan file data ada: <code>data/tfidf_terms.json</code></li>
        <li>Buka browser console (F12) untuk detail error</li>
      </ol>
    </div>
  </div>
) : /* normal content */}
```

---

## 📚 Dokumentasi yang Dibuat

### 1. **TROUBLESHOOTING.md** (Panduan Lengkap)
Dokumentasi 400+ baris yang mencakup:
- ✅ 6 langkah troubleshooting sistematis
- ✅ Penjelasan setiap error yang mungkin terjadi
- ✅ Solusi untuk setiap masalah
- ✅ Checklist lengkap untuk verifikasi
- ✅ Command-command untuk debugging
- ✅ Penjelasan data flow dan arsitektur
- ✅ API endpoints reference

**Topik yang dicakup:**
1. Cek Backend Server
2. Cek Frontend Dev Server
3. Verifikasi API Endpoints
4. Cek Browser Console
5. Reinstall Dependencies
6. Re-generate Data

### 2. **README-STARTUP.md** (Panduan Startup)
Panduan step-by-step untuk menjalankan aplikasi:
- ✅ Cara menjalankan dengan 1 klik (start-all.bat)
- ✅ Cara menjalankan manual (Linux/Mac compatible)
- ✅ Verifikasi setiap komponen berfungsi
- ✅ Troubleshooting spesifik untuk setiap masalah
- ✅ Struktur aplikasi dan data flow
- ✅ Port yang digunakan
- ✅ Tips development

---

## 🚀 Script Otomatis yang Dibuat

### 1. **start-all.bat** (Recommended)
Menjalankan backend + frontend sekaligus:
```batch
start-all.bat
```

**Fitur:**
- ✅ Membuka 2 terminal window otomatis
- ✅ Backend di terminal 1 (port 3001)
- ✅ Frontend di terminal 2 (port 3000)
- ✅ Delay 3 detik untuk memastikan backend ready
- ✅ Menampilkan URL akses

### 2. **start-backend.bat**
Menjalankan backend saja:
```batch
start-backend.bat
```

**Fitur:**
- ✅ Auto-install dependencies jika belum ada
- ✅ Menjalankan `node server.js`
- ✅ Menampilkan log langsung

### 3. **start-frontend.bat**
Menjalankan frontend saja:
```batch
start-frontend.bat
```

**Fitur:**
- ✅ Auto-install dependencies jika belum ada
- ✅ Menjalankan `npm run dev`
- ✅ Auto-open browser

### 4. **check-setup.bat** (Diagnostic Tool)
Script untuk cek apakah semua setup sudah benar:
```batch
check-setup.bat
```

**Yang dicek:**
- ✅ Node.js terinstall?
- ✅ Python terinstall?
- ✅ Backend node_modules ada?
- ✅ Frontend node_modules ada?
- ✅ File data lengkap?
  - `hasil_training.json`
  - `tfidf_terms.json`
  - `final_processed.json`
  - `dataset_berlabel.json`
- ✅ Port 3000 dan 3001 available?

**Output contoh:**
```
[1/6] Checking Node.js installation...
v18.17.0
✓ Node.js is installed

[2/6] Checking Python installation...
Python 3.11.5
✓ Python is installed

[3/6] Checking backend dependencies...
✓ Backend node_modules exists

[4/6] Checking frontend dependencies...
✓ Frontend node_modules exists

[5/6] Checking data files...
✓ hasil_training.json exists
✓ tfidf_terms.json exists
✓ final_processed.json exists
✓ dataset_berlabel.json exists

[6/6] Checking if ports are available...
✓ Port 3001 is available
✓ Port 3000 is available
```

---

## 🔍 Langkah-langkah Diagnosis

### Jika User Bilang "Data Tidak Muncul":

**1. Jalankan diagnostic:**
```bash
check-setup.bat
```

**2. Jika semua ✓ (hijau), test API manual:**
Buka browser: http://localhost:3001/api/tfidf?page=1&limit=1

**Seharusnya muncul JSON:**
```json
{
  "summary": {
    "fitur_tfidf": 2612,
    "fitur_selected": 1000,
    ...
  },
  "items": [...]
}
```

**3. Jika API tidak merespon:**
Backend tidak jalan → Jalankan:
```bash
cd backend
node server.js
```

**4. Jika API merespon tapi frontend tetap kosong:**
Buka browser console (F12) → Lihat error di tab Console

**5. Common errors & solusi:**

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `ERR_CONNECTION_REFUSED` | Backend tidak jalan | `cd backend && node server.js` |
| `404 Not Found` | Proxy tidak berfungsi | Restart frontend: `npm run dev` |
| `CORS Policy` | CORS tidak dikonfigurasi | Cek `server.js` ada `cors()` |
| `Module Not Found` | Dependencies tidak lengkap | `npm install` di backend & frontend |
| `EADDRINUSE` | Port sudah dipakai | Kill process: `taskkill /PID <PID> /F` |

---

## 📊 Verifikasi Data Loading per Halaman

Setelah login (admin/admin123), cek setiap halaman:

### ✅ Dashboard
- **Endpoint:** `/api/stats`
- **Data yang muncul:** Total pengaduan, kategori terbanyak, chart
- **Jika kosong:** File `final_processed.json` tidak ada

### ✅ Ekstraksi Fitur → Statistik Keseluruhan TF-IDF
- **Endpoint:** `/api/tfidf?page=1&limit=1`
- **Data yang muncul:** Total fitur (2612), fitur terpilih (1000), unigram/bigram
- **Jika kosong:** File `tfidf_terms.json` tidak ada

### ✅ Ekstraksi Fitur → Term & Tokenisasi
- **Endpoint:** `/api/tfidf?page=1&limit=50`
- **Data yang muncul:** Tabel 50 term dengan TF-IDF score
- **Jika kosong:** Backend tidak merespon atau file tidak ada

### ✅ Random Forest → Bootstrap Sampling
- **Endpoint:** `/api/evaluasi`
- **Data yang muncul:** Jumlah pohon (500), parameter bootstrap
- **Jika kosong:** File `hasil_training.json` tidak ada (jalankan `python main.py --train`)

### ✅ Random Forest → Feature Importance
- **Endpoint:** `/api/tfidf?status=terpilih`
- **Data yang muncul:** 1000 fitur terpilih dengan importance score
- **Jika kosong:** Backend tidak jalan atau data tidak ada

### ✅ Evaluasi Model → Metrik Evaluasi
- **Endpoint:** `/api/evaluasi`
- **Data yang muncul:** Akurasi (%), Precision, Recall, F1-Score
- **Jika kosong:** Model belum di-train (`python main.py --train`)

---

## 🛠️ Cara Regenerate Data (Jika File Hilang/Corrupt)

```bash
cd backend
python main.py --train
```

**Proses ini akan:**
1. Membaca `data/raw/dataset_berlabel.json` (1200 data)
2. Preprocessing 6 tahap:
   - Cleaning
   - Casefolding
   - Tokenization
   - Normalization
   - Stopword Removal
   - Stemming
3. TF-IDF Vectorization (2612 fitur → 1000 fitur terpilih)
4. Training Random Forest (500 pohon, 80/20 split)
5. Evaluasi (confusion matrix, metrics)
6. Generate files:
   - `data/processed/final_processed.json`
   - `data/hasil_training.json`
   - `data/tfidf_terms.json`
   - `data/tfidf_sample_docs.json`

**Waktu proses:** ~30-60 detik

---

## 🎯 Checklist untuk User

Sebelum melaporkan "data tidak muncul", pastikan:

- [ ] Sudah jalankan `check-setup.bat` dan semua ✓
- [ ] Backend server jalan di port 3001
- [ ] Frontend dev server jalan di port 3000/5173
- [ ] API endpoint merespon (test di browser)
- [ ] Sudah login dengan benar (admin/admin123)
- [ ] Browser console (F12) tidak ada error merah
- [ ] Sudah coba refresh browser (Ctrl+F5)
- [ ] Sudah coba restart kedua server

**Jika semua sudah ✓ tapi masih bermasalah:**
- Screenshot error dari console
- Screenshot halaman yang bermasalah
- Copy-paste log dari terminal backend
- Copy-paste log dari terminal frontend

---

## 📁 File-file yang Dibuat/Diubah

### Dibuat Baru:
1. `TROUBLESHOOTING.md` - Panduan troubleshooting lengkap (400+ baris)
2. `README-STARTUP.md` - Panduan startup aplikasi (300+ baris)
3. `start-all.bat` - Script untuk start backend + frontend sekaligus
4. `start-backend.bat` - Script untuk start backend saja
5. `start-frontend.bat` - Script untuk start frontend saja
6. `check-setup.bat` - Diagnostic tool untuk cek setup
7. `SOLUSI-DATA-TIDAK-MUNCUL.md` - Dokumen ini

### Diubah:
1. `frontend/src/components/rf/RFFeatureImportance.jsx`
   - ✅ Tambah error state
   - ✅ Tambah error handling di fetch
   - ✅ Tambah UI error message dengan troubleshooting
   - ✅ Tambah link ke API endpoint untuk test

---

## 🚀 Quick Start (Untuk User)

**Cara paling mudah:**

1. **Klik 2x:** `check-setup.bat` → Pastikan semua ✓
2. **Klik 2x:** `start-all.bat` → Tunggu 2 terminal terbuka
3. **Tunggu ~5 detik** sampai backend loading selesai
4. **Buka browser:** http://localhost:3000
5. **Login:** admin / admin123
6. **Cek data muncul** di setiap halaman

**Jika ada masalah:**
- Baca `README-STARTUP.md` untuk panduan step-by-step
- Baca `TROUBLESHOOTING.md` untuk solusi detail
- Atau gunakan checklist di atas

---

## 💡 Tips untuk Developer

### Development Workflow:
1. Selalu start backend dulu, tunggu "Cache loaded"
2. Baru start frontend
3. Gunakan browser DevTools (F12) untuk debug
4. Gunakan `check-setup.bat` sebelum mulai coding
5. Jika ubah backend code, restart `node server.js`
6. Jika ubah frontend code, Vite auto-reload (no restart needed)

### Debugging API:
```bash
# Test endpoint langsung dengan curl atau browser
curl http://localhost:3001/api/tfidf?page=1&limit=1

# Atau buka di browser:
http://localhost:3001/api/tfidf?page=1&limit=1
http://localhost:3001/api/evaluasi
http://localhost:3001/api/stats
```

### Port Troubleshooting:
```bash
# Windows - Cek port
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Windows - Kill process
taskkill /PID <PID> /F

# Linux/Mac - Kill port
kill -9 $(lsof -t -i:3001)
```

---

## 📞 Support

Jika masih ada masalah setelah mengikuti semua panduan:

1. Jalankan `check-setup.bat` dan screenshot hasilnya
2. Screenshot error dari browser console (F12)
3. Copy log dari terminal backend
4. Copy log dari terminal frontend
5. Sebutkan langkah apa yang sudah dicoba

---

**Semua sudah siap! User tinggal:**
1. Klik `check-setup.bat` untuk diagnostic
2. Klik `start-all.bat` untuk start aplikasi
3. Buka http://localhost:3000 dan login

Jika ada error, sekarang akan ditampilkan dengan jelas beserta solusinya. 🎉
