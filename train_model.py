import json
import pandas as pd
import re
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# ---------------------------------------
# PREPROCESSING FUNCTION
# ---------------------------------------
factory = StemmerFactory()
stemmer = factory.create_stemmer()

stop_factory = StopWordRemoverFactory()
stopwords = set(stop_factory.get_stop_words())

def cleaning(text):
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    return text

def casefolding(text):
    return text.lower()

def normalize(text):
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def tokenize(text):
    return text.split()

def remove_stopwords(words):
    return [w for w in words if w not in stopwords]

def stemming(words):
    return " ".join([stemmer.stem(w) for w in words])

def preprocess(text):
    text = cleaning(text)
    text = casefolding(text)
    text = normalize(text)
    tokens = tokenize(text)
    tokens = remove_stopwords(tokens)
    text = stemming(tokens)
    return text


# ---------------------------------------
# 1️⃣ LOAD DATA LATIH
# ---------------------------------------
with open("Dashboard/public/pengaduan_label.json", "r") as f:
    data = json.load(f)

df = pd.DataFrame(data)

df = df[["deskripsi", "Kategori"]]

df["processed"] = df["deskripsi"].apply(preprocess)

print(df.head())


# ---------------------------------------
# 2️⃣ TF-IDF
# ---------------------------------------
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pickle

print("\n🔄 Mengubah teks menjadi TF-IDF...")

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["processed"])
y = df["Kategori"]


# ---------------------------------------
# 3️⃣ TRAIN/TEST SPLIT
# ---------------------------------------
print("🔄 Membagi data train/test...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)


# ---------------------------------------
# 4️⃣ TRAINING MODEL
# ---------------------------------------
print("🔄 Melatih model Random Forest...")
rf = RandomForestClassifier(n_estimators=200, random_state=42)
rf.fit(X_train, y_train)


# ---------------------------------------
# 5️⃣ EVALUASI
# ---------------------------------------
print("🔍 Evaluasi model...")
y_pred = rf.predict(X_test)
akurasi = accuracy_score(y_test, y_pred)

print("\n🎯 Akurasi:", akurasi)
print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred))


# ---------------------------------------
# 6️⃣ SIMPAN MODEL
# ---------------------------------------
pickle.dump(vectorizer, open("model_vectorizer.pkl", "wb"))
pickle.dump(rf, open("model_rf.pkl", "wb"))

# SIMPAN AKURASI KE accuracy.txt
with open("accuracy.txt", "w") as f:
    f.write(str(akurasi))


# ---------------------------------------
# 7️⃣ SIMPAN LAPORAN JSON
# ---------------------------------------
training_info = {
    "akurasi": float(akurasi),
    "total_data": len(df),
    "fitur_tfidf": len(vectorizer.get_feature_names_out()),
    "estimators": 200
}

with open("hasil_training.json", "w") as f:
    json.dump(training_info, f, indent=4)

print("\n✅ Training selesai!")
print("📁 Model disimpan: model_vectorizer.pkl, model_rf.pkl")
print("📁 Akurasi disimpan: accuracy.txt")
print("📁 Laporan training: hasil_training.json")
