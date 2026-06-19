# Halaman Evaluasi Model Random Forest

## Overview

Halaman khusus untuk menampilkan **semua metrik evaluasi** model Random Forest Classifier: Accuracy, Precision, Recall, F1-Score, Confusion Matrix, Cross Validation, OOB Score, dan analisis kesalahan klasifikasi.

## Fitur Utama

### 1. ✅ Info Model

- Model name, version, training date
- Jumlah estimator (20 pohon)
- Status: Production

### 2. ✅ Metrik Utama (4 Cards)

- **Test Accuracy**: 91.67% (220 dari 240 benar)
- **Train Accuracy**: 98.75% (948 dari 960 benar)
- **Cross Validation**: 87.50% ± 2.37%
- **OOB Score**: 88.33%

### 3. ✅ Cross Validation Detail

- 5-Fold CV scores dengan visualisasi per fold
- Mean, Std Dev, Min, Max
- Progress bars per fold

### 4. ✅ Confusion Matrix

- Tabel 4x4 dengan color coding:
  - Hijau: Diagonal (prediksi benar)
  - Merah: Off-diagonal (salah klasifikasi)
  - Abu: Nol
- Summary: Total benar vs salah
- Row/column totals

### 5. ✅ Classification Report

- 4 Cards per kelas (INFRASTRUKTUR, KEAMANAN, LINGKUNGAN, PELAYANAN)
- Setiap card menampilkan:
  - **Precision**: % benar dari yang diprediksi kelas X
  - **Recall**: % terdeteksi dari yang sebenarnya kelas X
  - **F1-Score**: Harmonik mean precision & recall
  - **Support**: Jumlah sampel test
- Progress bars untuk setiap metrik
- **Weighted Average** di bawah

### 6. ✅ Analisis Kesalahan

- 7 contoh misclassified data dengan:
  - Token ID
  - True label vs Predicted label
  - Text pengaduan (jika ada)
  - **Alasan**: Kenapa model salah prediksi
- Insight & Rekomendasi perbaikan

### 7. ✅ Interpretasi Metrik

- 6 cards penjelasan konsep:
  - Accuracy, Precision, Recall, F1-Score
  - Cross Validation, OOB Score
- Bahasa non-teknis untuk stakeholder

### 8. ✅ Overfitting Check

- Comparison Train vs Test accuracy
- Gap percentage
- Status: Good fit / Slight overfitting / Overfitting
- Interpretasi hasil

## Data Mock

### Confusion Matrix

```
           INFRA  KEAMANAN  LINGKUNGAN  PELAYANAN
INFRA        56       2          1          1     (60)
KEAMANAN      1      59          0          0     (60)
LINGKUNGAN    2       0         58          0     (60)
PELAYANAN     1       0          0         59     (60)
```

### Classification Report

- INFRASTRUKTUR: P=93.33%, R=93.33%, F1=93.33%
- KEAMANAN: P=96.72%, R=98.33%, F1=97.52%
- LINGKUNGAN: P=98.31%, R=96.67%, F1=97.48%
- PELAYANAN: P=98.33%, R=98.33%, F1=98.33%

### Misclassified Examples

7 contoh dengan alasan spesifik, seperti:

- INFRA → KEAMANAN: Kata "rawan pencurian" terlalu kuat
- LINGKUNGAN → INFRA: "Selokan tersumbat" overlap dengan infrastruktur

## Warna Per Kategori

- INFRASTRUKTUR: #2E7D32 (hijau tua)
- KEAMANAN: #1976D2 (biru)
- LINGKUNGAN: #388E3C (hijau)
- PELAYANAN: #F57C00 (orange)

## Route & Navigation

- **Route**: `/evaluasi-model`
- **Menu**: "Evaluasi Model" (icon Activity)
- **Position**: Setelah "Detail Random Forest", sebelum "Klasifikasi"

## Use Cases

1. **Stakeholder Review**: Menunjukkan performa model ke manajemen
2. **Model Audit**: Verifikasi akurasi dan fairness per kategori
3. **Error Analysis**: Identifikasi pattern kesalahan untuk improvement
4. **A/B Testing**: Compare baseline vs new model
5. **Production Monitoring**: Track degradation seiring waktu

## Interpretasi Status

- **Accuracy 91.67%**: Sangat baik untuk 4-class classification
- **CV 87.50% ± 2.37%**: Stabil, low variance
- **OOB 88.33%**: Generalisasi baik
- **Gap 7.08%**: Slight overfitting, masih acceptable
- **F1 > 93%**: Semua kelas performa bagus, balanced

## Technical

- **Component**: `EvaluasiModel.jsx`
- **State**: `selectedClass` untuk interaktif card selection
- **Mock Data**: Semua embedded (tidak perlu backend API)
- **Icons**: Activity, Target, TrendingUp, CheckCircle2, XCircle, AlertCircle, BarChart3
