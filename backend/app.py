import streamlit as st
import pandas as pd
import json
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

# Import dari main.py kamu
from main import (
    preprocess_pipeline,
    train_model,
    predict_new_data,
    load_json,
    MODEL_PATH, VECTORIZER_PATH,
    SELECTOR_PATH, LABEL_ENCODER_PATH,
    FINAL_PROCESSED_PATH,
    DATASET_BERLABEL_PATH,
    DATA_BARU_PATH,
    CLEANED_PATH,
    CASEFOLDED_PATH,
    TOKENIZED_PATH,
    NORMALIZED_PATH,
    STOP_REMOVED_PATH,
    STEMMED_PATH
)

st.set_page_config(page_title="Klasifikasi Pengaduan", layout="wide")

st.title("📊 Sistem Klasifikasi Pengaduan Masyarakat")

# =====================================================
# SIDEBAR
# =====================================================
menu = st.sidebar.selectbox(
    "Menu",
    [
        "🏠 Dashboard",
        "⚙️ Preprocessing",
        "🤖 Training Model",
        "🔍 Prediksi",
        "📈 Visualisasi"
    ]
)

# =====================================================
# DASHBOARD
# =====================================================
if menu == "🏠 Dashboard":
    st.subheader("📌 Informasi Dataset")

    if os.path.exists(DATASET_BERLABEL_PATH):
        data = load_json(DATASET_BERLABEL_PATH)
        df = pd.DataFrame(data)
        st.write("Jumlah Data:", len(df))
        st.dataframe(df.head())

# =====================================================
# PREPROCESSING
# =====================================================
elif menu == "⚙️ Preprocessing":
    st.subheader("⚙️ Proses Preprocessing")

    if st.button("Jalankan Preprocessing"):
        data = load_json(DATASET_BERLABEL_PATH)
        hasil = preprocess_pipeline(data)
        st.success("Preprocessing selesai!")

    def tampilkan(path, title):
        if os.path.exists(path):
            data = load_json(path)
            df = pd.DataFrame(data)
            st.write(f"### {title} (5 Data Teratas)")
            st.dataframe(df.head())

    tampilkan(CLEANED_PATH, "Cleaning")
    tampilkan(CASEFOLDED_PATH, "Case Folding")
    tampilkan(TOKENIZED_PATH, "Tokenizing")
    tampilkan(NORMALIZED_PATH, "Normalisasi")
    tampilkan(STOP_REMOVED_PATH, "Stopword Removal")
    tampilkan(STEMMED_PATH, "Stemming")

# =====================================================
# TRAINING MODEL
# =====================================================
elif menu == "🤖 Training Model":
    st.subheader("🤖 Training Model")

    if st.button("Train Model"):
        train_model()
        st.success("Model berhasil dilatih!")

    # tampilkan evaluasi jika model ada
    if os.path.exists(MODEL_PATH):
        st.success("Model tersedia!")

        # Load data hasil preprocessing
        if os.path.exists(FINAL_PROCESSED_PATH):
            data = load_json(FINAL_PROCESSED_PATH)
            df = pd.DataFrame(data)

            st.write("### Distribusi Kategori")
            fig, ax = plt.subplots()
            df["Kategori"].value_counts().plot(kind="bar", ax=ax)
            st.pyplot(fig)

# =====================================================
# PREDIKSI
# =====================================================
elif menu == "🔍 Prediksi":
    st.subheader("🔍 Prediksi Data Baru")

    teks_input = st.text_area("Masukkan Pengaduan")

    if st.button("Prediksi"):
        if teks_input:
            data_baru = [{"deskripsi": teks_input}]

            # simpan sementara
            with open(DATA_BARU_PATH, "w") as f:
                json.dump(data_baru, f)

            predict_new_data()

            hasil = load_json("data/predictions/hasil_prediksi.json")
            st.success(f"Kategori: {hasil[0]['Kategori']}")
        else:
            st.warning("Masukkan teks dulu!")

# =====================================================
# VISUALISASI
# =====================================================
elif menu == "📈 Visualisasi":
    st.subheader("📈 Visualisasi Data")

    if os.path.exists(FINAL_PROCESSED_PATH):
        data = load_json(FINAL_PROCESSED_PATH)
        df = pd.DataFrame(data)

        st.write("### Jumlah Data per Kategori")
        fig, ax = plt.subplots()
        df["Kategori"].value_counts().plot(kind="bar", ax=ax)
        st.pyplot(fig)

        st.write("### Pie Chart")
        fig2, ax2 = plt.subplots()
        df["Kategori"].value_counts().plot(kind="pie", autopct='%1.1f%%', ax=ax2)
        st.pyplot(fig2)

    # TF-IDF
    if os.path.exists(VECTORIZER_PATH):
        st.write("### TF-IDF Features (Sample)")
        vectorizer = joblib.load(VECTORIZER_PATH)
        fitur = vectorizer.get_feature_names_out()
        st.write(fitur[:50])
