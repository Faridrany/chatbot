def run_preprocessing():
    # Menentukan direktori dasar proyek
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    input_file = os.path.join(BASE_DIR, "data", "backup_pengaduan.json")
    output_file = os.path.join(BASE_DIR, "data", "data_preprocessed.json")

    print("🚀 === TAHAP 1: PREPROCESSING ===")

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if isinstance(data, dict):
            data = [data]

        print(f"✅ Data input dimuat: {len(data)} pengaduan")

    except Exception as e:
        print(f"❌ Gagal membaca file: {e}")
        return

    processed_data = []

    for index, item in enumerate(data):
        # MENGAMBIL DATA: Pastikan key sesuai dengan JSON (deskripsi & Kategori)
        original_text = item.get("deskripsi", "")
         # Menggunakan K-kapital sesuai input

        print(f"[{index+1}] Memproses pengaduan dari: {item.get('nama')}")
        
        # PROSES PREPROCESSING
        cleaned_text = preprocess_text(original_text)
        
        print(f"    - Teks Asli: {original_text[:50]}...")
        print(f"    - Teks Hasil: {cleaned_text}")

        processed_item = {
            "nama": item.get("nama", ""),
            "no_wa": item.get("no_wa", ""),
            "deskripsi_asli": original_text,
            "text_cleaned": cleaned_text,
            "kategori_label": category,
            "processing_time": datetime.now().isoformat()
        }

        processed_data.append(processed_item)

    # Simpan Hasil
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Selesai! {len(processed_data)} data disimpan di: {output_file}")