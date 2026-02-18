// export_excel.js
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const BACKUP_FILE = path.join(__dirname, "backup_pengaduan.json");
const OUTPUT_FILE = path.join(__dirname, "data_pengaduan.xlsx");

async function exportToExcel() {
    try {
        const jsonData = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Data Pengaduan");

        // Header
        worksheet.columns = [
            { header: "Nama", key: "nama", width: 25 },
            { header: "Deskripsi", key: "deskripsi", width: 60 },
            { header: "Kategori", key: "kategori", width: 20 },
            { header: "Waktu", key: "waktu", width: 25 }
        ];

        // Tambahkan data
        jsonData.forEach(row => worksheet.addRow(row));

        // Simpan
        await workbook.xlsx.writeFile(OUTPUT_FILE);
        console.log("✅ Excel berhasil diperbarui:", OUTPUT_FILE);
    } catch (err) {
        console.error("❌ Error export Excel:", err);
    }
}

module.exports = { exportToExcel };
