# Update: Transparansi Data - Menampilkan Term + Nilai Detail

## 🎯 Tujuan Update

Meningkatkan transparansi di semua sub-halaman (Ekstraksi Fitur & Random Forest) dengan prinsip:
- **Tampilkan data detail** (term + nilai/frequency), bukan hanya angka ringkasan
- **Sandingkan term/data mentah dengan nilai numeriknya** dalam bentuk tabel
- **Tampilkan konteks pengaduan** (cuplikan teks/ID) untuk traceability
- **Tidak ada interpretasi otomatis** - hanya data apa adanya

---

## ✅ Yang Sudah Dilakukan

### 1. Menambahkan Halaman "Final Processed" (NEW)

**Lokasi:** Menu Ekstraksi Fitur → Final Processed

**Fitur:**
- ✅ Menampilkan daftar pengaduan dengan teks asli dan hasil preprocessing
- ✅ Sandingkan "Deskripsi Asli" vs "Final Processed Text"
- ✅ **Klik "Lihat Detail"** untuk melihat **Term Frequency per dokumen**
- ✅ Bar chart untuk visualisasi frequency tiap term
- ✅ Total unique terms dan total term count
- ✅ Filter by kategori (KEAMANAN, INFRASTRUKTUR, LINGKUNGAN, PELAYANAN)
- ✅ Search by deskripsi
- ✅ Pagination (20 item per halaman)

**Data yang Ditampilkan:**
```
Contoh per pengaduan:
- Deskripsi Asli: "Lampu PJU mati..."
- Final Processed: "lampu terang jalan umum sekitar..."
- Term Frequency:
  * lampu: 2x ████████████████ 100%
  * terang: 1x ████████ 50%
  * jalan: 1x ████████ 50%
  * umum: 1x ████████ 50%
```

**File:**
- `frontend/src/components/ekstraksi/EkstraksiFinalProcessed.jsx` (NEW - 350+ lines)
- `frontend/src/components/Sidebar.jsx` (UPDATED - tambah sub-menu)
- `frontend/src/App.jsx` (UPDATED - tambah route)

---

## 📊 Status Halaman Eksisting

### A. Ekstraksi Fitur

#### ✅ 1. Statistik Keseluruhan TF-IDF
**Status:** SUDAH TRANSPARAN
- Menampilkan total fitur, fitur terpilih, unigram, bigram
- **DATA DETAIL SUDAH ADA:**
  - Link ke halaman "Term & Tokenisasi" untuk lihat daftar term lengkap
  - Proporsi visual terpilih vs tereliminasi

**REKOMENDASI:** Sudah OK, tidak perlu perubahan besar.

---

#### ✅ 2. Term & Tokenisasi
**Status:** SUDAH TRANSPARAN
- Menampilkan tabel 50 term per halaman
- Kolom: Rank, Term, TF-IDF Score (mean), DF, IDF, N-gram
- Pagination lengkap
- Filter by n-gram (unigram/bigram)
- Search term

**DATA DETAIL YANG DITAMPILKAN:**
```
#1  sampah    TF-IDF: 0.0213  DF: 245  IDF: 1.67  [Unigram]
#2  layan     TF-IDF: 0.0164  DF: 198  IDF: 1.81  [Unigram]
#3  tugas     TF-IDF: 0.0119  DF: 156  IDF: 1.95  [Unigram]
...
```

**REKOMENDASI:** Sudah OK, tidak perlu perubahan.

---

#### ⚠️ 3. Filtering (Min DF & Max DF)
**Status:** PERLU DIPERBAIKI

**Masalah:** Hanya menampilkan penjelasan konsep DF, tidak ada data aktual term yang lolos/terbuang.

**YANG HARUS DITAMPILKAN:**
- Tabel term yang **LOLOS filter** (DF >= min_df dan DF <= max_df) dengan nilai DF-nya
- Tabel term yang **TERBUANG** karena tidak memenuhi threshold
- Jumlah term sebelum vs sesudah filtering
- Contoh: 
  ```
  TERM LOLOS:
  - lampu: DF = 234 ✓ (min_df=2, max_df=950)
  - jalan: DF = 189 ✓
  
  TERM TERBUANG:
  - halo: DF = 1 ✗ (< min_df=2)
  - yang: DF = 1200 ✗ (> max_df=950)
  ```

**SOLUSI:** Perlu update halaman untuk fetch data term lengkap dan split berdasarkan DF threshold.

---

#### ✅ 4. Seleksi Fitur & Metode
**Status:** SUDAH TRANSPARAN
- Menampilkan tabel 50 term terpilih per halaman
- Kolom: Rank, Term, Chi² Score, TF-IDF Score, N-gram
- Pagination lengkap
- Filter by n-gram
- Search term

**DATA DETAIL YANG DITAMPILKAN:**
```
#1  sampah    Chi²: 59.79  TF-IDF: 0.0213  [Unigram]
#2  layan     Chi²: 58.90  TF-IDF: 0.0164  [Unigram]
...
```

**REKOMENDASI:** Sudah OK, tidak perlu perubahan.

---

#### ✅ 5. Final Processed (NEW)
**Status:** SUDAH TRANSPARAN
- Menampilkan data pengaduan lengkap dengan term frequency detail
- Klik "Lihat Detail" untuk expand dan lihat term frequency per dokumen

**REKOMENDASI:** Sudah selesai dibuat (baru saja).

---

### B. Random Forest

#### ⚠️ 1. Bootstrap Sampling
**Status:** PERLU DIPERBAIKI

**Masalah:** Hanya menampilkan konsep bootstrap, tidak ada data aktual sample per pohon.

**YANG HARUS DITAMPILKAN:**
- Daftar pohon (#1-#500)
- Per pohon: Data mana saja yang masuk (dengan ID/cuplikan pengaduan)
- Sample size per pohon
- Contoh:
  ```
  POHON #1:
  - Sample Size: 960 (80% dari 1200)
  - Data yang masuk:
    * #123: "Lampu jalan mati..." (KEAMANAN)
    * #456: "Sampah menumpuk..." (LINGKUNGAN)
    * #789: "Jalan rusak..." (INFRASTRUKTUR)
    ...
  ```

**SOLUSI:** Backend perlu expose data bootstrap sampling (sekarang tidak ada endpoint).

---

#### ⚠️ 2. Gini Impurity & Splitting
**Status:** PERLU DIPERBAIKI

**Masalah:** Hanya penjelasan konsep Gini, tidak ada data split aktual.

**YANG HARUS DITAMPILKAN:**
- Daftar node splits dari beberapa pohon sample
- Per split: Term yang dipakai, Gini impurity sebelum/sesudah, Gini decrease
- Contoh:
  ```
  POHON #1 - NODE #1:
  - Split Feature: "lampu"
  - Gini Before: 0.75
  - Gini After Left: 0.42
  - Gini After Right: 0.33
  - Gini Decrease: 0.35
  ```

**SOLUSI:** Backend perlu extract tree structure (sekarang tidak ada endpoint).

---

#### ⚠️ 3. OOB Score & Validasi
**Status:** PERLU DIPERBAIKI

**Masalah:** Hanya tampilkan OOB score total, tidak ada data OOB per pengaduan.

**YANG HARUS DITAMPILKAN:**
- Daftar pengaduan yang jadi OOB samples
- Per pengaduan: Prediksi OOB vs Label Asli, Benar/Salah
- Contoh:
  ```
  OOB SAMPLES:
  #123: "Lampu mati..." → Prediksi: KEAMANAN, Actual: KEAMANAN ✓
  #456: "Sampah..." → Prediksi: LINGKUNGAN, Actual: LINGKUNGAN ✓
  #789: "Jalan rusak..." → Prediksi: INFRASTRUKTUR, Actual: KEAMANAN ✗
  ```

**SOLUSI:** Backend perlu track OOB predictions (sekarang tidak ada data).

---

#### ⚠️ 4. Majority Voting & Prediksi
**Status:** PERLU DIPERBAIKI

**Masalah:** Hanya penjelasan voting, tidak ada data voting per pengaduan.

**YANG HARUS DITAMPILKAN:**
- Pilih satu pengaduan sample
- Tampilkan hasil voting dari 500 pohon:
  ```
  PENGADUAN #123: "Lampu jalan mati..."
  
  Voting Results:
  - KEAMANAN: 295 votes (59%)
  - INFRASTRUKTUR: 169 votes (34%)
  - LINGKUNGAN: 24 votes (5%)
  - PELAYANAN: 12 votes (2%)
  
  Final Prediction: KEAMANAN (majority)
  Confidence: 59%
  Actual Label: KEAMANAN ✓
  ```

**SOLUSI:** Backend perlu expose per-tree predictions (sekarang tidak ada).

---

#### ✅ 5. Feature Importance
**Status:** SUDAH TRANSPARAN (menggunakan mock data)
- Menampilkan tabel 50 term per halaman dengan importance score
- Kolom: Rank, Term, Importance Bar, Importance %, Chi² Score (reference)
- Pagination lengkap
- Sort by importance descending

**DATA DETAIL YANG DITAMPILKAN:**
```
#1  sampah    ████████████ 3.45%  Chi²: 59.79
#2  layan     ███████████  3.21%  Chi²: 58.90
#3  lampu     ██████████   2.87%  Chi²: 47.23
...
```

**CATATAN:** Saat ini menggunakan **mock data**. Untuk production, backend perlu expose `model.feature_importances_` dari Random Forest terlatih.

**REKOMENDASI:** Sudah OK untuk demo, perlu real data untuk production.

---

## 📋 Ringkasan Status

### ✅ Sudah Transparan (OK):
1. ✅ Ekstraksi Fitur → Statistik Keseluruhan TF-IDF
2. ✅ Ekstraksi Fitur → Term & Tokenisasi
3. ✅ Ekstraksi Fitur → Seleksi Fitur & Metode
4. ✅ Ekstraksi Fitur → Final Processed (NEW)
5. ✅ Random Forest → Feature Importance (mock data)

### ⚠️ Perlu Update (Butuh Backend Support):
6. ⚠️ Ekstraksi Fitur → Filtering (Min DF & Max DF)
7. ⚠️ Random Forest → Bootstrap Sampling
8. ⚠️ Random Forest → Gini Impurity & Splitting
9. ⚠️ Random Forest → OOB Score & Validasi
10. ⚠️ Random Forest → Majority Voting & Prediksi

---

## 🚀 Next Steps (Untuk Transparansi Penuh)

### Priority 1: Update Halaman yang Sudah Ada Data Backend

#### 1. Filtering (Min DF & Max DF)
**Backend:** Data sudah ada di `tfidf_terms.json` (field `selected: true/false`)

**Frontend Update:**
```javascript
// Fetch all terms
fetch("/api/tfidf?limit=10000")
  .then(r => r.json())
  .then(data => {
    const lolos = data.items.filter(t => t.selected);
    const terbuang = data.items.filter(t => !t.selected);
    // Render 2 tabel terpisah
  });
```

**Estimasi:** 2-3 jam (frontend only)

---

### Priority 2: Backend Endpoints Baru (Butuh Python Changes)

#### 2. Bootstrap Sampling Data
**Backend:** Perlu simpan bootstrap samples saat training

**Python (`main.py`):**
```python
# Saat training
bootstrap_info = []
for i, tree in enumerate(model.estimators_):
    samples = tree.random_state.choice(X_train.indices, size=len(X_train), replace=True)
    bootstrap_info.append({
        "tree_id": i,
        "samples": samples.tolist()  # List of document indices
    })

with open("data/bootstrap_samples.json", "w") as f:
    json.dump(bootstrap_info, f)
```

**Node.js (`server.js`):**
```javascript
app.get("/api/random-forest/bootstrap-samples", async (req, res) => {
  const tree_id = req.query.tree_id;  // Optional filter
  const raw = await fs.readFile(path.join(DATA_DIR, "bootstrap_samples.json"), "utf-8");
  const data = JSON.parse(raw);
  // Filter by tree_id if provided
  res.json(data);
});
```

**Estimasi:** 4-6 jam (backend + frontend)

---

#### 3. Gini Impurity & Splits
**Backend:** Extract tree structure from trained model

**Python:**
```python
def extract_tree_splits(tree, feature_names):
    tree_struct = tree.tree_
    splits = []
    for node_id in range(tree_struct.node_count):
        if tree_struct.feature[node_id] != -2:  # Not a leaf
            splits.append({
                "node_id": node_id,
                "feature": feature_names[tree_struct.feature[node_id]],
                "threshold": tree_struct.threshold[node_id],
                "gini": tree_struct.impurity[node_id],
                "samples": tree_struct.n_node_samples[node_id]
            })
    return splits
```

**Estimasi:** 6-8 jam (complex tree traversal + frontend)

---

#### 4. OOB Predictions per Sample
**Backend:** Track OOB predictions during training

**Python:**
```python
from sklearn.ensemble import RandomForestClassifier

# Enable OOB
model = RandomForestClassifier(oob_score=True, ...)
model.fit(X_train, y_train)

# Get OOB predictions
oob_predictions = model.oob_decision_function_  # Probability per class
oob_predicted_labels = oob_predictions.argmax(axis=1)

oob_data = []
for i, pred in enumerate(oob_predicted_labels):
    oob_data.append({
        "doc_id": i,
        "predicted": label_encoder.inverse_transform([pred])[0],
        "actual": y_train[i],
        "correct": pred == y_train[i]
    })
```

**Estimasi:** 3-4 jam

---

#### 5. Per-Tree Voting
**Backend:** Get predictions from each tree

**Python:**
```python
# For a sample document
def get_voting_detail(model, X_sample):
    votes = []
    for tree in model.estimators_:
        pred = tree.predict(X_sample)[0]
        votes.append(label_encoder.inverse_transform([pred])[0])
    
    from collections import Counter
    vote_counts = Counter(votes)
    return vote_counts
```

**Estimasi:** 4-5 jam

---

## 📊 Estimasi Total Waktu

| Task | Estimasi | Priority |
|------|----------|----------|
| Filtering (Frontend Only) | 2-3 jam | HIGH |
| Bootstrap Sampling | 4-6 jam | MEDIUM |
| Gini Impurity | 6-8 jam | LOW |
| OOB Predictions | 3-4 jam | MEDIUM |
| Per-Tree Voting | 4-5 jam | MEDIUM |
| **TOTAL** | **19-26 jam** | |

---

## 🎯 Rekomendasi

### Phase 1 (Sekarang - Quick Wins):
1. ✅ Final Processed halaman (DONE)
2. ⚠️ Update Filtering halaman (2-3 jam, frontend only)

### Phase 2 (Next Sprint - Backend Heavy):
3. Bootstrap Sampling endpoint + frontend
4. OOB Predictions endpoint + frontend
5. Per-Tree Voting endpoint + frontend

### Phase 3 (Future - Advanced):
6. Gini Impurity tree structure (paling complex)
7. Feature Importance real data (dari model.feature_importances_)

---

## 📝 Catatan Implementasi

### Prinsip yang Harus Diikuti:
1. **Selalu tampilkan term/data + nilai numeriknya**
2. **Sertakan konteks** (ID pengaduan, cuplikan teks)
3. **Jangan interpretasi otomatis** - hanya data
4. **Pagination untuk dataset besar** (>100 rows)
5. **Filter & search** untuk eksplorasi data
6. **Error handling** yang jelas

### File Structure:
```
frontend/src/components/
├── ekstraksi/
│   ├── EkstraksiStatistik.jsx ✅
│   ├── EkstraksiTermTokenisasi.jsx ✅
│   ├── EkstraksiFiltering.jsx ⚠️ (perlu update)
│   ├── EkstraksiSeleksiFitur.jsx ✅
│   └── EkstraksiFinalProcessed.jsx ✅ (NEW)
│
└── rf/
    ├── RFBootstrap.jsx ⚠️ (perlu backend)
    ├── RFGini.jsx ⚠️ (perlu backend)
    ├── RFOOB.jsx ⚠️ (perlu backend)
    ├── RFVoting.jsx ⚠️ (perlu backend)
    └── RFFeatureImportance.jsx ✅ (mock data)
```

---

## ✅ Yang Sudah Selesai Hari Ini

1. ✅ Tambah sub-menu "Final Processed" di Sidebar
2. ✅ Buat komponen EkstraksiFinalProcessed.jsx lengkap
3. ✅ Update routing di App.jsx
4. ✅ Fitur expand/collapse untuk lihat term frequency detail
5. ✅ Filter by kategori & search
6. ✅ Pagination
7. ✅ Error handling dengan troubleshooting guide
8. ✅ Flow diagram preprocessing stages

---

**Status Keseluruhan:** 5/10 halaman sudah transparan, 5 halaman perlu update (4 butuh backend support baru, 1 bisa langsung update frontend).

User bisa mulai pakai halaman Final Processed sekarang untuk lihat detail term frequency per dokumen! 🎉
