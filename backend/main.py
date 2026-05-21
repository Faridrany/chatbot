import os
import re
import sys
import json
import joblib
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectFromModel
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    classification_report, confusion_matrix
)
from sklearn.preprocessing import LabelEncoder
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

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

for p in [RAW_DIR, PROCESSED_DIR, FEATURE_DIR, PREDICTION_DIR, MODEL_DIR]:
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
TFIDF_FEATURES_PATH   = os.path.join(FEATURE_DIR,  "tfidf_features.pkl")
HASIL_PREDIKSI_PATH   = os.path.join(PREDICTION_DIR,"hasil_prediksi.json")

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
# =====================================================
def cleaning(text):
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def case_folding(text):   return text.lower()
def tokenization(text):   return text.split()
def normalization(tokens): return [NORMALIZATION_DICT.get(t, t) for t in tokens]
def stopword_removal(tokens): return stopword_remover.remove(" ".join(tokens)).split()
def stemming(tokens):     return stemmer.stem(" ".join(tokens)).split()

def preprocess_pipeline(data, save_files=True, append_files=False):
    print("🔄 Memulai proses preprocessing...")

    cleaned_data = []; casefolded_data = []; tokenized_data = []
    normalized_data = []; stop_removed_data = []; stemmed_data = []
    final_data = []

    for item in data:
        text = str(item.get("deskripsi", ""))

        cleaned = cleaning(text)
        cleaned_data.append({"deskripsi": text, "hasil": cleaned})

        casefolded = case_folding(cleaned)
        casefolded_data.append({"deskripsi": text, "hasil": casefolded})

        tokens = tokenization(casefolded)
        tokenized_data.append({"deskripsi": text, "hasil": tokens})

        normalized = normalization(tokens)
        normalized_data.append({"deskripsi": text, "hasil": normalized})

        stop_removed = stopword_removal(normalized)
        stop_removed_data.append({"deskripsi": text, "hasil": stop_removed})

        stemmed = stemming(stop_removed)
        stemmed_data.append({"deskripsi": text, "hasil": stemmed})

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
        save_json(load_or_empty(FINAL_PROCESSED_PATH) + final_data,        FINAL_PROCESSED_PATH)

    print("✅ Preprocessing selesai.")
    return final_data

# =====================================================
# 5. TRAINING
# =====================================================
def train_model():
    print("🚀 Memulai proses pelatihan model...")

    data = load_json(DATASET_BERLABEL_PATH)
    print(f"📊 Jumlah data latih: {len(data)}")

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

    vectorizer = TfidfVectorizer()
    X_tfidf    = vectorizer.fit_transform(X_text)
    print(f"Shape TF-IDF                : {X_tfidf.shape}")
    joblib.dump(X_tfidf, TFIDF_FEATURES_PATH)

    selector_model = RandomForestClassifier(n_estimators=100, random_state=42)
    selector_model.fit(X_tfidf, y_encoded)
    selector   = SelectFromModel(selector_model, threshold=0.001, prefit=True)
    X_selected = selector.transform(X_tfidf)
    print(f"Shape setelah seleksi fitur : {X_selected.shape}")

    print(f"\nJumlah data awal  : {len(df)}")
    print(f"Jumlah final_text : {len(X_text)}")
    print(f"Jumlah label      : {len(y)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X_selected, y_encoded, test_size=0.3, random_state=42, stratify=y_encoded
    )
    print(f"Train             : {len(y_train)}")
    print(f"Test              : {len(y_test)}")

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print(f"\nJumlah prediksi   : {len(y_pred)}")
    print(f"Jumlah label test : {len(y_test)}")

    print("\n=== HASIL EVALUASI MODEL ===")
    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted")
    rec  = recall_score(y_test, y_pred, average="weighted")
    print("Accuracy :", acc)
    print("Precision:", prec)
    print("Recall   :", rec)
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))

    joblib.dump(model,         MODEL_PATH)
    joblib.dump(vectorizer,    VECTORIZER_PATH)
    joblib.dump(selector,      SELECTOR_PATH)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)
    print(f"\n✅ Model berhasil disimpan di: {MODEL_PATH}")

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
        "total_data"   : len(df),
        "data_train"   : len(y_train),
        "data_test"    : len(y_test),
        "jumlah_kelas" : int(y.nunique()),
        "kelas"        : sorted(y.unique().tolist()),
        "fitur_tfidf"  : int(X_tfidf.shape[1]),
        "estimators"   : 200,
        "perClass"     : per_class,
        "confusionMatrix": cm_dict,
    }
    save_json(hasil_evaluasi, os.path.join(DATA_DIR, "hasil_training.json"))
    print("✅ Hasil evaluasi disimpan ke: hasil_training.json")

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
            "akurasi_model"     : round(float(all_proba[i]), 4),
            "timestamp"         : row.get("timestamp", "-"),
        })
    save_json(hasil_semua, FINAL_PROCESSED_PATH)
    print(f"✅ {len(hasil_semua)} data prediksi disimpan ke: final_processed.json")

# =====================================================
# 6. PREDIKSI DATA BARU
# =====================================================
def predict_new_data():
    print("🔍 Memproses prediksi data baru...")

    if not os.path.exists(DATA_BARU_PATH):
        save_json([], HASIL_PREDIKSI_PATH)
        print("⚠️ data_baru.json tidak ditemukan")
        return

    data_baru = load_json(DATA_BARU_PATH)

    if len(data_baru) == 0:
        save_json([], HASIL_PREDIKSI_PATH)
        print("🧹 data_baru.json kosong")
        return

    print(f"📊 Jumlah data baru: {len(data_baru)}")

    data_preprocessed = preprocess_pipeline(data_baru, save_files=True, append_files=True)

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

    hasil = []
    for i, item in enumerate(data_baru):
        hasil.append({
            "nama"              : item.get("nama", ""),
            "no_wa"             : item.get("no_wa", ""),
            "deskripsi"         : item.get("deskripsi", ""),
            "processed"         : data_preprocessed[i].get("final_text", ""),
            "kategori_prediksi" : predicted_labels[i],
            "akurasi_model"     : round(float(confidence_scores[i]), 4),
            "timestamp"         : item.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        })

    save_json(hasil, HASIL_PREDIKSI_PATH)
    print(f"✅ {len(hasil)} data prediksi disimpan ke: {HASIL_PREDIKSI_PATH}")

# =====================================================
# 7. MAIN
# =====================================================
if __name__ == "__main__":
    print(f"📁 Project Root: {PROJECT_ROOT}")

    if not os.path.exists(DATASET_BERLABEL_PATH):
        print(f"❌ Dataset berlabel tidak ditemukan: {DATASET_BERLABEL_PATH}")
        sys.exit(1)

    force_train = "--train" in sys.argv

    if not os.path.exists(MODEL_PATH) or force_train:
        print("🔁 Force retrain..." if force_train else "📌 Model belum ada. Melatih...")
        train_model()
        predict_new_data()
    else:
        print("✅ Model sudah tersedia.")
        print("🔄 Update pipeline dari dataset_berlabel...")
        preprocess_pipeline(load_json(DATASET_BERLABEL_PATH), save_files=True, append_files=False)
        predict_new_data()

    print("🎉 Program selesai dijalankan.")
