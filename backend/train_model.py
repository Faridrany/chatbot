# backend/train_model.py
import json
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import os

def run_training():
    input_file = "data/data_tfidf_ready.json"
    
    print("🚀 === TAHAP 3: TRAINING MODEL ===")
    
    # Load data hasil TF-IDF
    try:
        df = pd.read_json(input_file)
        print(f"✅ Data TF-IDF dimuat: {len(df)} records")
    except FileNotFoundError:
        print(f"❌ File {input_file} tidak ditemukan! Jalankan tfidf_vectorizer.py dulu.")
        return
    
    # Load Vectorizer
    try:
        tfidf = pickle.load(open("model/tfidf.pkl", "rb"))
        X = tfidf.transform(df["text_cleaned"])
        y = df["kategori"]
        print("✅ TF-IDF Vectorizer dimuat")
    except FileNotFoundError:
        print("❌ TF-IDF Vectorizer tidak ditemukan!")
        return
    
    # Split Data 70:30
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    
    # Training Random Forest
    print("🎯 Training Random Forest...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    # Evaluasi cepat
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"📈 Train Accuracy: {train_score:.2%}")
    print(f"📈 Test Accuracy: {test_score:.2%}")
    
    # Simpan Model Final
    os.makedirs("model", exist_ok=True)
    pickle.dump(model, open("model/model_rf.pkl", "wb"))
    
    # Simpan Data Final untuk Frontend
    output_path = "frontend/public/data_kategorial.json"
    df.to_json(output_path, orient="records", indent=4)
    
    print(f"✅ Training selesai!")
    print(f"💾 Model: model/model_rf.pkl")
    print(f"💾 Data Final: {output_path}")

if __name__ == "__main__":
    run_training()