# 📊 Export Dataset ke Excel - ChatBot Pengaduan Warga Samboja

## 🎯 Overview
Tool ini mengekspor dataset_berlabel.json (1200+ records pengaduan) ke format Excel dengan 3 sheet yang informatif dan analisis mendalam.

---

## 🚀 Quick Start

### **1. Export Dataset (Basic)**
```bash
cd C:\Users\USER\chatbot
node export_dataset_to_excel.js
```

### **2. Export dengan Utility (Recommended)**
```bash
# Export + buka file otomatis
node export_utility.js --auto-open

# Export saja
node export_utility.js

# Lihat bantuan lengkap
node export_utility.js --help
```

---

## 📋 Fitur Excel Export

### **Sheet 1: Dataset Lengkap**
- ✅ **1200+ records** pengaduan berlabel
- 📊 **7 kolom**: No, Nama, WhatsApp, Deskripsi, Kategori, Timestamp, Panjang Teks
- 🎨 **Color coding** per kategori:
  - 🔵 **INFRASTRUKTUR** - Biru (jalan, lampu, fasilitas)
  - 🟢 **LINGKUNGAN** - Hijau (sampah, air, kebersihan)  
  - 🔴 **KEAMANAN** - Merah (ronda, pencurian, ketertiban)
  - 🟠 **PELAYANAN** - Orange (administrasi, RT/RW)
- 🔍 **Auto-filter** & frozen header untuk navigasi mudah
- 📐 **Column width** otomatis untuk readability optimal

### **Sheet 2: Statistik Dataset**
- 📈 **Informasi Umum**:
  - Total records: 1200
  - Rata-rata panjang teks
  - Teks terpendek/terpanjang  
  - Total kata unik
  - Periode data (range tanggal)

- 📊 **Distribusi Kategori**:
  - Jumlah per kategori
  - Persentase distribusi
  - Visualisasi bar chart ASCII
  - Balanced dataset (25% per kategori)

### **Sheet 3: Analisis Kata Kunci**
- 🔍 **Top keywords** per kategori (15 kata teratas)
- 📊 **Frekuensi** dan **persentase** setiap kata kunci
- 🎯 **Insight** untuk understanding pattern klasifikasi
- 📝 **Word analysis** untuk feature engineering

---

## 🛠️ Command Reference

### **Export Commands**
```bash
# Basic export
node export_dataset_to_excel.js

# Export + auto open
node export_utility.js --auto-open

# Export dengan timestamp otomatis
node export_utility.js
```

### **File Management**
```bash
# List semua file export
node export_utility.js --list

# Buka file export terbaru  
node export_utility.js --open

# Clean file export lama (>7 hari)
node export_utility.js --clean
```

### **Help & Info**
```bash
# Tampilkan bantuan lengkap
node export_utility.js --help

# Check status export directory
ls data/export/
```

---

## 📂 Output Structure

### **File Location**
```
📁 data/export/
  📄 dataset_berlabel_export_2026-07-15T00-05-30.xlsx
  📄 dataset_berlabel_export_2026-07-14T15-30-22.xlsx
  📄 ... (file export sebelumnya)
```

### **Naming Convention**  
```
dataset_berlabel_export_[YYYY-MM-DDTHH-MM-SS].xlsx
```

### **File Size**
- 📦 **~100 KB** untuk 1200 records
- 🚀 **Fast processing** (~3-5 detik)
- 💾 **Efficient storage** dengan compression

---

## 📊 Sample Output Preview

### **Excel Sheet Preview:**

**Sheet 1: Dataset Lengkap**
| No | Nama | No WhatsApp | Deskripsi | Kategori | Timestamp | Panjang |
|----|------|-------------|-----------|----------|-----------|---------|
| 1 | Fahri Abdillah | 6281234567801 | Lampu PJU di sekitar Jembatan... | KEAMANAN | 2025-11-02 00:56:39 | 85 |
| 2 | Sinta Wulan | 6285712345602 | Sekelompok pemuda mabuk... | KEAMANAN | 2025-11-04 17:18:39 | 78 |

**Sheet 2: Statistik**
```
INFORMASI UMUM
Total Records        1200
Rata-rata Panjang    67 karakter
Teks Terpendek       28 karakter
Teks Terpanjang      156 karakter
Total Kata Unik      1,847
Periode Data         2025-10-01 - 2025-12-28

DISTRIBUSI KATEGORI
Kategori      Jumlah  Persentase  Visualisasi
INFRASTRUKTUR   300     25.0%     █████░░░░░░░░░░░░░░░░
LINGKUNGAN      300     25.0%     █████░░░░░░░░░░░░░░░░
KEAMANAN        300     25.0%     █████░░░░░░░░░░░░░░░░
PELAYANAN       300     25.0%     █████░░░░░░░░░░░░░░░░
```

**Sheet 3: Kata Kunci (Sample)**
```
INFRASTRUKTUR
Kata Kunci    Frekuensi  Persentase
jalan         89         12.3%
rusak         76         10.5%
lubang        67         9.2%
pju           45         6.2%
lampu         43         5.9%
```

---

## 🔧 Troubleshooting

### **Error: ExcelJS not found**
```bash
cd C:\Users\USER\chatbot
npm install exceljs
```

### **Error: File tidak ditemukan**
- ✅ Pastikan `data/raw/dataset_berlabel.json` ada
- ✅ Jalankan dari root directory chatbot
- ✅ Check file permissions

### **Error: Cannot write to export folder**
```bash
# Buat folder manual jika perlu
mkdir data/export
```

### **File Excel tidak terbuka**
- ✅ Install Microsoft Excel atau LibreOffice
- ✅ Check file association .xlsx
- ✅ Buka manual dari file explorer

---

## 💡 Pro Tips

### **1. Automated Workflow**
```bash
# Export + buka + clean old files
node export_utility.js --auto-open && node export_utility.js --clean
```

### **2. Scheduled Export**
Tambahkan ke Windows Task Scheduler untuk export berkala:
```batch
@echo off
cd C:\Users\USER\chatbot
node export_utility.js > export_log.txt 2>&1
```

### **3. Data Analysis**
Gunakan Excel features:
- 📊 **Pivot Tables** untuk analisis kategori  
- 📈 **Charts** untuk visualisasi distribusi
- 🔍 **Advanced Filter** untuk subset data
- 📋 **Conditional Formatting** untuk highlighting

### **4. Integration dengan Dashboard**
```javascript
// Panggil dari aplikasi lain
const { exportDatasetToExcel } = require('./export_dataset_to_excel');

const result = await exportDatasetToExcel();
console.log(`Export selesai: ${result.filepath}`);
```

---

## 📈 Use Cases

### **1. Data Analysis & Research**
- 📊 Analisis tren pengaduan warga
- 🎯 Identifikasi kata kunci per kategori  
- 📈 Monitoring distribusi kategori
- 🔍 Quality check dataset

### **2. Reporting & Presentation**  
- 📋 Laporan bulanan ke pemerintah
- 📊 Presentasi hasil sistem klasifikasi
- 📈 Dashboard metrics untuk stakeholder
- 🎯 Performance review ML model

### **3. Machine Learning Development**
- 🔬 Feature engineering analysis
- 📊 Data quality assessment  
- 🎯 Bias detection dalam dataset
- 📈 Model performance correlation

### **4. Administrative Tasks**
- 📋 Backup data berkala
- 📊 Audit trail pengaduan
- 🔍 Data verification manual
- 📈 Compliance reporting

---

## 🎯 Next Steps

### **Enhancements (Future)**
- [ ] **Multi-format export** (CSV, PDF, JSON)
- [ ] **Advanced filtering** by date range, keyword
- [ ] **Chart generation** dalam Excel
- [ ] **Email integration** untuk automated reports
- [ ] **Template customization** per user role

### **Integration Options**
- [ ] **Web API endpoint** untuk export via dashboard
- [ ] **Scheduled exports** dengan cron jobs
- [ ] **Cloud storage** integration (Google Drive, OneDrive)
- [ ] **Real-time updates** dari live database

---

## ✅ Success Metrics

### **Export berhasil jika:**
- ✅ File .xlsx terbuat di `data/export/`
- ✅ Size file ~100KB untuk 1200 records
- ✅ 3 sheets terbuat dengan data lengkap
- ✅ File dapat dibuka dengan Excel/LibreOffice
- ✅ Data formatting dan color coding benar
- ✅ No errors dalam console output

**Happy Exporting! 📊🚀**