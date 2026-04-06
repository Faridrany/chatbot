# backend/evaluate.py
import pickle
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

def run_evaluation():
    try:
        df = pd.read_json("data/data_tfidf_ready.json")
        model = pickle.load(open("model/model_rf.pkl", "rb"))
        tfidf = pickle.load(open("model/tfidf.pkl", "rb"))
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print("Jalankan pipeline lengkap terlebih dahulu!")
        return

    X = tfidf.transform(df["text_cleaned"])
    y_true = df["kategori"]
    y_pred = model.predict(X)

    print("=== EVALUASI MODEL RANDOM FOREST ===")
    print(f"Total Data: {len(df)} samples")
    print(f"Accuracy: {accuracy_score(y_true, y_pred):.2%}")
    
    print("\n--- Classification Report ---")
    print(classification_report(y_true, y_pred))
    
    print("\n--- Confusion Matrix ---")
    print(confusion_matrix(y_true, y_pred))

if __name__ == "__main__":
    run_evaluation()