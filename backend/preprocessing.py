# backend/preprocessing.py
import json
import re
import pandas as pd
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# Inisialisasi Sastrawi
factory = StemmerFactory()
stemmer = factory.create_stemmer()

stop_factory = StopWordRemoverFactory()
stopwords = stop_factory.get_stop_words()

# Kamus Normalisasi
norm_dict = {
    "gk": "tidak",
    "rt": "rukun tetangga",
    "rw": "rukun warga",
    "jl": "jalan",
    "yg": "yang",
    "tdk": "tidak",
    "ga": "tidak"
}

def preprocess(text):
    # 1. Cleaning
    text = re.sub(r"http\S+|www\S+|https\S+", "", text, flags=re.MULTILINE)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    
    # 2. Case Folding
    text = text.lower()
    
    # 3. Tokenizing & Normalisasi
    tokens = text.split()
    tokens = [norm_dict.get(w, w) for w in tokens]
    
    # 4. Stopword Removal
    tokens = [w for w in tokens if w not in stopwords]
    
    # 5. Stemming
    tokens = [stemmer.stem(w) for w in tokens]
    
    return " ".join(tokens)

def run_preprocessing():
    input_file = "data/backup_pengaduan.json"
    output_file = "data/data_preprocessed.json"
    
    print("🚀 === TAHAP 1: PREPROCESSING ===")
    
    # Load data backup
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Data input dimuat: {len(data)} pengaduan")
    except FileNotFoundError:
        print(f"❌ File {input_file} tidak ditemukan!")
        return
    
    # Preprocessing
    processed_data = []
    for item in data:
        cleaned_text = preprocess(item.get('text', ''))
        processed_item = item.copy()
        processed_item['text_cleaned'] = cleaned_text
        processed_data.append(processed_item)
    
    # Simpan hasil preprocessing
    df = pd.DataFrame(processed_data)
    df.to_json(output_file, orient="records", indent=2)
    
    print(f"✅ Preprocessing selesai!")
    print(f"📊 Data sebelum: {len(data)} records")
    print(f"📊 Data setelah: {len(processed_data)} records")
    print(f"💾 Disimpan di: {output_file}")
    
    return processed_data

if __name__ == "__main__":
    run_preprocessing()