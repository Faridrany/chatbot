# Panduan: Hapus dan Ulang Klasifikasi

## 🎯 Tujuan
Menghapus hasil klasifikasi yang sudah ada dan menjalankan ulang proses training + klasifikasi dari awal.

---

## 📋 Langkah-langkah

### Step 1: Install Python Dependencies (Jika Belum)

```bash
cd backend
pip install -r requirement.txt
```

**Waktu:** ~5-10 menit (tergantung koneksi internet)

**Dependencies yang akan diinstall:**
- pandas (data manipulation)
- scikit-learn (machine learning)
- numpy (numerical computation)
- Sastrawi (Indonesian NLP)
- joblib (model serialization)
- openpyxl (Excel export)
- dan lainnya...

---

### Step 2: Hapus Hasil Klasifikasi Lama

**Opsi A: Hapus File Secara Manual**

Hapus file-file berikut (jika ada):
```
data/predictions/hasil_prediksi.json
data/processed/final_processed.json
data/hasil_training.json
data/tfidf_terms.json
data/tfidf_sample_docs.json
data/export/preprocessing_result.xlsx
model/random_forest_model.pkl
model/tfidf_vectorizer.pkl
model/feature_selector.pkl
model/label_encoder.pkl
```

**Opsi B: Gunakan PowerShell Script (Recommended)**

Buat file `hapus-hasil-klasifikasi.bat`:
```batch
@echo off
echo ========================================
echo Menghapus Hasil Klasifikasi Lama
echo ========================================
echo.

echo Menghapus file hasil prediksi...
del /f /q "data\predictions\hasil_prediksi.json" 2>nul
echo ✓ hasil_prediksi.json

echo Menghapus file data processed...
del /f /q "data\processed\final_processed.json" 2>nul
echo ✓ final_processed.json

echo Menghapus file hasil training...
del /f /q "data\hasil_training.json" 2>nul
echo ✓ hasil_training.json

echo Menghapus file TF-IDF...
del /f /q "data\tfidf_terms.json" 2>nul
del /f /q "data\tfidf_sample_docs.json" 2>nul
echo ✓ tfidf_terms.json
echo ✓ tfidf_sample_docs.json

echo Menghapus file Excel export...
del /f /q "data\export\preprocessing_result.xlsx" 2>nul
echo ✓ preprocessing_result.xlsx

echo Menghapus model files...
del /f /q "model\random_forest_model.pkl" 2>nul
del /f /q "model\tfidf_vectorizer.pkl" 2>nul
del /f /q "model\feature_selector.pkl" 2>nul
del /f /q "model\label_encoder.pkl" 2>nul
echo ✓ Model files

echo.
echo ========================================
echo Hasil klasifikasi berhasil dihapus!
echo ========================================
echo.
echo Sekarang Anda bisa menjalankan training ulang dengan:
echo   cd backend
echo   python main.py --train
echo.

pause
```

Jalankan:
```batch
hapus-hasil-klasifikasi.bat
```

---

### Step 3: Jalankan Training Ulang

```bash
cd backend
python main.py --train
```

**Proses yang Akan Berjalan:**

1. **Memuat Data** (~1200 data dari `dataset_berlabel.json`)
2. **Preprocessing** (6 tahap):
   - Cleaning (hapus URL, special chars)
   - Casefolding (lowercase)
   - Tokenization (split kata)
   - Normalization (perbaiki typo/slang)
   - Stopword Removal (buang kata umum)
   - Stemming (bentuk dasar kata)
3. **TF-IDF Vectorization**:
   - Total fitur: ~2612
   - Setelah seleksi: 1000 fitur (SelectKBest Chi²)
4. **Training Random Forest**:
   - 500 pohon
   - 80/20 split (960 train, 240 test)
   - OOB Score calculation
   - 5-fold Cross Validation
5. **Evaluasi Model**:
   - Accuracy, Precision, Recall, F1-Score
   - Confusion Matrix
   - Per-class metrics
6. **Generate Output Files**:
   - `data/processed/final_processed.json`
   - `data/hasil_training.json`
   - `data/tfidf_terms.json`
   - `data/tfidf_sample_docs.json`
   - `data/export/preprocessing_result.xlsx`
   - `model/*.pkl` (4 files)

**Waktu Total:** ~30-60 detik (tergantung spesifikasi komputer)

**Output yang Benar:**
```
=== Sistem Klasifikasi Pengaduan Masyarakat ===
[*] Memulai proses pelatihan model...
[*] Jumlah data latih: 1200
[*] Memulai proses preprocessing...
    Urutan: Cleaning -> Casefolding -> Tokenizing -> Normalization -> Stopword -> Stemming
[OK] Preprocessing selesai.
Total sebelum filter kosong : 1200
Total sesudah filter kosong : 1200
Jumlah label unik           : 4 → ['INFRASTRUKTUR', 'KEAMANAN', 'LINGKUNGAN', 'PELAYANAN']
Shape TF-IDF                : (1200, 2612)
Shape setelah seleksi fitur : (1200, 1000)

Jumlah data awal  : 1200
Jumlah final_text : 1200
Jumlah label      : 1200
Train             : 960
Test              : 240

=== HASIL EVALUASI MODEL ===
Accuracy  : 0.8916...
Precision : 0.8935...
Recall    : 0.8916...
F1-Score  : 0.8915...
OOB Score : 0.8885...

Classification Report:
              precision    recall  f1-score   support

INFRASTRUKTUR       0.88      0.88      0.88        60
     KEAMANAN       0.93      0.93      0.93        60
   LINGKUNGAN       0.85      0.87      0.86        60
   PELAYANAN       0.92      0.90      0.91        60

    accuracy                           0.89       240
   macro avg       0.89      0.89      0.89       240
weighted avg       0.89      0.89      0.89       240

Confusion Matrix:
 [[53  4  2  1]
 [ 3 56  1  0]
 [ 4  2 52  2]
 [ 2  1  3 54]]

[*] Menjalankan Cross Validation 5-fold (n_jobs=-1)...
CV Scores : [0.8916 0.8833 0.8916 0.8750 0.9000]
CV Mean   : 0.8883  ±  0.0088

[OK] Model berhasil disimpan di: model/random_forest_model.pkl
[OK] Hasil evaluasi disimpan ke: hasil_training.json
[OK] 1200 data prediksi disimpan ke: final_processed.json
[*] Menyimpan data TF-IDF terms...
[OK] 3000 TF-IDF terms disimpan ke: tfidf_terms.json
[*] Menyimpan sample dokumen TF-IDF...
[OK] 5 sample dokumen disimpan ke: tfidf_sample_docs.json
[*] Mengekspor hasil preprocessing ke Excel: ...
[OK] File Excel berhasil disimpan: ...
```

---

### Step 4: Restart Backend Server

Jika backend server sedang jalan, restart untuk load data baru:

**Windows:**
```bash
# Stop backend (Ctrl+C di terminal backend)
# Atau kill process
taskkill /F /IM node.exe

# Start ulang
cd backend
node server.js
```

**Linux/Mac:**
```bash
# Stop backend (Ctrl+C)

# Start ulang
cd backend
node server.js
```

**Output yang Benar:**
```
⏳ Loading core data into memory...
✅ Cache loaded: 1200 pengaduan (training + klasifikasi), 1200 data latih
🟢 Express Server: http://localhost:3001
📊 Data Pengaduan: 1200 entri siap
```

---

### Step 5: Verifikasi di Frontend

1. **Buka browser:** http://localhost:3000
2. **Login:** admin / admin123
3. **Cek halaman-halaman:**
   - **Dashboard** → Lihat statistik update
   - **Data Pengaduan** → Lihat data hasil klasifikasi
   - **Ekstraksi Fitur → Final Processed** → Lihat data processed
   - **Evaluasi Model → Metrik Evaluasi** → Lihat akurasi, precision, dll

---

## ⚠️ Troubleshooting

### Problem: `ModuleNotFoundError: No module named 'joblib'`

**Solusi:**
```bash
cd backend
pip install -r requirement.txt
```

### Problem: `FileNotFoundError: dataset_berlabel.json`

**Solusi:** Pastikan file `data/raw/dataset_berlabel.json` ada.

Cek:
```bash
dir data\raw\dataset_berlabel.json
```

### Problem: Training sangat lambat (>5 menit)

**Kemungkinan Penyebab:**
- Dataset terlalu besar (>10,000 rows)
- CPU lambat
- RAM tidak cukup

**Solusi:**
1. Kurangi `n_estimators` dari 500 ke 100 di `main.py`:
   ```python
   model = RandomForestClassifier(
       n_estimators=100,  # Dari 500 → 100
       ...
   )
   ```

2. Kurangi `max_features` TF-IDF dari 5000 ke 2000:
   ```python
   vectorizer = TfidfVectorizer(
       max_features=2000,  # Dari 5000 → 2000
       ...
   )
   ```

### Problem: Akurasi terlalu rendah (<80%)

**Kemungkinan Penyebab:**
- Data training tidak balance (satu kategori terlalu sedikit)
- Label tidak konsisten
- Preprocessing terlalu agresif

**Solusi:**
1. Cek distribusi label:
   ```python
   df['Kategori'].value_counts()
   ```

2. Pastikan minimal 200 data per kategori

3. Cek kualitas data (typo, label salah, dll)

### Problem: File Excel tidak terbuat

**Solusi:** Pastikan `openpyxl` terinstall:
```bash
pip install openpyxl
```

---

## 📊 File Output yang Dihasilkan

Setelah training selesai, file-file berikut akan dibuat:

### 1. Data Files

| File | Lokasi | Ukuran | Deskripsi |
|------|--------|--------|-----------|
| `final_processed.json` | `data/processed/` | ~500 KB | Semua data dengan hasil klasifikasi |
| `hasil_training.json` | `data/` | ~2 KB | Metrik evaluasi model |
| `tfidf_terms.json` | `data/` | ~400 KB | Daftar 3000 term dengan TF-IDF score |
| `tfidf_sample_docs.json` | `data/` | ~5 KB | 5 sample dokumen ter-vektorisasi |
| `preprocessing_result.xlsx` | `data/export/` | ~1 MB | Excel dengan 8 sheets (semua tahap preprocessing) |

### 2. Model Files

| File | Lokasi | Ukuran | Deskripsi |
|------|--------|--------|-----------|
| `random_forest_model.pkl` | `model/` | ~50 MB | Random Forest terlatih (500 pohon) |
| `tfidf_vectorizer.pkl` | `model/` | ~3 MB | TF-IDF Vectorizer |
| `feature_selector.pkl` | `model/` | ~1 MB | SelectKBest selector |
| `label_encoder.pkl` | `model/` | ~1 KB | Label Encoder |

### 3. Preprocessing History Files

| File | Lokasi | Ukuran | Deskripsi |
|------|--------|--------|-----------|
| `cleaned.json` | `data/processed/` | ~600 KB | Hasil cleaning |
| `casefolded.json` | `data/processed/` | ~500 KB | Hasil casefolding |
| `tokenized.json` | `data/processed/` | ~600 KB | Hasil tokenization |
| `normalized.json` | `data/processed/` | ~600 KB | Hasil normalization |
| `stop_removed.json` | `data/processed/` | ~500 KB | Hasil stopword removal |
| `stemmed.json` | `data/processed/` | ~500 KB | Hasil stemming |

**Total:** ~60 MB

---

## 🔄 Workflow Lengkap

```
1. Hapus hasil lama
   └─> hapus-hasil-klasifikasi.bat

2. Training ulang
   └─> python main.py --train
       ├─> Load dataset_berlabel.json (1200 data)
       ├─> Preprocessing (6 tahap)
       ├─> TF-IDF Vectorization (2612 → 1000 fitur)
       ├─> Training Random Forest (500 pohon)
       ├─> Evaluasi Model (accuracy ~89%)
       ├─> Generate output files
       └─> Export ke Excel

3. Restart backend
   └─> node server.js
       └─> Load data baru ke cache

4. Refresh frontend
   └─> http://localhost:3000
       └─> Lihat data update
```

---

## ✅ Checklist

Sebelum training ulang:
- [ ] Python dependencies terinstall (`pip list` untuk cek)
- [ ] File `dataset_berlabel.json` ada dan berisi ~1200 data
- [ ] Folder `model/`, `data/processed/`, `data/export/` ada
- [ ] Backend server tidak jalan (atau siap untuk di-restart)

Setelah training:
- [ ] File `final_processed.json` ada dan berisi 1200 data
- [ ] File `hasil_training.json` ada dan berisi metrics
- [ ] File `tfidf_terms.json` ada dan berisi ~3000 term
- [ ] File `*.pkl` ada di folder `model/` (4 files)
- [ ] File Excel ada di `data/export/`
- [ ] Akurasi model >= 85%
- [ ] Backend server sudah restart
- [ ] Frontend menampilkan data baru

---

## 💡 Tips

1. **Backup data lama** sebelum hapus (opsional):
   ```batch
   xcopy data\processed\final_processed.json data\backup\ /Y
   xcopy data\hasil_training.json data\backup\ /Y
   ```

2. **Monitor proses training** dengan membuka terminal dan lihat log output

3. **Jangan interrupt proses** saat training (Ctrl+C) - bisa corrupt file

4. **Verifikasi hasil** dengan cek akurasi >= 85% dan confusion matrix balance

5. **Restart browser** jika data tidak update di frontend (Ctrl+F5)

---

**Training ulang siap dilakukan! 🚀**

Jika ada error, cek bagian Troubleshooting atau lihat log error di terminal.
