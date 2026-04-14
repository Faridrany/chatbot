from datetime import datetime

class ComplaintClassifier:
    def __init__(self):
        if os.path.exists("model/model_rf.pkl") and os.path.exists("model/tfidf.pkl"):
            self.model = pickle.load(open("model/model_rf.pkl", "rb"))
            self.tfidf = pickle.load(open("model/tfidf.pkl", "rb"))
            print("✅ Model AI Berhasil Dimuat")
        else:
            raise Exception("❌ Model belum tersedia. Jalankan pipeline lengkap!")

    def predict(self, text, record=None):
        cleaned_text = preprocess(text)
        vector = self.tfidf.transform([cleaned_text])
        prediction = self.model.predict(vector)[0]
        probabilities = self.model.predict_proba(vector)
        confidence = probabilities.max()

        result = {
            "text_original": text,
            "text_cleaned": cleaned_text,
            "predicted_category": prediction,
            "confidence": float(confidence),
            "processing_history": [
                {
                    "stage": "preprocessing",
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "stage": "classification",
                    "model": "RandomForest",
                    "timestamp": datetime.now().isoformat()
                }
            ]
        }

        return result