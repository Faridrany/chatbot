# backend/tfidf_vectorizer.py
import json
import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
import os

def run_tfidf_vectorization():
    input_file = "data/data_preprocessed.json"
    output_file = "data/data_tfidf_ready.json"
    
    print("🚀 === TAHAP 2: TF-IDF VECTORIZATION ===")
    
    # Load data hasil preprocessing
    try:
        df = pd.read_json(input_file)
        print(f"✅ Data preprocessing dimuat: {len(df)} records")
    except FileNotFoundError:
        print(f"❌ File {input_file} tidak ditemukan! Jalankan preprocessing.py dulu.")
        return
    
    # Buat TF-IDF Vectorizer (max_features=1000 untuk efisiensi)
    vectorizer = TfidfVectorizer(
        max_features=1000,
        min_df=2,
        max_df=0.8,
        ngram_range=(1, 2)
    )
    
    # Transform text_cleaned ke TF-IDF
    X = vectorizer.fit_transform(df['text_cleaned'].fillna(''))
    
    # Tambahkan kolom TF-IDF sparse ke dataframe (untuk tracking)
    df['tfidf_sparse'] = [str(list(row.data)) for row in X]
    
    # Simpan data hasil TF-IDF
    df.to_json(output_file, orient="records", indent=2)
    
    # Simpan Vectorizer untuk prediksi
    os.makedirs("model", exist_ok=True)
    pickle.dump(vectorizer, open("model/tfidf.pkl", "wb"))
    
    print(f"✅ TF-IDF selesai!")
    print(f"📊 Vocabulary size: {len(vectorizer.vocabulary_)} features")
    print(f"📊 Data siap training: {len(df)} records")
    print(f"💾 Data disimpan: {output_file}")
    print(f"💾 Vectorizer: model/tfidf.pkl")
    
    return df

if __name__ == "__main__":
    run_tfidf_vectorization()