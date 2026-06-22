# Aplikasi Klasifikasi Pengaduan Warga

Sistem klasifikasi otomatis pengaduan warga menggunakan Random Forest dan TF-IDF.

---

## 🚀 Quick Start (3 Langkah)

### 1. Cek Setup
```batch
check-setup.bat
```
Pastikan semua ✓

### 2. Start Aplikasi
```batch
start-all.bat
```
Tunggu 2 terminal terbuka

### 3. Buka Browser
```
http://localhost:3000
```
**Login:** admin / admin123

---

## 📚 Dokumentasi Lengkap

### Untuk Memulai:
- **[QUICK-START.md](QUICK-START.md)** ⭐ - Panduan cepat 3 langkah (5 menit)
- **[README-STARTUP.md](README-STARTUP.md)** - Panduan lengkap startup (15 menit)
- **[DOKUMENTASI-INDEX.md](DOKUMENTASI-INDEX.md)** - Index semua dokumentasi

### Troubleshooting:
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** ⭐ - Solusi untuk semua masalah (20 menit)
- **[SOLUSI-DATA-TIDAK-MUNCUL.md](SOLUSI-DATA-TIDAK-MUNCUL.md)** - Fix untuk "data tidak muncul"

### Untuk Developer:
- **[SUMMARY.md](SUMMARY.md)** - Ringkasan perubahan kode
- **[docs/](docs/)** - Dokumentasi teknis aplikasi

---

## 🛠️ Script & Tools

| Script | Fungsi | Kapan Pakai |
|--------|--------|-------------|
| `check-setup.bat` | Diagnostic tool | Sebelum start pertama kali |
| `start-all.bat` ⭐ | Start backend + frontend | Setiap kali development |
| `start-backend.bat` | Start backend saja | Troubleshooting backend |
| `start-frontend.bat` | Start frontend saja | Troubleshooting frontend |

---

## 📋 Requirements

- **Node.js** v16+ (untuk backend & frontend)
- **Python** 3.8+ (untuk ML training)
- **npm** (untuk dependencies)

### Cek Requirements:
```bash
node --version   # harus v16+
python --version # harus 3.8+
```

---

## 🏗️ Struktur Aplikasi

```
chatbot/
├── backend/          # Express.js server (Port 3001)
│   ├── server.js    # REST API
│   ├── main.py      # ML training
│   └── package.json
│
├── frontend/         # React + Vite (Port 3000)
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   └── package.json
│
├── data/             # JSON data files
│   ├── hasil_training.json
│   ├── tfidf_terms.json
│   └── processed/
│
└── docs/             # Dokumentasi aplikasi
```

---

## 🎯 Fitur Utama

### 1. Dashboard
- Statistik pengaduan real-time
- Grafik distribusi kategori
- Data pengaduan terbaru

### 2. Ekstraksi Fitur (TF-IDF)
- **Statistik Keseluruhan** - 2612 fitur → 1000 fitur terpilih
- **Term & Tokenisasi** - Daftar term dengan TF-IDF score
- **Filtering** - Min DF & Max DF explanation
- **Seleksi Fitur** - Chi-squared selection

### 3. Random Forest (500 Pohon)
- **Bootstrap Sampling** - Data sampling per pohon
- **Gini Impurity** - Node splitting explanation
- **OOB Score** - Out-of-bag validation
- **Voting** - Majority voting mechanism
- **Feature Importance** - Gini-based importance scores

### 4. Evaluasi Model
- **Metrik** - Accuracy (~89%), Precision, Recall, F1-Score
- **Confusion Matrix** - Error pattern analysis
- **Cross Validation** - 5-fold CV + overfitting check
- **Error Analysis** - Misclassified examples

---

## ⚙️ Setup Manual (Linux/Mac)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
pip install -r requirement.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Generate Training Data
```bash
cd backend
python main.py --train
```

### 3. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Open Browser
```
http://localhost:3000
```

---

## 🔧 Troubleshooting Cepat

### Problem: Data tidak muncul
**Solusi:**
1. Cek backend jalan: `cd backend && node server.js`
2. Test API: http://localhost:3001/api/tfidf?page=1&limit=1
3. Baca: **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

### Problem: Backend error "Cannot find module"
**Solusi:**
```bash
cd backend
npm install
```

### Problem: Port 3001 sudah dipakai
**Solusi:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
kill -9 $(lsof -t -i:3001)
```

### Problem: File data tidak ada
**Solusi:**
```bash
cd backend
python main.py --train
```

---

## 📊 API Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/tfidf` | GET | TF-IDF terms dengan pagination |
| `/api/evaluasi` | GET | Model evaluation metrics |
| `/api/stats` | GET | Dashboard statistics |
| `/api/pengaduan` | GET | Daftar pengaduan |
| `/api/pengaduan/:id` | GET | Detail pengaduan |
| `/api/klasifikasi` | POST | Klasifikasi data baru |

**Test:** http://localhost:3001/api/tfidf?page=1&limit=1

---

## 🎓 Kategori Pengaduan

1. **KEAMANAN** - Lampu jalan, CCTV, ketertiban
2. **INFRASTRUKTUR** - Jalan rusak, trotoar, jembatan
3. **LINGKUNGAN** - Sampah, kebersihan, hijau
4. **PELAYANAN** - Administrasi, layanan publik

---

## 📈 Model Performance

- **Akurasi:** ~89%
- **Precision:** ~0.89
- **Recall:** ~0.89
- **F1-Score:** ~0.89
- **Total Data:** 1200 (960 train, 240 test)
- **Fitur:** 1000 (dari 2612 total)
- **Algoritma:** Random Forest (500 pohon)
- **Vectorizer:** TF-IDF (unigram + bigram)

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

---

## 📝 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail

---

## 📞 Support

Jika ada pertanyaan atau masalah:

1. Baca dokumentasi:
   - **[QUICK-START.md](QUICK-START.md)** untuk memulai
   - **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** untuk masalah
   - **[DOKUMENTASI-INDEX.md](DOKUMENTASI-INDEX.md)** untuk navigasi

2. Jalankan diagnostic:
   ```batch
   check-setup.bat
   ```

3. Cek browser console (F12) untuk error

4. Test API manual: http://localhost:3001/api/tfidf

---

## 🌟 Credits

- **Frontend:** React + Vite + TailwindCSS + shadcn/ui
- **Backend:** Express.js + Node.js
- **Machine Learning:** Python + scikit-learn + Random Forest
- **WhatsApp Integration:** whatsapp-web.js

---

## 📌 Catatan Penting

### Port yang Digunakan:
- **Frontend:** 3000 (atau 5173 jika 3000 terpakai)
- **Backend:** 3001
- **WhatsApp Bot:** 3002 (opsional)

### File Data yang Diperlukan:
- `data/hasil_training.json` - Model evaluation results
- `data/tfidf_terms.json` - TF-IDF terms with scores
- `data/processed/final_processed.json` - All pengaduan data
- `data/raw/dataset_berlabel.json` - Training dataset

### Regenerate Data:
```bash
cd backend
python main.py --train
```

---

**Ready to use! 🚀**

Jalankan `start-all.bat` dan buka http://localhost:3000

Jika ada masalah, baca **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
