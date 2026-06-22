from main import get_pengaduan_detail

# Test helper function
detail = get_pengaduan_detail('PGD-0001')

if detail:
    print("✅ Helper function works!")
    print(f"Kode: {detail['kode_pengaduan']}")
    print(f"Nama: {detail['nama']}")
    print(f"Kategori: {detail['kategori_prediksi']}")
    print(f"Confidence: {detail['confidence']}")
    print(f"\nStage data present:")
    print(f"  - tokenisasi: {'tokenisasi' in detail}")
    print(f"  - tfidf: {'tfidf' in detail}")
    print(f"  - filtering: {'filtering' in detail}")
    print(f"  - seleksi_fitur: {'seleksi_fitur' in detail}")
    print(f"  - random_forest: {'random_forest' in detail}")
    
    if 'tfidf' in detail:
        print(f"\n  TF-IDF terms: {len(detail['tfidf'])}")
    if 'random_forest' in detail:
        print(f"  RF tree votes: {len(detail['random_forest'].get('tree_votes_sample', {}))}")
else:
    print("❌ Helper function failed!")
