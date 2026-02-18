import re
import joblib
import json
import os
from datetime import datetime
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# ============================================================
# CONFIG
# ============================================================
BACKUP_PATH = "Dashboard/public/backup_pengaduan.json"
OUT_PATH = "Dashboard/public/data_kategorial.json"

MODEL_PATH = "model_rf.pkl"
VECTORIZER_PATH = "model_vectorizer.pkl"
ACCURACY_FILE = "accuracy.txt"

# ============================================================
# LOAD MODEL
# ============================================================
model = joblib.load(MODEL_PATH)
tfidf = joblib.load(VECTORIZER_PATH)

# ============================================================
# LOAD ACCURACY
# ============================================================
def load_accuracy():
    if not os.path.exists(ACCURACY_FILE):
        return None
    try:
        return float(open(ACCURACY_FILE).read().strip())
    except:
        return None

model_accuracy = load_accuracy()

# ============================================================
# PREPROCESSING
# ============================================================
stemmer = StemmerFactory().create_stemmer()
stopwords = set(StopWordRemoverFactory().get_stop_words())

def cleaning(text):
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    return text

def preprocess(text):
    text = cleaning(text)
    text = text.lower()
    text = re.sub(r"\s+", " ", text).strip()
    words = text.split()
    words = [w for w in words if w not in stopwords]
    words = [stemmer.stem(w) for w in words]
    return " ".join(words)

# ============================================================
# PREDICT CATEGORY
# ============================================================
def predict_category(text):
    processed = preprocess(text)
    vector = tfidf.transform([processed])
    pred = model.predict(vector)[0]
    return pred, processed

# ============================================================
# LOAD BACKUP
# ============================================================
def load_backup():
    if not os.path.exists(BACKUP_PATH):
        return []
    try:
        with open(BACKUP_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except:
        return []

# ============================================================
# SAVE RESULT
# ============================================================
def save_result_to_json(nama, no_wa, original, processed, kategori, accuracy):
    if not os.path.exists(OUT_PATH):
        existing = []
    else:
        try:
            content = open(OUT_PATH, "r", encoding="utf-8").read().strip()
            existing = json.loads(content) if content else []
        except:
            existing = []

    row = {
        "nama": nama,
        "no_wa": no_wa,
        "deskripsi": original,
        "processed": processed,
        "kategori_prediksi": kategori,
        "akurasi_model": accuracy,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    existing.append(row)

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=4)

# ============================================================
# HAPUS PENGADUAN YANG SUDAH DIPROSES
# ============================================================
def remove_processed_report(index):
    data = load_backup()
    if 0 <= index < len(data):
        data.pop(index)
        with open(BACKUP_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

# ============================================================
# MAIN LOOP
# ============================================================
if __name__ == "__main__":
    while True:
        backup = load_backup()
        if not backup:
            print("✅ Tidak ada laporan baru. Selesai memproses semua pengaduan.")
            break

        latest = backup[0]  # ambil pengaduan pertama
        nama = latest.get("nama", "Anonim")
        no_wa = latest.get("no_wa", "")
        deskripsi = latest.get("deskripsi", "")

        kategori, processed = predict_category(deskripsi)
        save_result_to_json(nama, no_wa, deskripsi, processed, kategori, model_accuracy)
        remove_processed_report(0)

        print("===================================")
        print("✔ Pengaduan diproses & disimpan!")
        print(f"Nama       : {nama}")
        print(f"No.WA      : {no_wa}")
        print(f"Kategori   : {kategori}")
        print("===================================")

        # Konfirmasi lanjut
        lanjut = input("Apakah ada pengaduan berikutnya yang ingin diproses? (y/n): ").strip().lower()
        if lanjut != "y":
            print("🔹 Proses dihentikan oleh operator.")
            break
