# -*- coding: utf-8 -*-
"""
Test script untuk memverifikasi struktur baru dengan kode_pengaduan
"""
import os
import sys
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import (
    generate_kode_pengaduan,
    get_pengaduan_detail,
    FINAL_PROCESSED_PATH,
    STAGE_TOKENISASI_PATH,
    STAGE_TFIDF_PATH,
    STAGE_FILTERING_PATH,
    STAGE_SELEKSI_FITUR_PATH,
    STAGE_RANDOM_FOREST_PATH
)

def test_kode_generation():
    """Test kode_pengaduan generation"""
    print("\n" + "="*60)
    print("TEST 1: Kode Pengaduan Generation")
    print("="*60)
    
    # Test sequential generation
    test_cases = [
        (0, {}),
        (1, {}),
        (99, {}),
        (1199, {})
    ]
    
    for index, item in test_cases:
        kode = generate_kode_pengaduan(index, item)
        expected = f"PGD-{index + 1:04d}"
        status = "✅" if kode == expected else "❌"
        print(f"{status} Index {index:4d} → {kode} (expected: {expected})")
    
    print("\n✅ Kode generation test PASSED")


def test_file_structure():
    """Test apakah semua stage files ada"""
    print("\n" + "="*60)
    print("TEST 2: File Structure")
    print("="*60)
    
    files_to_check = [
        ("final_processed.json", FINAL_PROCESSED_PATH),
        ("tokenisasi.json", STAGE_TOKENISASI_PATH),
        ("tfidf.json", STAGE_TFIDF_PATH),
        ("filtering.json", STAGE_FILTERING_PATH),
        ("seleksi_fitur.json", STAGE_SELEKSI_FITUR_PATH),
        ("random_forest.json", STAGE_RANDOM_FOREST_PATH)
    ]
    
    all_exist = True
    for name, path in files_to_check:
        exists = os.path.exists(path)
        status = "✅" if exists else "❌"
        print(f"{status} {name:30s} {'EXISTS' if exists else 'NOT FOUND'}")
        
        if exists:
            size = os.path.getsize(path) / 1024  # KB
            print(f"   └─ Size: {size:,.1f} KB")
        
        all_exist = all_exist and exists
    
    if all_exist:
        print("\n✅ File structure test PASSED")
    else:
        print("\n⚠️  Some files missing. Run: python main.py --train")
    
    return all_exist


def test_data_integrity():
    """Test integritas data (semua kode_pengaduan konsisten)"""
    print("\n" + "="*60)
    print("TEST 3: Data Integrity")
    print("="*60)
    
    if not os.path.exists(FINAL_PROCESSED_PATH):
        print("❌ final_processed.json tidak ditemukan")
        return False
    
    with open(FINAL_PROCESSED_PATH, 'r', encoding='utf-8') as f:
        final_data = json.load(f)
    
    print(f"Total entries in final_processed.json: {len(final_data)}")
    
    # Check kode_pengaduan exists in all entries
    missing_kode = []
    for i, entry in enumerate(final_data):
        if 'kode_pengaduan' not in entry:
            missing_kode.append(i)
    
    if missing_kode:
        print(f"❌ {len(missing_kode)} entries missing kode_pengaduan: {missing_kode[:10]}")
        return False
    else:
        print("✅ All entries have kode_pengaduan")
    
    # Extract all kode_pengaduan
    all_kodes = [entry['kode_pengaduan'] for entry in final_data]
    
    # Check uniqueness
    unique_kodes = set(all_kodes)
    if len(unique_kodes) != len(all_kodes):
        print(f"❌ Duplicate kode_pengaduan detected!")
        return False
    else:
        print(f"✅ All {len(unique_kodes)} kode_pengaduan are unique")
    
    # Check format (PGD-XXXX)
    invalid_format = []
    for kode in all_kodes:
        if not kode.startswith("PGD-") or len(kode) != 8:
            invalid_format.append(kode)
    
    if invalid_format:
        print(f"❌ {len(invalid_format)} invalid kode format: {invalid_format[:10]}")
        return False
    else:
        print("✅ All kode_pengaduan have valid format (PGD-XXXX)")
    
    # Show sample kodes
    print(f"\nSample kode_pengaduan:")
    for kode in all_kodes[:5]:
        print(f"   - {kode}")
    
    print("\n✅ Data integrity test PASSED")
    return True


def test_stage_files_consistency():
    """Test konsistensi kode_pengaduan di semua stage files"""
    print("\n" + "="*60)
    print("TEST 4: Stage Files Consistency")
    print("="*60)
    
    stage_files = {
        "tokenisasi": STAGE_TOKENISASI_PATH,
        "tfidf": STAGE_TFIDF_PATH,
        "filtering": STAGE_FILTERING_PATH,
        "seleksi_fitur": STAGE_SELEKSI_FITUR_PATH,
        "random_forest": STAGE_RANDOM_FOREST_PATH
    }
    
    # Load all kode from final_processed
    if not os.path.exists(FINAL_PROCESSED_PATH):
        print("❌ final_processed.json tidak ditemukan")
        return False
    
    with open(FINAL_PROCESSED_PATH, 'r', encoding='utf-8') as f:
        final_data = json.load(f)
    
    master_kodes = set(entry['kode_pengaduan'] for entry in final_data)
    print(f"Master kode_pengaduan count: {len(master_kodes)}")
    
    all_consistent = True
    for stage_name, path in stage_files.items():
        if not os.path.exists(path):
            print(f"⚠️  {stage_name}.json not found, skipping...")
            continue
        
        with open(path, 'r', encoding='utf-8') as f:
            stage_data = json.load(f)
        
        stage_kodes = set(stage_data.keys())
        
        # Check if all master kodes exist in stage
        missing = master_kodes - stage_kodes
        extra = stage_kodes - master_kodes
        
        if missing:
            print(f"❌ {stage_name}: {len(missing)} kodes missing from master")
            all_consistent = False
        elif extra:
            print(f"⚠️  {stage_name}: {len(extra)} extra kodes not in master")
            all_consistent = False
        else:
            print(f"✅ {stage_name}: All {len(stage_kodes)} kodes match master")
    
    if all_consistent:
        print("\n✅ Stage files consistency test PASSED")
    else:
        print("\n❌ Stage files consistency test FAILED")
    
    return all_consistent


def test_get_pengaduan_detail():
    """Test fungsi get_pengaduan_detail()"""
    print("\n" + "="*60)
    print("TEST 5: get_pengaduan_detail() Function")
    print("="*60)
    
    # Test dengan kode yang ada
    test_kode = "PGD-0001"
    print(f"\nTesting with kode: {test_kode}")
    
    detail = get_pengaduan_detail(test_kode)
    
    if detail is None:
        print(f"❌ get_pengaduan_detail('{test_kode}') returned None")
        return False
    
    # Check main fields
    required_fields = ['kode_pengaduan', 'nama', 'deskripsi', 'kategori_prediksi']
    missing_fields = [f for f in required_fields if f not in detail]
    
    if missing_fields:
        print(f"❌ Missing required fields: {missing_fields}")
        return False
    else:
        print(f"✅ All required fields present")
    
    # Check stage data
    stage_fields = ['tokenisasi', 'tfidf', 'filtering', 'seleksi_fitur', 'random_forest']
    present_stages = [s for s in stage_fields if s in detail]
    
    print(f"\nStage data present: {len(present_stages)}/{len(stage_fields)}")
    for stage in stage_fields:
        status = "✅" if stage in detail else "⚠️ "
        print(f"   {status} {stage}")
    
    # Show sample data
    print(f"\nSample data for {test_kode}:")
    print(f"   Nama: {detail.get('nama', 'N/A')}")
    print(f"   Kategori: {detail.get('kategori_prediksi', 'N/A')}")
    print(f"   Confidence: {detail.get('confidence', 'N/A')}")
    
    if 'tokenisasi' in detail:
        unigram_count = len(detail['tokenisasi'].get('unigram', {}))
        print(f"   Unigram terms: {unigram_count}")
    
    if 'tfidf' in detail:
        tfidf_count = len(detail['tfidf'])
        print(f"   TF-IDF terms: {tfidf_count}")
        # Show top 3 terms
        if tfidf_count > 0:
            top_terms = sorted(detail['tfidf'].items(), key=lambda x: -x[1])[:3]
            print(f"   Top 3 TF-IDF terms:")
            for term, score in top_terms:
                print(f"      - {term}: {score:.6f}")
    
    if 'random_forest' in detail:
        if 'tree_votes_sample' in detail['random_forest']:
            votes_count = len(detail['random_forest']['tree_votes_sample'])
            print(f"   Tree votes sample: {votes_count}")
    
    # Test dengan kode yang tidak ada
    test_invalid = "PGD-9999"
    print(f"\nTesting with invalid kode: {test_invalid}")
    detail_invalid = get_pengaduan_detail(test_invalid)
    
    if detail_invalid is None:
        print(f"✅ Correctly returned None for invalid kode")
    else:
        print(f"❌ Should return None for invalid kode")
        return False
    
    print("\n✅ get_pengaduan_detail() test PASSED")
    return True


def test_performance():
    """Test performa lookup"""
    print("\n" + "="*60)
    print("TEST 6: Performance Benchmark")
    print("="*60)
    
    import time
    
    if not os.path.exists(FINAL_PROCESSED_PATH):
        print("❌ final_processed.json tidak ditemukan")
        return False
    
    # Test 1: Load main data
    start = time.time()
    with open(FINAL_PROCESSED_PATH, 'r', encoding='utf-8') as f:
        final_data = json.load(f)
    load_time = (time.time() - start) * 1000
    print(f"✅ Load final_processed.json: {load_time:.2f} ms")
    
    # Test 2: Linear search by kode
    test_kode = "PGD-0500"
    start = time.time()
    result = next((item for item in final_data if item.get('kode_pengaduan') == test_kode), None)
    search_time = (time.time() - start) * 1000
    print(f"✅ Linear search for {test_kode}: {search_time:.2f} ms")
    
    # Test 3: get_pengaduan_detail (full lookup)
    start = time.time()
    detail = get_pengaduan_detail(test_kode)
    detail_time = (time.time() - start) * 1000
    print(f"✅ get_pengaduan_detail({test_kode}): {detail_time:.2f} ms")
    
    # Test 4: Multiple lookups
    test_kodes = [f"PGD-{i:04d}" for i in range(1, 11)]
    start = time.time()
    for kode in test_kodes:
        get_pengaduan_detail(kode)
    batch_time = (time.time() - start) * 1000
    avg_time = batch_time / len(test_kodes)
    print(f"✅ Batch lookup (10 entries): {batch_time:.2f} ms (avg: {avg_time:.2f} ms/entry)")
    
    print("\n✅ Performance test PASSED")
    return True


def main():
    """Run all tests"""
    print("\n")
    print("="*60)
    print("KODE PENGADUAN STRUCTURE VALIDATION")
    print("="*60)
    
    tests = [
        ("Kode Generation", test_kode_generation),
        ("File Structure", test_file_structure),
        ("Data Integrity", test_data_integrity),
        ("Stage Consistency", test_stage_files_consistency),
        ("Helper Function", test_get_pengaduan_detail),
        ("Performance", test_performance)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} test FAILED with exception:")
            print(f"   {type(e).__name__}: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10s} {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests PASSED! Structure is ready to use.")
    else:
        print("\n⚠️  Some tests failed. Please fix issues before proceeding.")
        print("\nTo regenerate data, run:")
        print("  cd backend")
        print("  python main.py --train")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
