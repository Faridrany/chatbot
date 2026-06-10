# -*- coding: utf-8 -*-
import os
import re
import sys
import json
import joblib
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, confusion_matrix
)
from sklearn.preprocessing import LabelEncoder
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Fix encoding Windows (cmd/PowerShell tidak support UTF-8 emoji)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# =====================================================
# 1. PATH
# =====================================================
print("=== Sistem Klasifikasi Pengaduan Masyarakat ===")

CURRENT_DIR  = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))

DATA_DIR       = os.path.join(PROJECT_ROOT, "data")
RAW_DIR        = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR  = os.path.join(DATA_DIR, "processed")
FEATURE_DIR    = os.path.join(DATA_DIR, "features")
PREDICTION_DIR = os.path.join(DATA_DIR, "predictions")
MODEL_DIR      = os.path.join(PROJECT_ROOT, "model")
EXPORT_DIR     = os.path.join(DATA_DIR, "export")

for p in [RAW_DIR, PROCESSED_DIR, FEATURE_DIR, PREDICTION_DIR, MODEL_DIR, EXPORT_DIR]:
    os.makedirs(p, exist_ok=True)

DATASET_BERLABEL_PATH = os.path.join(RAW_DIR,       "dataset_berlabel.json")
DATA_BARU_PATH        = os.path.join(RAW_DIR,       "data_baru.json")
CLEANED_PATH          = os.path.join(PROCESSED_DIR, "cleaned.json")
CASEFOLDED_PATH       = os.path.join(PROCESSED_DIR, "casefolded.json")
TOKENIZED_PATH        = os.path.join(PROCESSED_DIR, "tokenized.json")
NORMALIZED_PATH       = os.path.join(PROCESSED_DIR, "normalized.json")
STOP_REMOVED_PATH     = os.path.join(PROCESSED_DIR, "stop_removed.json")
STEMMED_PATH          = os.path.join(PROCESSED_DIR, "stemmed.json")
FINAL_PROCESSED_PATH  = os.path.join(PROCESSED_DIR, "final_processed.json")
MODEL_PATH            = os.path.join(MODEL_DIR,     "random_forest_model.pkl")
VECTORIZER_PATH       = os.path.join(MODEL_DIR,     "tfidf_vectorizer.pkl")
SELECTOR_PATH         = os.path.join(MODEL_DIR,     "feature_selector.pkl")
LABEL_ENCODER_PATH    = os.path.join(MODEL_DIR,     "label_encoder.pkl")
TFIDF_FEATURES_PATH   = os.path.join(FEATURE_DIR,  "tfidf_features.pkl")  # legacy, tidak digunakan
HASIL_PREDIKSI_PATH   = os.path.join(PREDICTION_DIR,"hasil_prediksi.json")
EXPORT_EXCEL_PATH     = os.path.join(EXPORT_DIR,    "preprocessing_result.xlsx")

# =====================================================
# 2. SASTRAWI
# =====================================================
stemmer          = StemmerFactory().create_stemmer()
stopword_remover = StopWordRemoverFactory().create_stop_word_remover()

NORMALIZATION_DICT = {
    "gk": "tidak", "nggak": "tidak", "tdk": "tidak",
    "rt": "rukun tetangga", "rw": "rukun warga",
    "pju": "penerangan jalan umum"
}

# =====================================================
# 3. UTILITAS
# =====================================================
def save_json(data, filename):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def load_json(filename):
    if not os.path.exists(filename):
        raise FileNotFoundError(f"File tidak ditemukan: {filename}")
    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)

# =====================================================
# 4. PREPROCESSING
# Urutan: Cleaning → Casefolding → Tokenizing →
#         Normalization → Stopword Removal → Stemming
# =====================================================
def cleaning(text):
    """Hapus URL, karakter non-alfabet, dan spasi berlebih."""
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def case_folding(text):
    """Ubah semua huruf menjadi huruf kecil."""
    return text.lower()

def tokenization(text):
    """Pecah teks menjadi daftar token (kata)."""
    return text.split()

def normalization(tokens):
    """Ganti singkatan/slang dengan kata baku."""
    return [NORMALIZATION_DICT.get(t, t) for t in tokens]

def stopword_removal(tokens):
    """Hapus kata-kata umum yang tidak bermakna (stopword)."""
    return stopword_remover.remove(" ".join(tokens)).split()

def stemming(tokens):
    """Ubah kata ke bentuk dasar (stem)."""
    return stemmer.stem(" ".join(tokens)).split()

def preprocess_pipeline(data, save_files=True, append_files=False):
    """
    Pipeline preprocessing dengan urutan:
    1. Cleaning
    2. Casefolding
    3. Tokenizing
    4. Normalization
    5. Stopword Removal
    6. Stemming
    """
    print("[*] Memulai proses preprocessing...")
    print("    Urutan: Cleaning -> Casefolding -> Tokenizing -> Normalization -> Stopword -> Stemming")

    cleaned_data      = []
    casefolded_data   = []
    tokenized_data    = []
    normalized_data   = []
    stop_removed_data = []
    stemmed_data      = []
    final_data        = []

    for item in data:
        text = str(item.get("deskripsi", ""))

        # Step 1: Cleaning
        cleaned = cleaning(text)
        cleaned_data.append({"deskripsi": text, "cleaned": cleaned})

        # Step 2: Casefolding
        casefolded = case_folding(cleaned)
        casefolded_data.append({"deskripsi": text, "casefolded": casefolded})

        # Step 3: Tokenizing
        tokens = tokenization(casefolded)
        tokenized_data.append({"deskripsi": text, "tokenized": tokens})

        # Step 4: Normalization
        normalized = normalization(tokens)
        normalized_data.append({"deskripsi": text, "normalized": normalized})

        # Step 5: Stopword Removal
        stop_removed = stopword_removal(normalized)
        stop_removed_data.append({"deskripsi": text, "stop_removed": stop_removed})

        # Step 6: Stemming
        stemmed = stemming(stop_removed)
        stemmed_data.append({"deskripsi": text, "stemmed": stemmed})

        final_text = " ".join(stemmed)
        final_item = item.copy()
        final_item["final_text"] = final_text
        final_data.append(final_item)

    if save_files:
        def load_or_empty(path):
            if append_files and os.path.exists(path):
                return load_json(path)
            return []

        save_json(load_or_empty(CLEANED_PATH)         + cleaned_data,      CLEANED_PATH)
        save_json(load_or_empty(CASEFOLDED_PATH)      + casefolded_data,   CASEFOLDED_PATH)
        save_json(load_or_empty(TOKENIZED_PATH)       + tokenized_data,    TOKENIZED_PATH)
        save_json(load_or_empty(NORMALIZED_PATH)      + normalized_data,   NORMALIZED_PATH)
        save_json(load_or_empty(STOP_REMOVED_PATH)    + stop_removed_data, STOP_REMOVED_PATH)
        save_json(load_or_empty(STEMMED_PATH)         + stemmed_data,      STEMMED_PATH)
        # CATATAN: FINAL_PROCESSED_PATH TIDAK ditulis di sini.
        # Format final yang benar (dengan confidence, label_asli, kategori_prediksi)
        # ditulis oleh train_model() dan predict_new_data() secara langsung.

    print("[OK] Preprocessing selesai.")
    return final_data

# =====================================================
# 5. EXPORT EXCEL
# =====================================================
def export_preprocessing_to_excel(data, final_data, output_path=None):
    """
    Export hasil setiap tahap preprocessing ke file Excel.
    Setiap tahap memiliki sheet tersendiri, plus sheet ringkasan.

    Args:
        data       : list data asli (dari dataset_berlabel.json)
        final_data : list hasil preprocessing (dari preprocess_pipeline)
        output_path: path file .xlsx (default: EXPORT_EXCEL_PATH)
    """
    if output_path is None:
        output_path = EXPORT_EXCEL_PATH

    print(f"[*] Mengekspor hasil preprocessing ke Excel: {output_path}")

    # Load tiap file JSON hasil preprocessing
    def load_step(path):
        if os.path.exists(path):
            return load_json(path)
        return []

    cleaned_list      = load_step(CLEANED_PATH)
    casefolded_list   = load_step(CASEFOLDED_PATH)
    tokenized_list    = load_step(TOKENIZED_PATH)
    normalized_list   = load_step(NORMALIZED_PATH)
    stop_removed_list = load_step(STOP_REMOVED_PATH)
    stemmed_list      = load_step(STEMMED_PATH)

    wb = Workbook()

    # ── Style helpers ──────────────────────────────────────────
    header_font    = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
    header_fill    = PatternFill("solid", fgColor="2E7D32")   # hijau tua
    subhead_fill   = PatternFill("solid", fgColor="A5D6A7")   # hijau muda
    alt_fill       = PatternFill("solid", fgColor="F1F8E9")   # hijau sangat muda
    center_align   = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left_align     = Alignment(horizontal="left",   vertical="center", wrap_text=True)
    thin_border    = Border(
        left=Side(style="thin"), right=Side(style="thin"),
        top=Side(style="thin"),  bottom=Side(style="thin")
    )

    def style_header_row(ws, row_num, col_count):
        for col in range(1, col_count + 1):
            cell = ws.cell(row=row_num, column=col)
            cell.font      = header_font
            cell.fill      = header_fill
            cell.alignment = center_align
            cell.border    = thin_border

    def style_data_row(ws, row_num, col_count, alternate=False):
        fill = alt_fill if alternate else PatternFill("solid", fgColor="FFFFFF")
        for col in range(1, col_count + 1):
            cell = ws.cell(row=row_num, column=col)
            cell.fill      = fill
            cell.alignment = left_align
            cell.border    = thin_border

    def set_col_widths(ws, widths):
        for i, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(i)].width = w

    def freeze_and_filter(ws, freeze_cell="A2"):
        ws.freeze_panes = freeze_cell
        ws.auto_filter.ref = ws.dimensions

    # ── Sheet 1: Ringkasan ─────────────────────────────────────
    ws_sum = wb.active
    ws_sum.title = "Ringkasan"

    ws_sum.merge_cells("A1:C1")
    title_cell = ws_sum["A1"]
    title_cell.value     = "Ringkasan Hasil Preprocessing"
    title_cell.font      = Font(name="Calibri", bold=True, size=14, color="FFFFFF")
    title_cell.fill      = header_fill
    title_cell.alignment = center_align

    ws_sum.append(["Tahap", "Deskripsi", "Jumlah Data"])
    style_header_row(ws_sum, 2, 3)

    steps_info = [
        ("1. Cleaning",          "Hapus URL, karakter non-alfabet, spasi berlebih",          len(cleaned_list)),
        ("2. Casefolding",       "Ubah semua huruf menjadi huruf kecil",                     len(casefolded_list)),
        ("3. Tokenizing",        "Pecah teks menjadi daftar token (kata)",                   len(tokenized_list)),
        ("4. Normalization",     "Ganti singkatan/slang dengan kata baku",                   len(normalized_list)),
        ("5. Stopword Removal",  "Hapus kata umum yang tidak bermakna",                      len(stop_removed_list)),
        ("6. Stemming",          "Ubah kata ke bentuk dasar",                                len(stemmed_list)),
        ("Final Result",         "Teks siap pakai untuk training/prediksi model",            len(final_data)),
    ]

    for i, (tahap, desc, jml) in enumerate(steps_info, start=3):
        ws_sum.append([tahap, desc, jml])
        style_data_row(ws_sum, i, 3, alternate=(i % 2 == 0))
        ws_sum.cell(row=i, column=3).alignment = Alignment(horizontal="center", vertical="center")

    set_col_widths(ws_sum, [25, 55, 15])
    ws_sum.row_dimensions[1].height = 30
    ws_sum.row_dimensions[2].height = 20

    # ── Sheet 2: Cleaning ──────────────────────────────────────
    ws_cl = wb.create_sheet("1. Cleaning")
    ws_cl.append(["No", "Teks Asli (Deskripsi)", "Hasil Cleaning"])
    style_header_row(ws_cl, 1, 3)
    for i, row in enumerate(cleaned_list, start=1):
        ws_cl.append([i, row.get("deskripsi", ""), row.get("cleaned", "")])
        style_data_row(ws_cl, i + 1, 3, alternate=(i % 2 == 0))
        ws_cl.cell(row=i + 1, column=1).alignment = Alignment(horizontal="center", vertical="center")
    set_col_widths(ws_cl, [6, 60, 60])
    freeze_and_filter(ws_cl)

    # ── Sheet 3: Casefolding ───────────────────────────────────
    ws_cf = wb.create_sheet("2. Casefolding")
    ws_cf.append(["No", "Teks Asli (Deskripsi)", "Hasil Casefolding"])
    style_header_row(ws_cf, 1, 3)
    for i, row in enumerate(casefolded_list, start=1):
        ws_cf.append([i, row.get("deskripsi", ""), row.get("casefolded", "")])
        style_data_row(ws_cf, i + 1, 3, alternate=(i % 2 == 0))
        ws_cf.cell(row=i + 1, column=1).alignment = Alignment(horizontal="center", vertical="center")
    set_col_widths(ws_cf, [6, 60, 60])
    freeze_and_filter(ws_cf)

    # ── Sheet 4: Tokenizing ────────────────────────────────────
    ws_tk = wb.create_sheet("3. Tokenizing")
    ws_tk.append(["No", "Teks Asli (Deskripsi)", "Hasil Tokenizing", "Jumlah Token"])
    style_header_row(ws_tk, 1, 4)
    for i, row in enumerate(tokenized_list, start=1):
        tokens = row.get("tokenized", [])
        ws_tk.append([i, row.get("deskripsi", ""), str(tokens), len(tokens)])
        style_data_row(ws_tk, i + 1, 4, alternate=(i % 2 == 0))
        ws_tk.cell(row=i + 1, column=1).alignment = Alignment(horizontal="center", vertical="center")
        ws_tk.cell(row=i + 1, column=4).alignment = Alignment(horizontal="center", vertical="center")
    set_col_widths(ws_tk, [6, 60, 60, 14])
    freeze_and_filter(ws_tk)

    # ── Sheet 5: Normalization ─────────────────────────────────
    ws_nm = wb.create_sheet("4. Normalization")
    ws_nm.append(["No", "Teks Asli (Deskripsi)", "Sebelum Normalisasi", "Sesudah Normalisasi"])
    style_header_row(ws_nm, 1, 4)
    for i, (tk_row, nm_row) in enumerate(zip(tokenized_list, normalized_list), start=1):
        before = str(tk_row.get("tokenized", []))
        after  = str(nm_row.get("normalized", []))
        ws_nm.append([i, nm_row.get("deskripsi", ""), before, after])
        style_data_row(ws_nm, i + 1, 4, alternate=(i % 2 == 0))
        ws_nm.cell(row=i + 1, column=1).alignment = Alignment(horizontal="center", vertical="center")
    set_col_widths(ws_nm, [6, 60, 55, 55])
    freeze_and_filter(ws_nm)

    # ── Sheet 6: Stopword Removal ──────────────────────────────
    ws_sw = wb.create_sheet("5. Stopword Removal")
    ws_sw.append(["No", "Teks Asli (Deskripsi)", "Sebelum Stopword", "Sesudah Stopword", "Kata Dihapus"])
    style_header_row(ws_sw, 1, 5)
    for i, (nm_row, sw_row) in enumerate(zip(normalized_list, stop_removed_list), start=1):
        before_tokens = set(nm_row.get("normalized", []))
        after_tokens  = set(sw_row.get("stop_removed", []))
        removed       = sorted(before_tokens - after_tokens)
        ws_sw.append([
            i,
            sw_row.get("deskripsi", ""),
            " ".join(nm_row.get("normalized", [])),
            " ".join(sw_row.get("stop_removed", [])),
            ", ".join(removed) if removed else "-",
        ])
        style_data_row(ws_sw, i + 1, 5, alternate=(i % 2 == 0))
        ws_sw.cell(row=i + 1, column=1).alignment = Alignment(horizontal="center", vertical="center")
    set_col_widths(ws_sw, [6, 55, 50, 50, 35])
    freeze_and_filter(ws_sw)

    # ── Sheet 7: Stemming ──────────────────────────────────────
    ws_st = wb.create_sheet("6. Stemming")
    ws_st.append(["No", "Teks Asli (Deskripsi)", "Sebelum Stemming", "Sesudah Stemming"])
    style_header_row(ws_st, 1, 4)
    for i, (sw_row, st_row) in enumerate(zip(stop_removed_list, stemmed_list), start=1):
        ws_st.append([
            i,
            st_row.get("deskripsi", ""),
            " ".join(sw_row.get("stop_removed", [])),
            " ".join(st_row.get("stemmed", [])),
        ])
        style_data_row(ws_st, i + 1, 4, alternate=(i % 2 == 0))
        ws_st.cell(row=i + 1, column=1).alignment = Alignment(horizontal="center", vertical="center")
    set_col_widths(ws_st, [6, 60, 55, 55])
    freeze_and_filter(ws_st)

    # ── Sheet 8: Final Result ──────────────────────────────────
    ws_fn = wb.create_sheet("Final Result")
    ws_fn.append(["No", "Nama", "No WA", "Deskripsi Asli", "Kategori", "Teks Final (Siap Model)"])
    style_header_row(ws_fn, 1, 6)
    for i, item in enumerate(final_data, start=1):
        kategori = item.get("kategori_prediksi") or item.get("Kategori") or item.get("kategori") or "-"
        ws_fn.append([
            i,
            item.get("nama", ""),
            str(item.get("no_wa", "")).replace("@c.us", ""),
            item.get("deskripsi", ""),
            kategori,
            item.get("final_text", ""),
        ])
        style_data_row(ws_fn, i + 1, 6, alternate=(i % 2 == 0))
        ws_fn.cell(row=i + 1, column=1).alignment = Alignment(horizontal="center", vertical="center")
    set_col_widths(ws_fn, [6, 20, 18, 60, 18, 55])
    freeze_and_filter(ws_fn)

    wb.save(output_path)
    print(f"[OK] File Excel berhasil disimpan: {output_path}")
    print(f"     Sheet: Ringkasan | 1.Cleaning | 2.Casefolding | 3.Tokenizing | 4.Normalization | 5.Stopword | 6.Stemming | Final Result")
    return output_path

# =====================================================
# 6. TRAINING
# =====================================================
def train_model():
    print("[*] Memulai proses pelatihan model...")

    data = load_json(DATASET_BERLABEL_PATH)
    print(f"[*] Jumlah data latih: {len(data)}")

    data = preprocess_pipeline(data, save_files=True, append_files=False)

    df = pd.DataFrame(data)

    # DEBUG
    print(f"Total sebelum filter kosong : {len(df)}")
    df = df[df["final_text"].str.strip() != ""]
    print(f"Total sesudah filter kosong : {len(df)}")

    X_text    = df["final_text"]
    label_col = "Kategori" if "Kategori" in df.columns else "kategori"
    y         = df[label_col]

    print(f"Jumlah label unik           : {y.nunique()} → {sorted(y.unique())}")

    label_encoder = LabelEncoder()
    y_encoded     = label_encoder.fit_transform(y)

    # TF-IDF dengan bigram dan pembatasan fitur
    vectorizer = TfidfVectorizer(
        max_features=5000,
        min_df=2,
        max_df=0.95,
        ngram_range=(1, 2),
    )
    X_tfidf = vectorizer.fit_transform(X_text)
    print(f"Shape TF-IDF                : {X_tfidf.shape}")
    # TIDAK disimpan ke disk — matriks TF-IDF tidak diperlukan saat inferensi

    # Seleksi fitur dengan SelectKBest + chi2 (lebih cepat & hemat RAM)
    selector   = SelectKBest(score_func=chi2, k=min(1000, X_tfidf.shape[1]))
    X_selected = selector.fit_transform(X_tfidf, y_encoded)
    print(f"Shape setelah seleksi fitur : {X_selected.shape}")

    print(f"\nJumlah data awal  : {len(df)}")
    print(f"Jumlah final_text : {len(X_text)}")
    print(f"Jumlah label      : {len(y)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X_selected, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"Train             : {len(y_train)}")
    print(f"Test              : {len(y_test)}")

    model = RandomForestClassifier(
        n_estimators=500,
        max_depth=30,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42,
        oob_score=True,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print(f"\nJumlah prediksi   : {len(y_pred)}")
    print(f"Jumlah label test : {len(y_test)}")

    print("\n=== HASIL EVALUASI MODEL ===")
    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted")
    rec  = recall_score(y_test, y_pred, average="weighted")
    f1   = f1_score(y_test, y_pred, average="weighted")
    print(f"Accuracy  : {acc}")
    print(f"Precision : {prec}")
    print(f"Recall    : {rec}")
    print(f"F1-Score  : {f1}")
    print(f"OOB Score : {model.oob_score_}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))

    # Cross Validation 5-fold
    print("\n[*] Menjalankan Cross Validation 5-fold (n_jobs=-1)...")
    cv_scores = cross_val_score(
        model, X_selected, y_encoded, cv=5, scoring="accuracy", n_jobs=-1
    )
    print(f"CV Scores : {cv_scores}")
    print(f"CV Mean   : {cv_scores.mean():.4f}  ±  {cv_scores.std():.4f}")

    joblib.dump(model,         MODEL_PATH)
    joblib.dump(vectorizer,    VECTORIZER_PATH)
    joblib.dump(selector,      SELECTOR_PATH)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)
    print(f"\n[OK] Model berhasil disimpan di: {MODEL_PATH}")

    # Simpan hasil evaluasi untuk frontend (halaman Statistik)
    # Hitung per-class metrics dari y_test (data test 120)
    cm = confusion_matrix(y_test, y_pred)
    classes = label_encoder.classes_.tolist()
    per_class = {}
    for idx, cat in enumerate(classes):
        tp = int(cm[idx, idx])
        fp = int(cm[:, idx].sum() - tp)
        fn = int(cm[idx, :].sum() - tp)
        prec_c = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec_c  = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1_c   = 2 * prec_c * rec_c / (prec_c + rec_c) if (prec_c + rec_c) > 0 else 0
        per_class[cat] = {
            "precision": round(prec_c, 4),
            "recall"   : round(rec_c,  4),
            "f1"       : round(f1_c,   4),
            "support"  : int(cm[idx, :].sum()),
            "tp": tp, "fp": fp, "fn": fn,
        }

    # Confusion matrix sebagai dict
    cm_dict = {}
    for i, actual in enumerate(classes):
        cm_dict[actual] = {}
        for j, pred_cat in enumerate(classes):
            cm_dict[actual][pred_cat] = int(cm[i, j])

    hasil_evaluasi = {
        "akurasi"      : round(acc,  4),
        "presisi"      : round(prec, 4),
        "recall"       : round(rec,  4),
        "f1_score"     : round(f1,   4),
        "oob_score"    : round(float(model.oob_score_), 4),
        "cv_mean"      : round(float(cv_scores.mean()), 4),
        "cv_std"       : round(float(cv_scores.std()),  4),
        "total_data"   : len(df),
        "data_train"   : len(y_train),
        "data_test"    : len(y_test),
        "jumlah_kelas" : int(y.nunique()),
        "kelas"        : sorted(y.unique().tolist()),
        "fitur_tfidf"  : int(X_tfidf.shape[1]),
        "fitur_selected": int(X_selected.shape[1]),
        "estimators"   : 500,
        "ngram_range"  : [1, 2],
        "perClass"     : per_class,
        "confusionMatrix": cm_dict,
    }
    save_json(hasil_evaluasi, os.path.join(DATA_DIR, "hasil_training.json"))
    print("[OK] Hasil evaluasi disimpan ke: hasil_training.json")

    # Simpan prediksi seluruh 400 data untuk frontend (halaman Data Pengaduan)
    all_pred   = model.predict(X_selected)
    all_proba  = model.predict_proba(X_selected).max(axis=1)
    hasil_semua = []
    data_list   = df.to_dict("records")
    for i, row in enumerate(data_list):
        hasil_semua.append({
            "nama"              : row.get("nama", ""),
            "no_wa"             : str(row.get("no_wa", "")).replace("@c.us", ""),
            "deskripsi"         : row.get("deskripsi", ""),
            "processed"         : row.get("final_text", ""),
            "label_asli"        : label_encoder.inverse_transform([y_encoded[i]])[0],
            "kategori_prediksi" : label_encoder.inverse_transform([all_pred[i]])[0],
            "confidence"        : round(float(all_proba[i]), 4),
            "timestamp"         : row.get("timestamp", "-"),
        })
    save_json(hasil_semua, FINAL_PROCESSED_PATH)
    print(f"[OK] {len(hasil_semua)} data prediksi disimpan ke: final_processed.json")

    # Export hasil preprocessing ke Excel
    export_preprocessing_to_excel(load_json(DATASET_BERLABEL_PATH), hasil_semua)

# =====================================================
# 7. PREDIKSI DATA BARU
# =====================================================
def _make_dedup_key(item):
    """Buat kunci unik dari kombinasi no_wa + deskripsi + timestamp."""
    return (
        str(item.get("no_wa", "")).strip(),
        str(item.get("deskripsi", "")).strip(),
        str(item.get("timestamp", "")).strip(),
    )


def predict_new_data():
    print("[ ] Memproses data baru...")

    if not os.path.exists(DATA_BARU_PATH):
        save_json([], HASIL_PREDIKSI_PATH)
        print("[!] data_baru.json tidak ditemukan")
        return

    data_baru = load_json(DATA_BARU_PATH)

    if len(data_baru) == 0:
        save_json([], HASIL_PREDIKSI_PATH)
        print("[*] data_baru.json kosong")
        return

    print(f"[*] Jumlah data baru ditemukan: {len(data_baru)}")

    # ── 1. Preprocessing + append ke history ──────────────────
    print(f"[ ] Menambahkan {len(data_baru)} data ke preprocessing history...")
    data_preprocessed = preprocess_pipeline(data_baru, save_files=True, append_files=True)
    print(f"[OK] Preprocessing history diperbarui.")

    # ── 2. Klasifikasi ─────────────────────────────────────────
    print("[ ] Melakukan klasifikasi...")
    model         = joblib.load(MODEL_PATH)
    vectorizer    = joblib.load(VECTORIZER_PATH)
    selector      = joblib.load(SELECTOR_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)

    df                = pd.DataFrame(data_preprocessed)
    X_text            = df["final_text"]
    X_tfidf           = vectorizer.transform(X_text)
    X_selected        = selector.transform(X_tfidf)
    predictions       = model.predict(X_selected)
    predicted_labels  = label_encoder.inverse_transform(predictions)
    probabilities     = model.predict_proba(X_selected)
    confidence_scores = probabilities.max(axis=1)

    # Bangun list hasil prediksi baru (format lengkap)
    hasil_baru = []
    for i, item in enumerate(data_baru):
        hasil_baru.append({
            "nama"              : item.get("nama", ""),
            "no_wa"             : str(item.get("no_wa", "")).replace("@c.us", ""),
            "deskripsi"         : item.get("deskripsi", ""),
            "processed"         : data_preprocessed[i].get("final_text", ""),
            "label_asli"        : "-",
            "kategori_prediksi" : predicted_labels[i],
            "confidence"        : round(float(confidence_scores[i]), 4),
            "timestamp"         : item.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        })

    # Simpan ke hasil_prediksi.json (sesi ini saja, tidak di-append)
    save_json(hasil_baru, HASIL_PREDIKSI_PATH)
    print(f"[OK] {len(hasil_baru)} hasil prediksi disimpan ke: {HASIL_PREDIKSI_PATH}")

    # ── 3. Append ke final_processed.json (dengan dedup) ──────
    print(f"[ ] Menambahkan {len(hasil_baru)} data ke final_processed.json...")

    existing_final = []
    if os.path.exists(FINAL_PROCESSED_PATH):
        existing_final = load_json(FINAL_PROCESSED_PATH)

    # Bangun set kunci dari data yang sudah ada
    existing_keys = {_make_dedup_key(rec) for rec in existing_final}

    ditambahkan = 0
    diskip      = 0
    for rec in hasil_baru:
        key = _make_dedup_key(rec)
        if key in existing_keys:
            diskip += 1
        else:
            existing_final.append(rec)
            existing_keys.add(key)
            ditambahkan += 1

    save_json(existing_final, FINAL_PROCESSED_PATH)

    if diskip > 0:
        print(f"[*] {diskip} data duplikat dilewati.")
    print(f"[ ] Menambahkan {ditambahkan} data ke final_processed.json")

    total_pengaduan = len(existing_final)
    print(f"[*] Total pengaduan saat ini: {total_pengaduan}")
    print("[OK] Sinkronisasi selesai")

    # ── 4. Kosongkan data_baru.json agar tidak diklasifikasi ulang ──
    save_json([], DATA_BARU_PATH)
    print("[OK] data_baru.json dikosongkan.")

# =====================================================
# 8. MAIN
# =====================================================
if __name__ == "__main__":
    print(f"[*] Project Root: {PROJECT_ROOT}")

    if not os.path.exists(DATASET_BERLABEL_PATH):
        print(f"[ERROR] Dataset berlabel tidak ditemukan: {DATASET_BERLABEL_PATH}")
        sys.exit(1)

    force_train   = "--train"  in sys.argv
    export_only   = "--export" in sys.argv

    if export_only:
        print("[*] Mode export Excel...")
        if os.path.exists(FINAL_PROCESSED_PATH):
            final_data = load_json(FINAL_PROCESSED_PATH)
            raw_data   = load_json(DATASET_BERLABEL_PATH)
            export_preprocessing_to_excel(raw_data, final_data)
        else:
            print("[!] final_processed.json belum ada. Jalankan training terlebih dahulu.")
            sys.exit(1)
    elif not os.path.exists(MODEL_PATH) or force_train:
        print("[*] Force retrain..." if force_train else "[*] Model belum ada. Melatih...")
        train_model()
        predict_new_data()
    else:
        print("[OK] Model sudah tersedia.")
        predict_new_data()

    print("[OK] Program selesai dijalankan.")
