# backend/predict.py
import pickle
import os
import re
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# Inisialisasi Sastrawi (sama persis seperti preprocessing)
factory = StemmerFactory()
stemmer = factory.create_stemmer()
stop_factory = StopWordRemoverFactory()
stopwords = stop_factory.get_stop_words()

norm_dict = {
    "gk": "tidak", "rt": "rukun tetangga", "rw": "rukun warga",
    "jl": "jalan", "yg": "yang", "tdk": "tidak", "ga": "tidak"
}

def preprocess(text):
    text = re.sub(r"http\S+|www\S+|https\S+", "", text, flags=re.MULTILINE)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = text.lower()
    tokens = text.split()
    tokens = [norm_dict.get(w, w) for w in tokens]
    tokens = [w for w in tokens if w not in stopwords]
    tokens = [stemmer.stem(w) for w in tokens]
    return " ".join(tokens)

class ComplaintClassifier:
    def __init__(self):
        if os.path.exists("model/model_rf.pkl") and os.path.exists("model/tfidf.pkl"):
            self.model = pickle.load(open("model/model_rf.pkl", "rb"))
            self.tfidf = pickle.load(open("model/tfidf.pkl", "rb"))
            print("✅ Model AI Berhasil Dimuat")
        else:
            raise Exception("❌ Model belum tersedia. Jalankan pipeline lengkap!")

    def predict(self, text):
        cleaned_text = preprocess(text)
        vector = self.tfidf.transform([cleaned_text])
        prediction = self.model.predict(vector)[0]
        probabilities = self.model.predict_proba(vector)
        confidence = probabilities.max()

        return {
            "input": text,
            "cleaned": cleaned_text,
            "kategori": prediction,
            "confidence": f"{confidence*100:.2f}%"
        }

if __name__ == "__main__":
    clf = ComplaintClassifier()
    test_cases = [
        "Ada jalan rusak dan berlubang di jalan poros samboja",
        "Terjadi pencurian di area perumahan warga malam tadi",
        "Sampah menumpuk di pinggir jalan belum diangkut"
    ]
    
    print("\n--- HASIL UJI COBA PREDIKSI ---")
    for text in test_cases:
        result = clf.predict(text)
        print(f"Pesan: {result['input']}")
        print(f"Hasil: {result['kategori']} ({result['confidence']})")
        print("-" * 50)