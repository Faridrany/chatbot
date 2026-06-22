@echo off
echo ========================================
echo Menghapus Hasil Klasifikasi Lama
echo ========================================
echo.

echo [1/7] Menghapus file hasil prediksi...
if exist "data\predictions\hasil_prediksi.json" (
    del /f /q "data\predictions\hasil_prediksi.json" 2>nul
    echo      - hasil_prediksi.json DELETED
) else (
    echo      - hasil_prediksi.json not found
)

echo.
echo [2/7] Menghapus file data processed...
if exist "data\processed\final_processed.json" (
    del /f /q "data\processed\final_processed.json" 2>nul
    echo      - final_processed.json DELETED
) else (
    echo      - final_processed.json not found
)

echo.
echo [3/7] Menghapus file hasil training...
if exist "data\hasil_training.json" (
    del /f /q "data\hasil_training.json" 2>nul
    echo      - hasil_training.json DELETED
) else (
    echo      - hasil_training.json not found
)

echo.
echo [4/7] Menghapus file TF-IDF...
if exist "data\tfidf_terms.json" (
    del /f /q "data\tfidf_terms.json" 2>nul
    echo      - tfidf_terms.json DELETED
) else (
    echo      - tfidf_terms.json not found
)

if exist "data\tfidf_sample_docs.json" (
    del /f /q "data\tfidf_sample_docs.json" 2>nul
    echo      - tfidf_sample_docs.json DELETED
) else (
    echo      - tfidf_sample_docs.json not found
)

echo.
echo [5/7] Menghapus file Excel export...
if exist "data\export\preprocessing_result.xlsx" (
    del /f /q "data\export\preprocessing_result.xlsx" 2>nul
    echo      - preprocessing_result.xlsx DELETED
) else (
    echo      - preprocessing_result.xlsx not found
)

echo.
echo [6/7] Menghapus stage files (NEW STRUCTURE)...
if exist "data\stages\tokenisasi.json" (
    del /f /q "data\stages\tokenisasi.json" 2>nul
    echo      - tokenisasi.json DELETED
) else (
    echo      - tokenisasi.json not found
)

if exist "data\stages\tfidf.json" (
    del /f /q "data\stages\tfidf.json" 2>nul
    echo      - tfidf.json DELETED
) else (
    echo      - tfidf.json not found
)

if exist "data\stages\filtering.json" (
    del /f /q "data\stages\filtering.json" 2>nul
    echo      - filtering.json DELETED
) else (
    echo      - filtering.json not found
)

if exist "data\stages\seleksi_fitur.json" (
    del /f /q "data\stages\seleksi_fitur.json" 2>nul
    echo      - seleksi_fitur.json DELETED
) else (
    echo      - seleksi_fitur.json not found
)

if exist "data\stages\random_forest.json" (
    del /f /q "data\stages\random_forest.json" 2>nul
    echo      - random_forest.json DELETED
) else (
    echo      - random_forest.json not found
)

echo.
echo [7/7] Menghapus model files...
if exist "model\random_forest_model.pkl" (
    del /f /q "model\random_forest_model.pkl" 2>nul
    echo      - random_forest_model.pkl DELETED
) else (
    echo      - random_forest_model.pkl not found
)

if exist "model\tfidf_vectorizer.pkl" (
    del /f /q "model\tfidf_vectorizer.pkl" 2>nul
    echo      - tfidf_vectorizer.pkl DELETED
) else (
    echo      - tfidf_vectorizer.pkl not found
)

if exist "model\feature_selector.pkl" (
    del /f /q "model\feature_selector.pkl" 2>nul
    echo      - feature_selector.pkl DELETED
) else (
    echo      - feature_selector.pkl not found
)

if exist "model\label_encoder.pkl" (
    del /f /q "model\label_encoder.pkl" 2>nul
    echo      - label_encoder.pkl DELETED
) else (
    echo      - label_encoder.pkl not found
)

echo.
echo ========================================
echo Hasil klasifikasi berhasil dihapus!
echo ========================================
echo.
echo Struktur baru dengan kode_pengaduan akan di-generate saat training.
echo.
echo Langkah selanjutnya:
echo   1. cd backend
echo   2. python main.py --train
echo   3. python test_kode_pengaduan.py   (untuk validasi)
echo.

pause
