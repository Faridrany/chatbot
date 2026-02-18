import streamlit as st
import json
import os
import re
import joblib
from datetime import datetime
from streamlit_autorefresh import st_autorefresh
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory
import pandas as pd

# ============================================================
# PATH CONFIG
# ============================================================
BACKUP_PATH = "Dashboard/public/backup_pengaduan.json"
DATA_PATH = "Dashboard/public/data_kategorial.json"
MODEL_PATH = "model_rf.pkl"
VECTORIZER_PATH = "model_vectorizer.pkl"
ACCURACY_FILE = "accuracy.txt"

# ============================================================
# AUTO REFRESH
# ============================================================
st_autorefresh(interval=5000, limit=None, key="autorefresh")

# ============================================================
# LOAD MODEL & TF-IDF
# ============================================================
model = joblib.load(MODEL_PATH)
tfidf = joblib.load(VECTORIZER_PATH)

# Load accuracy
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

def predict_category(text):
    processed = preprocess(text)
    vector = tfidf.transform([processed])
    pred = model.predict(vector)[0]
    return pred, processed

# ============================================================
# LOAD DATA
# ============================================================
def load_backup():
    if os.path.exists(BACKUP_PATH):
        try:
            with open(BACKUP_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []
    return []

def load_processed():
    if os.path.exists(DATA_PATH):
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []
    return []

def save_result_to_json(nama, no_wa, original, processed, kategori, accuracy):
    existing = load_processed()
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
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=4)

def remove_processed_report(index):
    data = load_backup()
    if 0 <= index < len(data):
        data.pop(index)
        with open(BACKUP_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

# ============================================================
# STREAMLIT UI
# ============================================================
st.set_page_config(page_title="Dashboard Pengaduan", layout="wide")
st.title("📊 Dashboard Pengaduan & Kategori Prediksi")

backup = load_backup()
processed_all = load_processed()

# ======================
# Statistik kategori
# ======================
if processed_all:
    df = pd.DataFrame(processed_all)
    kategori_counts = df['kategori_prediksi'].value_counts()
    st.markdown("### 📈 Statistik Kategori Pengaduan")
    st.bar_chart(kategori_counts)
    st.write("Jumlah pengaduan per kategori:")
    st.table(kategori_counts)
else:
    st.info("📭 Belum ada pengaduan yang diproses untuk statistik kategori.")

# ======================
# Filter kategori
# ======================
kategori_list = ["Semua"] + sorted(list({item.get("kategori_prediksi","") for item in processed_all}))
selected_kategori = st.selectbox("Filter Pengaduan Berdasarkan Kategori:", kategori_list)

if selected_kategori != "Semua":
    processed = [item for item in processed_all if item.get("kategori_prediksi") == selected_kategori]
else:
    processed = processed_all

# ======================
# Dua Kolom: Pengaduan Baru dan Diproses
# ======================
col1, col2 = st.columns(2)

# -------------------
# Kolom Kiri: Pengaduan Baru
# -------------------
with col1:
    st.markdown("### 📨 Pengaduan Baru (Belum Diproses)")
    if backup:
        for i, item in enumerate(backup):
            st.text_area(
                f"{i+1}. {item.get('nama','Anonim')} ({item.get('no_wa','')})",
                item.get("deskripsi", ""),
                height=120,
                key=f"backup_{i}"
            )
        # Tombol proses pengaduan baru
        if st.button("▶ Proses Pengaduan Baru"):
            latest = backup[0]  # ambil pengaduan pertama
            nama = latest.get("nama", "Anonim")
            no_wa = latest.get("no_wa", "")
            deskripsi = latest.get("deskripsi", "")
            kategori, processed_text = predict_category(deskripsi)
            save_result_to_json(nama, no_wa, deskripsi, processed_text, kategori, model_accuracy)
            remove_processed_report(0)
            st.success(f"✔ Pengaduan '{nama}' berhasil diproses ke kategori {kategori}.")
            st.experimental_rerun()  # refresh dashboard
    else:
        st.info("✅ Tidak ada pengaduan baru.")

# -------------------
# Kolom Kanan: Pengaduan Diproses
# -------------------
with col2:
    st.markdown(f"### 📂 Pengaduan yang Sudah Diproses (Filter: {selected_kategori})")
    if processed:
        for i, item in enumerate(processed[::-1]):  # terbaru di atas
            st.write(f"**{item.get('nama','Anonim')}** | {item.get('no_wa','')} | {item.get('timestamp','')}")
            st.write(f"Deskripsi Awal: {item.get('deskripsi','')}")
            st.write(f"Deskripsi Proses: {item.get('processed','')}")
            st.write(f"Kategori Prediksi: **{item.get('kategori_prediksi','')}**")
            st.write(f"Akurasi Model: {item.get('akurasi_model','')}")
            st.markdown("---")
    else:
        st.info("📭 Tidak ada pengaduan untuk kategori ini.")

# -------------------
# Informasi Ringkas
# -------------------
st.markdown("### ℹ️ Informasi")
st.write(f"Jumlah pengaduan baru: {len(backup)}")
st.write(f"Jumlah pengaduan diproses (filter '{selected_kategori}'): {len(processed)}")
st.write(f"Jumlah total pengaduan diproses: {len(processed_all)}")
