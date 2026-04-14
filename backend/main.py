import os
import re
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectFromModel
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    classification_report,
    confusion_matrix
)
from sklearn.preprocessing import LabelEncoder
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# =====================================================
# 1. INISIALISASI PATH PROYEK
# =====================================================
print("=== Sistem Klasifikasi Pengaduan Masyarakat ===")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))

DATA_DIR = os.path.join(PROJECT_ROOT, "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
FEATURE_DIR = os.path.join(DATA_DIR, "features")
PREDICTION_DIR = os.path.join(DATA_DIR, "predictions")
MODEL_DIR = os.path.join(PROJECT_ROOT, "model")

# Membuat folder jika belum ada
for path in [RAW_DIR, PROCESSED_DIR, FEATURE_DIR, PREDICTION_DIR, MODEL_DIR]:
    os.makedirs(path, exist_ok=True)

# Path dataset
DATASET_BERLABEL_PATH = os.path.join(RAW_DIR, "dataset_berlabel.json")
DATA_BARU_PATH = os.path.join(RAW_DIR, "data_baru.json")

# Path hasil preprocessing
CLEANED_PATH = os.path.join(PROCESSED_DIR, "cleaned.json")
CASEFOLDED_PATH = os.path.join(PROCESSED_DIR, "casefolded.json")
TOKENIZED_PATH = os.path.join(PROCESSED_DIR, "tokenized.json")
NORMALIZED_PATH = os.path.join(PROCESSED_DIR, "normalized.json")
STOP_REMOVED_PATH = os.path.join(PROCESSED_DIR, "stop_removed.json")
STEMMED_PATH = os.path.join(PROCESSED_DIR, "stemmed.json")
FINAL_PROCESSED_PATH = os.path.join(PROCESSED_DIR, "final_processed.json")

# Path model dan fitur
MODEL_PATH = os.path.join(MODEL_DIR, "random_forest_model.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
SELECTOR_PATH = os.path.join(MODEL_DIR, "feature_selector.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
TFIDF_FEATURES_PATH = os.path.join(FEATURE_DIR, "tfidf_features.pkl")

# Path hasil prediksi
HASIL_PREDIKSI_PATH = os.path.join(PREDICTION_DIR, "hasil_prediksi.json")

# =====================================================
# 2. INISIALISASI SASTRAWI
# =====================================================
stemmer = StemmerFactory().create_stemmer()
stopword_remover = StopWordRemoverFactory().create_stop_word_remover()

# Kamus normalisasi kata tidak baku
NORMALIZATION_DICT = {
    "gk": "tidak",
    "nggak": "tidak",
    "tdk": "tidak",
    "rt": "rukun tetangga",
    "rw": "rukun warga",
    "pju": "penerangan jalan umum"
}

# =====================================================
# 3. FUNGSI UTILITAS
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
# 4. FUNGSI PREPROCESSING
# =====================================================
def cleaning(text):
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def case_folding(text):
    return text.lower()

def tokenization(text):
    return text.split()

def normalization(tokens):
    return [NORMALIZATION_DICT.get(token, token) for token in tokens]

def stopword_removal(tokens):
    text = " ".join(tokens)
    text = stopword_remover.remove(text)
    return text.split()

def stemming(tokens):
    text = " ".join(tokens)
    text = stemmer.stem(text)
    return text.split()

def preprocess_pipeline(data):
    print("🔄 Memulai proses preprocessing...")

    cleaned_data = []
    casefolded_data = []
    tokenized_data = []
    normalized_data = []
    stop_removed_data = []
    stemmed_data = []
    final_data = []

    for item in data:
        text = item.get("deskripsi", "")

        cleaned = cleaning(text)
        cleaned_data.append({**item, "cleaned": cleaned})

        casefolded = case_folding(cleaned)
        casefolded_data.append({**item, "casefolded": casefolded})

        tokens = tokenization(casefolded)
        tokenized_data.append({**item, "tokenized": tokens})

        normalized = normalization(tokens)
        normalized_data.append({**item, "normalized": normalized})

        stop_removed = stopword_removal(normalized)
        stop_removed_data.append({**item, "stop_removed": stop_removed})

        stemmed = stemming(stop_removed)
        stemmed_data.append({**item, "stemmed": stemmed})

        final_text = " ".join(stemmed)
        final_data.append({**item, "final_text": final_text})

    # Simpan setiap tahap
    save_json(cleaned_data, CLEANED_PATH)
    save_json(casefolded_data, CASEFOLDED_PATH)
    save_json(tokenized_data, TOKENIZED_PATH)
    save_json(normalized_data, NORMALIZED_PATH)
    save_json(stop_removed_data, STOP_REMOVED_PATH)
    save_json(stemmed_data, STEMMED_PATH)
    save_json(final_data, FINAL_PROCESSED_PATH)

    print("✅ Preprocessing selesai.")
    return final_data

# =====================================================
# 5. PELATIHAN MODEL
# =====================================================
def train_model():
    print("🚀 Memulai proses pelatihan model...")

    data = load_json(DATASET_BERLABEL_PATH)
    print(f"📊 Jumlah data latih: {len(data)}")

    data = preprocess_pipeline(data)

    df = pd.DataFrame(data)
    X_text = df["final_text"]
    y = df["Kategori"]

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    vectorizer = TfidfVectorizer()
    X_tfidf = vectorizer.fit_transform(X_text)
    joblib.dump(X_tfidf, TFIDF_FEATURES_PATH)

    selector_model = RandomForestClassifier(n_estimators=100, random_state=42)
    selector_model.fit(X_tfidf, y_encoded)
    selector = SelectFromModel(selector_model, threshold=0.001, prefit=True)
    X_selected = selector.transform(X_tfidf)

    X_train, X_test, y_train, y_test = train_test_split(
        X_selected, y_encoded, test_size=0.3,
        random_state=42, stratify=y_encoded
    )

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("\n=== HASIL EVALUASI MODEL ===")
    print("Accuracy :", accuracy_score(y_test, y_pred))
    print("Precision:", precision_score(y_test, y_pred, average="weighted"))
    print("Recall   :", recall_score(y_test, y_pred, average="weighted"))
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))

    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(selector, SELECTOR_PATH)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)

    print(f"\n✅ Model berhasil disimpan di: {MODEL_PATH}")

# =====================================================
# 6. PREDIKSI DATA BARU
# =====================================================
def predict_new_data():
    print("🔍 Memproses prediksi data baru...")

    data_baru = load_json(DATA_BARU_PATH)
    print(f"📊 Jumlah data baru: {len(data_baru)}")

    data_baru = preprocess_pipeline(data_baru)

    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    selector = joblib.load(SELECTOR_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)

    df = pd.DataFrame(data_baru)
    X_text = df["final_text"]

    X_tfidf = vectorizer.transform(X_text)
    X_selected = selector.transform(X_tfidf)

    predictions = model.predict(X_selected)
    predicted_labels = label_encoder.inverse_transform(predictions)

    for i, item in enumerate(data_baru):
        item["Kategori"] = predicted_labels[i]

    save_json(data_baru, HASIL_PREDIKSI_PATH)
    print(f"✅ Hasil prediksi disimpan di: {HASIL_PREDIKSI_PATH}")

# =====================================================
# 7. MAIN PROGRAM
# =====================================================
if __name__ == "__main__":
    print(f"📁 Project Root: {PROJECT_ROOT}")

    if not os.path.exists(DATASET_BERLABEL_PATH):
        print(f"❌ Dataset berlabel tidak ditemukan di: {DATASET_BERLABEL_PATH}")
        exit()

    if not os.path.exists(MODEL_PATH):
        print("📌 Model belum ada. Memulai proses pelatihan...")
        train_model()
    else:
        print("✅ Model sudah tersedia.")
        if os.path.exists(DATA_BARU_PATH):
            data_baru = load_json(DATA_BARU_PATH)
            if len(data_baru) > 0:
                predict_new_data()
            else:
                print("⚠️ data_baru.json kosong.")
        else:
            print("⚠️ File data_baru.json tidak ditemukan.")

    print("🎉 Program selesai dijalankan.")