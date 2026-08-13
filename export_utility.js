#!/usr/bin/env node

const { exportDatasetToExcel } = require('./export_dataset_to_excel');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// CLI interface untuk export dataset
async function main() {
    const args = process.argv.slice(2);
    
    console.log('🚀 ========== EXPORT UTILITY ==========');
    console.log('📊 Dataset Export Tool untuk ChatBot Pengaduan Warga Samboja\n');
    
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    try {
        if (args.includes('--list') || args.includes('-l')) {
            await listExistingExports();
            return;
        }
        
        if (args.includes('--open') || args.includes('-o')) {
            await openLatestExport();
            return;
        }
        
        if (args.includes('--clean') || args.includes('-c')) {
            await cleanOldExports();
            return;
        }
        
        // Default: Export dataset
        console.log('📊 Starting dataset export...\n');
        
        const result = await exportDatasetToExcel();
        
        console.log('\n' + '='.repeat(50));
        console.log('📈 EXPORT SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Status: SUCCESS`);
        console.log(`📁 Filename: ${result.filename}`);
        console.log(`📊 Records: ${result.records}`);
        console.log(`📦 Size: ${result.fileSize} KB`);
        console.log(`📂 Location: ${result.filepath}`);
        
        // Ask if user wants to open the file
        if (args.includes('--open-after') || args.includes('--auto-open')) {
            console.log('\n🚀 Opening Excel file...');
            await openFile(result.filepath);
        } else {
            console.log('\n💡 Tip: Gunakan --open untuk membuka file Excel secara otomatis');
            console.log('   atau jalankan: node export_utility.js --open');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Pastikan file dataset_berlabel.json ada di data/raw/');
        console.log('• Pastikan library ExcelJS terinstall: npm install exceljs');
        console.log('• Cek permission write ke folder data/export/');
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
📖 PANDUAN PENGGUNAAN:

🚀 Ekspor Dataset:
   node export_utility.js                    # Export dataset ke Excel
   node export_utility.js --auto-open        # Export + buka file otomatis

📁 Manajemen File:
   node export_utility.js --list             # Lihat daftar file export
   node export_utility.js --open             # Buka file export terbaru  
   node export_utility.js --clean            # Hapus file export lama

ℹ️  Bantuan:
   node export_utility.js --help             # Tampilkan help ini

📊 FITUR EXPORT:
• 3 Sheet Excel: Dataset Lengkap, Statistik, Analisis Kata Kunci
• Format data yang rapi dengan color coding per kategori
• Analisis statistik otomatis (distribusi, panjang teks, dll)
• Filter dan freeze panes untuk navigasi mudah
• Export 1200+ records pengaduan berlabel

📂 OUTPUT LOCATION:
   data/export/dataset_berlabel_export_[timestamp].xlsx

🎯 CONTOH PENGGUNAAN:
   node export_utility.js --auto-open        # Export + buka langsung
   node export_utility.js && node export_utility.js --open  # Export lalu buka
`);
}

async function listExistingExports() {
    try {
        const exportDir = path.join(__dirname, 'data', 'export');
        const files = await fs.readdir(exportDir);
        
        const excelFiles = files
            .filter(f => f.endsWith('.xlsx') && f.includes('dataset_berlabel_export'))
            .map(async (filename) => {
                const filepath = path.join(exportDir, filename);
                const stats = await fs.stat(filepath);
                return {
                    filename,
                    filepath,
                    size: (stats.size / 1024).toFixed(2) + ' KB',
                    created: stats.birthtime.toLocaleString('id-ID'),
                    modified: stats.mtime.toLocaleString('id-ID')
                };
            });
        
        const fileDetails = await Promise.all(excelFiles);
        
        if (fileDetails.length === 0) {
            console.log('📁 Belum ada file export dataset.');
            console.log('💡 Jalankan: node export_utility.js untuk membuat export pertama');
            return;
        }
        
        console.log(`📁 DAFTAR FILE EXPORT (${fileDetails.length} file):\n`);
        
        fileDetails
            .sort((a, b) => new Date(b.modified) - new Date(a.modified))
            .forEach((file, index) => {
                const icon = index === 0 ? '🆕' : '📄';
                const label = index === 0 ? ' (TERBARU)' : '';
                
                console.log(`${icon} ${file.filename}${label}`);
                console.log(`   📅 Dibuat: ${file.created}`);
                console.log(`   📦 Ukuran: ${file.size}`);
                console.log(`   📂 Path: ${file.filepath}`);
                console.log('');
            });
        
        console.log('💡 Tips:');
        console.log('• Gunakan --open untuk membuka file terbaru');
        console.log('• Gunakan --clean untuk hapus file lama (>7 hari)');
        
    } catch (error) {
        console.log('❌ Error listing files:', error.message);
    }
}

async function openLatestExport() {
    try {
        const exportDir = path.join(__dirname, 'data', 'export');
        const files = await fs.readdir(exportDir);
        
        const excelFiles = files
            .filter(f => f.endsWith('.xlsx') && f.includes('dataset_berlabel_export'))
            .map(async (filename) => {
                const filepath = path.join(exportDir, filename);
                const stats = await fs.stat(filepath);
                return { filename, filepath, mtime: stats.mtime };
            });
        
        const fileDetails = await Promise.all(excelFiles);
        
        if (fileDetails.length === 0) {
            console.log('❌ Tidak ada file export yang ditemukan.');
            console.log('💡 Buat export baru dengan: node export_utility.js');
            return;
        }
        
        // Sort by modification time, get latest
        const latestFile = fileDetails.sort((a, b) => b.mtime - a.mtime)[0];
        
        console.log(`📂 Membuka file terbaru: ${latestFile.filename}`);
        console.log(`⏰ Dibuat: ${latestFile.mtime.toLocaleString('id-ID')}\n`);
        
        await openFile(latestFile.filepath);
        
    } catch (error) {
        console.log('❌ Error opening file:', error.message);
    }
}

async function openFile(filepath) {
    return new Promise((resolve) => {
        const command = process.platform === 'win32' ? 'start' : 
                       process.platform === 'darwin' ? 'open' : 'xdg-open';
        
        const child = spawn(command, [filepath], { 
            shell: true,
            detached: true,
            stdio: 'ignore'
        });
        
        child.on('error', (error) => {
            console.log(`⚠️  Tidak dapat membuka file otomatis: ${error.message}`);
            console.log(`📂 Buka manual: ${filepath}`);
        });
        
        child.on('spawn', () => {
            console.log('✅ File Excel dibuka!');
            resolve();
        });
        
        // Don't wait for the external program
        child.unref();
        setTimeout(resolve, 1000);
    });
}

async function cleanOldExports() {
    try {
        const exportDir = path.join(__dirname, 'data', 'export');
        const files = await fs.readdir(exportDir);
        
        const excelFiles = files
            .filter(f => f.endsWith('.xlsx') && f.includes('dataset_berlabel_export'));
        
        if (excelFiles.length === 0) {
            console.log('📁 Tidak ada file export untuk dibersihkan.');
            return;
        }
        
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        
        let deletedCount = 0;
        let totalSize = 0;
        
        for (const filename of excelFiles) {
            const filepath = path.join(exportDir, filename);
            const stats = await fs.stat(filepath);
            
            if (stats.mtime < weekAgo) {
                totalSize += stats.size;
                await fs.unlink(filepath);
                deletedCount++;
                console.log(`🗑️  Deleted: ${filename} (${(stats.size/1024).toFixed(2)} KB)`);
            }
        }
        
        if (deletedCount === 0) {
            console.log('✅ Tidak ada file lama (>7 hari) untuk dihapus.');
        } else {
            console.log(`\n✅ Cleaned up ${deletedCount} file(s), freed ${(totalSize/1024).toFixed(2)} KB`);
        }
        
    } catch (error) {
        console.log('❌ Error cleaning files:', error.message);
    }
}

// Run main function
if (require.main === module) {
    main();
}

module.exports = { 
    exportDatasetToExcel,
    listExistingExports,
    openLatestExport,
    cleanOldExports
};