# 📚 Index Dokumentasi

Panduan lengkap untuk menjalankan dan troubleshoot aplikasi Klasifikasi Pengaduan Warga.

---

## 🚀 Untuk Memulai

### Saya baru pertama kali → Mulai dari sini:
1. **[CARA-MENJALANKAN.md](CARA-MENJALANKAN.md)** ⭐⭐⭐ **(NEW - PALING MUDAH)**
   - Solusi cepat untuk "npm run dev tidak jalan"
   - 3 langkah: Free port → Start → Login
   - Troubleshooting port conflict
   - **Waktu baca: 3 menit**

2. **[QUICK-START.md](QUICK-START.md)** ⭐ **(RECOMMENDED)**
   - Panduan 3 langkah untuk start aplikasi
   - Checklist verifikasi
   - Troubleshooting cepat
   - **Waktu baca: 5 menit**

3. **Jalankan Tools:**
   - **Klik 2x:** `kill-ports.bat` (free port 3000, 3001, 3002)
   - **Klik 2x:** `check-setup.bat` (cek setup)
   - **Klik 2x:** `start-all.bat` (start aplikasi)

4. **Login:**
   - http://localhost:3000 (atau 3003 jika port conflict)
   - Username: admin
   - Password: admin123

---

## 📖 Dokumentasi Lengkap

### 1. [README-STARTUP.md](README-STARTUP.md)
**Untuk:** User yang ingin memahami cara kerja aplikasi secara menyeluruh

**Isi:**
- ✅ Cara menjalankan aplikasi (otomatis & manual)
- ✅ Verifikasi setiap komponen berfungsi
- ✅ Struktur aplikasi dan data flow
- ✅ Port configuration dan proxy
- ✅ API endpoints reference
- ✅ Tips development

**Baca jika:**
- Ingin tahu cara kerja backend & frontend
- Ingin setup di Linux/Mac
- Ingin memahami arsitektur aplikasi

**Waktu baca: 15 menit**

---

### 2. [SOLUSI-PORT-CONFLICT.md](SOLUSI-PORT-CONFLICT.md) ⭐ **(NEW)**
**Untuk:** User yang mengalami masalah "npm run dev tidak jalan" atau port conflict

**Isi:**
- ✅ Penjelasan port conflict
- ✅ Cara kill process yang pakai port
- ✅ Script otomatis (kill-ports.bat)
- ✅ Cara ganti port manual
- ✅ Warning Vite yang sudah diperbaiki

**Baca jika:**
- Frontend jalan di port 3003 (bukan 3000)
- Error "Port 3000 is in use"
- Error "EADDRINUSE"
- npm run dev tidak bisa start

**Waktu baca: 10 menit**

---

### 3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
**Untuk:** User yang mengalami masalah "data tidak muncul" atau error lainnya

**Isi:**
- ✅ 6 langkah diagnosis sistematis
- ✅ Penjelasan setiap jenis error
- ✅ Solusi spesifik untuk setiap masalah
- ✅ Checklist verifikasi lengkap
- ✅ Command debugging
- ✅ Penjelasan data flow

**Baca jika:**
- Data tidak muncul di halaman
- Ada error di terminal atau browser console
- Aplikasi tidak bisa start
- Port conflict
- File data hilang

**Waktu baca: 20 menit (atau langsung loncat ke section yang relevan)**

---

### 3. [SOLUSI-DATA-TIDAK-MUNCUL.md](SOLUSI-DATA-TIDAK-MUNCUL.md)
**Untuk:** Developer yang ingin tahu perubahan kode dan solusi teknis

**Isi:**
- ✅ Penjelasan masalah yang dilaporkan
- ✅ Detail perubahan kode (frontend)
- ✅ Error handling yang ditambahkan
- ✅ UI improvements
- ✅ Dokumentasi yang dibuat
- ✅ Script yang dibuat

**Baca jika:**
- Ingin tahu perubahan apa yang dibuat
- Ingin review kode perubahan
- Ingin implementasi error handling serupa di component lain
- Ingin memahami flow troubleshooting

**Waktu baca: 10 menit**

---

### 4. [SUMMARY.md](SUMMARY.md)
**Untuk:** Project manager atau developer yang ingin ringkasan cepat

**Isi:**
- ✅ Summary of changes (what, why, how)
- ✅ File-file yang dibuat/diubah
- ✅ Before & after comparison
- ✅ Next steps (optional improvements)
- ✅ Reference ke dokumentasi lain

**Baca jika:**
- Ingin overview cepat semua perubahan
- Ingin tahu file apa saja yang terpengaruh
- Ingin roadmap untuk improvement selanjutnya

**Waktu baca: 5 menit**

---

### 5. [DOKUMENTASI-INDEX.md](DOKUMENTASI-INDEX.md) (Dokumen ini)
**Untuk:** Navigasi semua dokumentasi

**Isi:**
- Index semua dokumentasi
- Petunjuk dokumentasi mana yang harus dibaca
- Flow diagram troubleshooting

---

## 🛠️ Script & Tools

### 1. `kill-ports.bat` ⭐ **(NEW - WAJIB JALANKAN DULU)**
**Fungsi:** Free port 3000, 3001, 3002 yang sedang dipakai

**Usage:**
```batch
# Klik 2x atau jalankan di command prompt:
kill-ports.bat
```

**Output:**
```
✓ Port 3000 is free
✓ Port 3001 is free
✓ Port 3002 is free
```

**Kapan pakai:**
- **SEBELUM menjalankan start-all.bat**
- Jika frontend jalan di port 3003 (bukan 3000)
- Jika backend error "EADDRINUSE"
- Jika "npm run dev" tidak jalan

---

### 2. `start-all.bat` ⭐ **(RECOMMENDED)**
**Fungsi:** Start backend + frontend sekaligus dalam 1 klik

**Usage:**
```batch
# Klik 2x atau jalankan di command prompt:
start-all.bat
```

**Kapan pakai:**
- Setiap kali ingin menjalankan aplikasi
- Default choice untuk development

---

### 3. `check-setup.bat` ⭐ **(DIAGNOSTIC TOOL)**
**Fungsi:** Cek apakah setup sudah benar

**Usage:**
```batch
# Klik 2x atau jalankan di command prompt:
check-setup.bat
```

**Output:**
```
[1/6] Checking Node.js installation... ✓
[2/6] Checking Python installation... ✓
[3/6] Checking backend dependencies... ✓
[4/6] Checking frontend dependencies... ✓
[5/6] Checking data files... ✓
[6/6] Checking if ports are available... ✓
```

**Kapan pakai:**
- Sebelum start aplikasi pertama kali
- Setelah clone repo baru
- Jika aplikasi tidak bisa start
- Jika data tidak muncul

---

### 3. `start-backend.bat`
**Fungsi:** Start backend server saja

**Usage:**
```batch
start-backend.bat
```

**Kapan pakai:**
- Ingin start backend dulu sebelum frontend
- Troubleshooting masalah backend
- Development khusus backend

---

### 4. `start-frontend.bat`
**Fungsi:** Start frontend dev server saja

**Usage:**
```batch
start-frontend.bat
```

**Kapan pakai:**
- Backend sudah jalan, tinggal start frontend
- Troubleshooting masalah frontend
- Development khusus frontend

---

## 🔍 Decision Tree: Dokumentasi Mana yang Harus Dibaca?

```
Mulai
  │
  ├─ Baru pertama kali? ────────────────► QUICK-START.md
  │
  ├─ Ada error atau data tidak muncul? ─► TROUBLESHOOTING.md
  │    │
  │    ├─ Masih bingung? ──────────────► README-STARTUP.md
  │    │
  │    └─ Sudah solved, tapi ingin tahu apa yang diperbaiki? ─► SOLUSI-DATA-TIDAK-MUNCUL.md
  │
  ├─ Developer yang ingin review changes? ─► SUMMARY.md
  │
  └─ Ingin navigasi dokumentasi? ─────────► DOKUMENTASI-INDEX.md (ini)
```

---

## 📊 Flow: Dari Zero ke Running Application

```
1. Clone Repository
   │
   ├─ Baca: QUICK-START.md (5 min)
   │
2. Check Setup
   │
   ├─ Jalankan: check-setup.bat
   │
   ├─ Semua ✓? ──► Lanjut ke step 3
   │
   └─ Ada ✗? ──► Baca: README-STARTUP.md → Install dependencies → Ulang check-setup
   │
3. Start Application
   │
   ├─ Jalankan: start-all.bat
   │
   ├─ Tunggu 10 detik (backend loading)
   │
4. Open Browser
   │
   ├─ http://localhost:3000
   │
   ├─ Login: admin / admin123
   │
5. Verifikasi Data Muncul
   │
   ├─ Dashboard → Ada angka? ──► ✅ SUCCESS!
   │
   └─ Data tidak muncul? ──► Baca: TROUBLESHOOTING.md
       │
       ├─ Test API: http://localhost:3001/api/tfidf
       │
       ├─ Cek browser console (F12)
       │
       └─ Follow troubleshooting steps
```

---

## 🎯 Use Case Specific Guide

### Use Case 1: "Saya ingin jalankan aplikasi"
1. Baca: **QUICK-START.md** (5 min)
2. Jalankan: `check-setup.bat`
3. Jalankan: `start-all.bat`
4. Buka: http://localhost:3000
5. Login: admin/admin123

---

### Use Case 2: "Data tidak muncul di halaman"
1. Baca: **TROUBLESHOOTING.md** → Section 4 (Browser Console)
2. Tekan F12 → Tab Console → Screenshot error
3. Test API: http://localhost:3001/api/tfidf?page=1&limit=1
4. Follow troubleshooting steps di TROUBLESHOOTING.md
5. Jika masih bingung → Baca README-STARTUP.md

---

### Use Case 3: "Backend tidak bisa start"
1. Baca: **TROUBLESHOOTING.md** → Section 1 (Backend Server)
2. Cek error message di terminal
3. Common fixes:
   - `npm install` di folder backend
   - Cek port 3001 tidak dipakai process lain
   - Cek file data ada (jalankan `python main.py --train`)

---

### Use Case 4: "Setup di Linux/Mac"
1. Baca: **README-STARTUP.md** → Section "Opsi 2: Manual"
2. Terminal 1: `cd backend && node server.js`
3. Terminal 2: `cd frontend && npm run dev`
4. Buka: http://localhost:3000

---

### Use Case 5: "Saya developer, ingin review changes"
1. Baca: **SUMMARY.md** (overview cepat)
2. Baca: **SOLUSI-DATA-TIDAK-MUNCUL.md** (detail teknis)
3. Review file: `frontend/src/components/rf/RFFeatureImportance.jsx`
4. Test dengan jalankan aplikasi

---

## 📁 Struktur File Dokumentasi

```
chatbot/
├── DOKUMENTASI-INDEX.md        ← You are here (navigasi)
├── QUICK-START.md              ← Start here (3 langkah)
├── README-STARTUP.md           ← Detail lengkap startup
├── TROUBLESHOOTING.md          ← Solusi untuk masalah
├── SOLUSI-DATA-TIDAK-MUNCUL.md ← Penjelasan teknis perubahan
├── SUMMARY.md                  ← Ringkasan changes
│
├── start-all.bat               ← Script: Start backend + frontend
├── start-backend.bat           ← Script: Start backend saja
├── start-frontend.bat          ← Script: Start frontend saja
├── check-setup.bat             ← Script: Diagnostic tool
│
├── backend/
│   ├── server.js               ← Modified: Better error logs
│   └── ...
│
└── frontend/
    ├── src/
    │   └── components/
    │       └── rf/
    │           └── RFFeatureImportance.jsx  ← Modified: Error handling
    └── ...
```

---

## 🆘 Masih Bermasalah?

Jika sudah membaca dokumentasi dan masih ada masalah:

### Langkah 1: Kumpulkan Informasi
1. Jalankan `check-setup.bat` → Screenshot hasil
2. Screenshot browser console (F12 → tab Console)
3. Screenshot terminal backend (log error)
4. Screenshot terminal frontend (log error)
5. Sebutkan langkah yang sudah dicoba

### Langkah 2: Verifikasi Checklist
- [ ] Sudah baca QUICK-START.md?
- [ ] Sudah jalankan check-setup.bat?
- [ ] Sudah baca TROUBLESHOOTING.md?
- [ ] Sudah coba restart kedua server?
- [ ] Sudah test API manual?
- [ ] Sudah cek browser console?

### Langkah 3: Dokumentasi Tambahan
- Backend tidak jalan → TROUBLESHOOTING.md → Section 1
- Frontend tidak jalan → TROUBLESHOOTING.md → Section 2
- API error → TROUBLESHOOTING.md → Section 3
- Data tidak muncul → TROUBLESHOOTING.md → Section 4

---

## 💡 Tips Membaca Dokumentasi

### Jika punya waktu terbatas:
1. **5 menit:** Baca QUICK-START.md → Jalankan aplikasi
2. **+5 menit:** Baca SUMMARY.md → Pahami perubahan
3. **+10 menit:** Skim TROUBLESHOOTING.md → Save untuk referensi

### Jika ingin detail lengkap:
1. **QUICK-START.md** (5 min) → Overview
2. **README-STARTUP.md** (15 min) → Deep dive startup
3. **TROUBLESHOOTING.md** (20 min) → Master troubleshooting
4. **SOLUSI-DATA-TIDAK-MUNCUL.md** (10 min) → Technical details
5. **SUMMARY.md** (5 min) → Recap & next steps

**Total: ~1 jam untuk master semua aspek aplikasi**

---

## ✅ Checklist: Sudah Siap?

- [ ] Sudah baca QUICK-START.md
- [ ] Sudah jalankan check-setup.bat → semua ✓
- [ ] Sudah jalankan start-all.bat → backend & frontend jalan
- [ ] Sudah buka http://localhost:3000 → halaman muncul
- [ ] Sudah login (admin/admin123) → berhasil masuk
- [ ] Dashboard menampilkan data → angka muncul
- [ ] Ekstraksi Fitur menampilkan data → tabel muncul
- [ ] Random Forest menampilkan data → statistik muncul
- [ ] Evaluasi Model menampilkan data → metrik muncul

**Jika semua ✅ → Aplikasi siap digunakan! 🎉**

---

## 📚 Reference Cepat

| Dokumentasi | Waktu Baca | Prioritas | Untuk |
|-------------|------------|-----------|-------|
| QUICK-START.md | 5 min | ⭐⭐⭐ | Semua user |
| README-STARTUP.md | 15 min | ⭐⭐ | User yang ingin detail |
| TROUBLESHOOTING.md | 20 min | ⭐⭐⭐ | User dengan masalah |
| SOLUSI-DATA-TIDAK-MUNCUL.md | 10 min | ⭐ | Developer |
| SUMMARY.md | 5 min | ⭐ | Project manager |
| DOKUMENTASI-INDEX.md | 3 min | ⭐⭐ | Navigasi |

**Minimum reading:** QUICK-START.md (5 min) + check-setup.bat

---

## 🔗 Link Berguna

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/*
- Test API: http://localhost:3001/api/tfidf?page=1&limit=1
- Login: admin / admin123

---

**Happy coding! 🚀**

Jika ada pertanyaan, cek dokumentasi atau jalankan `check-setup.bat` untuk diagnosis.


---

## 🔧 Refactoring & New Structure (v2.0)

### [QUICK-START-KODE-PENGADUAN.md](QUICK-START-KODE-PENGADUAN.md) ⭐⭐⭐ **(NEW - JUNE 2026)**
**Untuk:** Developer yang ingin menggunakan struktur baru dengan `kode_pengaduan`

**Isi:**
- ✅ Penjelasan refactoring struktur data (before & after)
- ✅ Kode pengaduan sebagai primary key (`PGD-0001`, `PGD-0002`, ...)
- ✅ Stage-specific files (tokenisasi, tfidf, filtering, seleksi fitur, random forest)
- ✅ Step-by-step training dengan struktur baru
- ✅ Code examples (Python & JavaScript)
- ✅ Frontend integration patterns

**Baca jika:**
- Ingin training ulang dengan struktur baru
- Butuh lookup data lebih cepat (70% faster)
- Ingin file size lebih kecil (15% reduction)
- Perlu normalized database structure

### [REFAKTOR-STRUKTUR-KODE-PENGADUAN.md](REFAKTOR-STRUKTUR-KODE-PENGADUAN.md)
**Untuk:** Technical deep-dive refactoring

**Isi:**
- ✅ Detailed file structure (before vs after)
- ✅ Performance benchmarks
- ✅ Helper function `get_pengaduan_detail()`
- ✅ API endpoint recommendations
- ✅ Frontend integration examples
- ✅ Migration path (Phase 1-4)

**Baca jika:**
- Ingin memahami architecture decisions
- Perlu implement custom API endpoints
- Ingin optimize performance
- Butuh technical reference lengkap

### Scripts Baru:
- **`hapus-hasil-klasifikasi.bat`** - Clean old classification results + stage files
- **`backend/test_kode_pengaduan.py`** - Validate new structure (6 tests)

---

## 📊 Data & Training

### [PANDUAN-ULANG-KLASIFIKASI.md](PANDUAN-ULANG-KLASIFIKASI.md)
**Untuk:** User yang ingin hapus hasil klasifikasi lama dan training ulang

**Isi:**
- ✅ Step-by-step delete old results
- ✅ Run training from scratch
- ✅ Expected output dan timing
- ✅ Troubleshooting training issues
- ✅ File size reference

**Baca jika:**
- Data training berubah
- Model tidak akurat
- Ingin fresh start

### [TRANSPARANSI-DATA-UPDATE.md](docs/TRANSPARANSI-DATA-UPDATE.md)
**Untuk:** Developer yang ingin memahami data transparency requirements

**Isi:**
- ✅ Status transparansi 10 halaman (Ekstraksi Fitur + Random Forest)
- ✅ Separation of concerns (statistical methods vs model-based)
- ✅ Implementation status (completed vs need backend support)
- ✅ Next steps dan recommendations

**Baca jika:**
- Ingin tambah halaman transparan baru
- Perlu memahami data flow antar tahap
- Butuh backend endpoint requirements

---

## 🐛 Troubleshooting

### [SOLUSI-PORT-CONFLICT.md](SOLUSI-PORT-CONFLICT.md)
**Untuk:** User yang mengalami "npm run dev tidak jalan" karena port conflict

**Isi:**
- ✅ Analisis masalah port 3000, 3001, 3002 sudah digunakan
- ✅ Script `kill-ports.bat` otomatis
- ✅ Auto port selection di frontend
- ✅ Verifikasi port tersedia

**Baca jika:**
- Frontend tidak bisa start
- Error "EADDRINUSE" atau "port already in use"

### [RINGKASAN-SOLUSI.md](RINGKASAN-SOLUSI.md)
**Untuk:** Quick reference solusi masalah yang sudah ditangani

**Isi:**
- ✅ Port conflict resolution
- ✅ Data transparency updates
- ✅ Feature additions (Final Processed page)

---

## 📚 Frontend Documentation

### [docs/README.md](docs/README.md)
**Untuk:** Frontend developer

**Isi:**
- ✅ Component structure
- ✅ Routing dan navigation
- ✅ State management patterns

### [docs/Evaluasi_Model_Page.md](docs/Evaluasi_Model_Page.md)
**Untuk:** Memahami halaman Evaluasi Model

**Isi:**
- ✅ Metrik evaluasi (Accuracy, Precision, Recall, F1)
- ✅ Confusion Matrix visualization
- ✅ Cross Validation results
- ✅ Per-class performance

### [docs/RandomForest_Detail_Page.md](docs/RandomForest_Detail_Page.md)
**Untuk:** Memahami halaman Random Forest Detail

**Isi:**
- ✅ Bootstrap Sampling
- ✅ Gini Impurity calculation
- ✅ OOB Score validation
- ✅ Majority Voting mechanism
- ✅ Feature Importance ranking

### [docs/Guidelines.md](docs/Guidelines.md)
**Untuk:** Coding standards dan best practices

### [docs/Attributions.md](docs/Attributions.md)
**Untuk:** Libraries, credits, dan licenses

---

## 🔑 Key Concepts (v2.0 Structure)

### Kode Pengaduan
- **Format:** `PGD-XXXX` (e.g., `PGD-0001`, `PGD-0002`, ...)
- **Purpose:** Primary key untuk semua pengaduan
- **Usage:** Foreign key di semua stage files

### Stage Files
```
data/stages/
├── tokenisasi.json       (term frequency per document)
├── tfidf.json            (TF-IDF scores per document)
├── filtering.json        (DF threshold filtering results)
├── seleksi_fitur.json    (Chi² feature selection results)
└── random_forest.json    (RF predictions & tree votes)
```

### Helper Function
```python
from main import get_pengaduan_detail
detail = get_pengaduan_detail("PGD-0001")
# Returns complete data from all stages
```

---

## 📊 Implementation Status (June 2026)

| Feature | Status | Documentation |
|---------|--------|---------------|
| **Kode Pengaduan Structure** | ✅ Complete | REFAKTOR-STRUKTUR-KODE-PENGADUAN.md |
| **Stage Files Generation** | ✅ Complete | QUICK-START-KODE-PENGADUAN.md |
| **Helper Function** | ✅ Complete | backend/main.py |
| **Test Validation** | ✅ Complete | backend/test_kode_pengaduan.py |
| **Training Pipeline** | ✅ Complete | PANDUAN-ULANG-KLASIFIKASI.md |
| **Port Conflict Resolution** | ✅ Complete | SOLUSI-PORT-CONFLICT.md |
| **Data Transparency** | 🟡 50% Complete | TRANSPARANSI-DATA-UPDATE.md |
| **Backend API** | ⚠️  Recommended | QUICK-START-KODE-PENGADUAN.md |
| **Frontend Integration** | 📝 TODO | Update components |

Legend:
- ✅ Complete
- 🟡 Partial (some features need backend support)
- ⚠️  Recommended
- 📝 TODO

---

## 🚀 Workflow Recommendations

### Scenario 1: First Time Setup
1. Read **CARA-MENJALANKAN.md**
2. Run `kill-ports.bat`
3. Run `check-setup.bat`
4. Start backend: `node backend/server.js`
5. Start frontend: `npm run dev`
6. Login: http://localhost:3000

### Scenario 2: Training Ulang (New Structure)
1. Read **QUICK-START-KODE-PENGADUAN.md**
2. Run `hapus-hasil-klasifikasi.bat`
3. Run `python backend/main.py --train`
4. Run `python backend/test_kode_pengaduan.py`
5. Restart backend

### Scenario 3: Port Conflict
1. Read **SOLUSI-PORT-CONFLICT.md**
2. Run `kill-ports.bat`
3. Try `npm run dev` again
4. If still fails, frontend will auto-select port 3003

### Scenario 4: Development
1. Read **docs/Guidelines.md**
2. Understand data flow in **TRANSPARANSI-DATA-UPDATE.md**
3. Use **REFAKTOR-STRUKTUR-KODE-PENGADUAN.md** for API design
4. Test with **backend/test_kode_pengaduan.py**

---

## 📞 Quick Help

| Problem | Solution | Documentation |
|---------|----------|---------------|
| npm run dev tidak jalan | Run `kill-ports.bat` | CARA-MENJALANKAN.md |
| Training fails | Check Python dependencies | PANDUAN-ULANG-KLASIFIKASI.md |
| Need complete pengaduan detail | Use `get_pengaduan_detail()` | QUICK-START-KODE-PENGADUAN.md |
| File not found error | Run training ulang | PANDUAN-ULANG-KLASIFIKASI.md |
| Slow lookup | Use new structure with kode_pengaduan | REFAKTOR-STRUKTUR-KODE-PENGADUAN.md |

---

**Version:** 2.0 (Kode Pengaduan Structure)  
**Last Updated:** June 22, 2026  
**Next Steps:** Frontend integration dengan struktur baru
