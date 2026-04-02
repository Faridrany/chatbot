import pickle
from preprocessing import preprocess

model = pickle.load(open("model/model_rf.pkl", "rb"))
tfidf = pickle.load(open("model/tfidf.pkl", "rb"))

def predict_text(text):
    processed = preprocess(text)
    vector = tfidf.transform([processed])
    pred = model.predict(vector)[0]
    prob = model.predict_proba(vector).max()

    return {
        "kategori": pred,
        "confidence": round(prob * 100, 2)
    }

# TEST
if __name__ == "__main__":
    text = "jalan rusak dan berlubang"
    print(predict_text(text))