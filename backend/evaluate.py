import pickle
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from preprocessing import preprocess

# Load
model = pickle.load(open("model/model_rf.pkl", "rb"))
tfidf = pickle.load(open("model/tfidf.pkl", "rb"))

df = pd.read_csv("data/dataset_pengaduan.csv")

df["processed"] = df["deskripsi"].apply(preprocess)

X = tfidf.transform(df["processed"])
y = df["kategori"]

y_pred = model.predict(X)

print("Accuracy:", accuracy_score(y, y_pred))
print("\nClassification Report:\n", classification_report(y, y_pred))
print("\nConfusion Matrix:\n", confusion_matrix(y, y_pred))