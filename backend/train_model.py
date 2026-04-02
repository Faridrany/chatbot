import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from preprocessing import preprocess

# Load dataset
df = pd.read_csv("data/dataset_pengaduan.csv")

# Preprocessing
df["processed"] = df["deskripsi"].apply(preprocess)

# TF-IDF
tfidf = TfidfVectorizer(max_features=5000)
X = tfidf.fit_transform(df["processed"])
y = df["kategori"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# Model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
pickle.dump(model, open("model/model_rf.pkl", "wb"))
pickle.dump(tfidf, open("model/tfidf.pkl", "wb"))

print("✅ Model berhasil dilatih dan disimpan")