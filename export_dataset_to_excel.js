const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');

// Path configuration
const DATA_DIR = path.join(__dirname, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const EXPORT_DIR = path.join(DATA_DIR, 'export');
const DATASET_PATH = path.join(RAW_DIR, 'dataset_berlabel.json');

async function exportDatasetToExcel() {
    console.log('📊 ========== EXPORT DATASET TO EXCEL ==========');
    console.log('📂 Loading dataset_berlabel.json...\n');

    try {
        // Ensure export directory exists
        await fs.mkdir(EXPORT_DIR, { recursive: true });

        // Load dataset
        const datasetRaw = await fs.readFile(DATASET_PATH, 'utf-8');
        const dataset = JSON.parse(datasetRaw);

        console.log(`✅ Dataset loaded: ${dataset.length} records`);
        console.log('📋 Creating Excel workbook...\n');

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        
        // Set workbook properties
        workbook.creator = 'ChatBot Pengaduan Warga Samboja';
        workbook.lastModifiedBy = 'Export System';
        workbook.created = new Date();
        workbook.modified = new Date();
        workbook.lastPrinted = new Date();

        // ============= SHEET 1: Dataset Lengkap =============
        const wsMain = workbook.addWorksheet('Dataset Berlabel', {
            pageSetup: { paperSize: 9, orientation: 'landscape' }
        });

        // Define columns
        wsMain.columns = [
            { header: 'No', key: 'no', width: 8, style: { alignment: { horizontal: 'center' } } },
            { header: 'Nama Pelapor', key: 'nama', width: 20 },
            { header: 'No WhatsApp', key: 'no_wa', width: 18 },
            { header: 'Deskripsi Pengaduan', key: 'deskripsi', width: 60 },
            { header: 'Kategori', key: 'kategori', width: 15, style: { alignment: { horizontal: 'center' } } },
            { header: 'Timestamp', key: 'timestamp', width: 20, style: { alignment: { horizontal: 'center' } } },
            { header: 'Panjang Teks', key: 'panjang_teks', width: 12, style: { alignment: { horizontal: 'center' } } }
        ];

        // Style header row
        const headerRow = wsMain.getRow(1);
        headerRow.height = 25;
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2E7D32' }  // Dark green
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        headerRow.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Add data rows
        dataset.forEach((item, index) => {
            const row = wsMain.addRow({
                no: index + 1,
                nama: item.nama || '-',
                no_wa: (item.no_wa || '').replace('@c.us', ''),
                deskripsi: item.deskripsi || '-',
                kategori: item.Kategori || item.kategori || '-',
                timestamp: item.timestamp || '-',
                panjang_teks: (item.deskripsi || '').length
            });

            // Alternate row colors
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF1F8E9' }  // Very light green
                };
            }

            // Style kategori cell with different colors
            const kategoriCell = row.getCell('kategori');
            const kategori = item.Kategori || item.kategori || '';
            
            switch (kategori.toUpperCase()) {
                case 'INFRASTRUKTUR':
                    kategoriCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }; // Blue
                    kategoriCell.font = { color: { argb: 'FF1565C0' }, bold: true };
                    break;
                case 'LINGKUNGAN':
                    kategoriCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } }; // Green  
                    kategoriCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
                    break;
                case 'KEAMANAN':
                    kategoriCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } }; // Red
                    kategoriCell.font = { color: { argb: 'FFC62828' }, bold: true };
                    break;
                case 'PELAYANAN':
                    kategoriCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } }; // Orange
                    kategoriCell.font = { color: { argb: 'FFEF6C00' }, bold: true };
                    break;
            }

            // Add borders to all cells
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'top', wrapText: true };
            });

            // Center align for no, kategori, timestamp, panjang_teks
            row.getCell('no').alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell('kategori').alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell('timestamp').alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell('panjang_teks').alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Auto filter
        wsMain.autoFilter = {
            from: 'A1',
            to: `G${dataset.length + 1}`
        };

        // Freeze first row
        wsMain.views = [{ state: 'frozen', ySplit: 1 }];

        // ============= SHEET 2: Statistik Dataset =============
        const wsStats = workbook.addWorksheet('Statistik Dataset');

        // Calculate statistics
        const stats = calculateDatasetStatistics(dataset);
        
        // Title
        wsStats.mergeCells('A1:D1');
        const titleCell = wsStats.getCell('A1');
        titleCell.value = 'STATISTIK DATASET BERLABEL';
        titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        wsStats.getRow(1).height = 30;

        let currentRow = 3;

        // General Statistics
        wsStats.getCell(`A${currentRow}`).value = 'INFORMASI UMUM';
        wsStats.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF2E7D32' } };
        currentRow++;

        const generalStats = [
            ['Total Records', stats.total],
            ['Rata-rata Panjang Teks', `${stats.avgTextLength} karakter`],
            ['Teks Terpendek', `${stats.minTextLength} karakter`],
            ['Teks Terpanjang', `${stats.maxTextLength} karakter`],
            ['Total Kata Unik', stats.uniqueWords],
            ['Periode Data', `${stats.dateRange.start} - ${stats.dateRange.end}`]
        ];

        generalStats.forEach(([label, value]) => {
            wsStats.getCell(`A${currentRow}`).value = label;
            wsStats.getCell(`B${currentRow}`).value = value;
            wsStats.getCell(`A${currentRow}`).font = { bold: true };
            currentRow++;
        });

        currentRow += 2;

        // Category Distribution
        wsStats.getCell(`A${currentRow}`).value = 'DISTRIBUSI KATEGORI';
        wsStats.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF2E7D32' } };
        currentRow++;

        // Headers for category table
        wsStats.getCell(`A${currentRow}`).value = 'Kategori';
        wsStats.getCell(`B${currentRow}`).value = 'Jumlah';
        wsStats.getCell(`C${currentRow}`).value = 'Persentase';
        wsStats.getCell(`D${currentRow}`).value = 'Visualisasi';

        const categoryHeaderRow = wsStats.getRow(currentRow);
        categoryHeaderRow.font = { bold: true };
        categoryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
        currentRow++;

        Object.entries(stats.categoryDistribution).forEach(([category, count]) => {
            const percentage = ((count / stats.total) * 100).toFixed(1);
            const barLength = Math.round((count / stats.total) * 20); // Max 20 characters
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

            wsStats.getCell(`A${currentRow}`).value = category;
            wsStats.getCell(`B${currentRow}`).value = count;
            wsStats.getCell(`C${currentRow}`).value = `${percentage}%`;
            wsStats.getCell(`D${currentRow}`).value = bar;
            
            // Color code by category
            const categoryCell = wsStats.getCell(`A${currentRow}`);
            switch (category.toUpperCase()) {
                case 'INFRASTRUKTUR':
                    categoryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
                    break;
                case 'LINGKUNGAN':
                    categoryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
                    break;
                case 'KEAMANAN':
                    categoryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
                    break;
                case 'PELAYANAN':
                    categoryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
                    break;
            }
            
            currentRow++;
        });

        // Set column widths for stats sheet
        wsStats.getColumn('A').width = 25;
        wsStats.getColumn('B').width = 15;
        wsStats.getColumn('C').width = 15;
        wsStats.getColumn('D').width = 25;

        // ============= SHEET 3: Kata Kunci per Kategori =============
        const wsKeywords = workbook.addWorksheet('Analisis Kata Kunci');
        
        // Title
        wsKeywords.mergeCells('A1:C1');
        const keywordTitle = wsKeywords.getCell('A1');
        keywordTitle.value = 'ANALISIS KATA KUNCI PER KATEGORI';
        keywordTitle.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        keywordTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
        keywordTitle.alignment = { vertical: 'middle', horizontal: 'center' };
        wsKeywords.getRow(1).height = 30;

        // Analyze keywords by category
        const keywordAnalysis = analyzeKeywordsByCategory(dataset);
        
        let keywordRow = 3;
        Object.entries(keywordAnalysis).forEach(([category, keywords]) => {
            wsKeywords.getCell(`A${keywordRow}`).value = category.toUpperCase();
            wsKeywords.getCell(`A${keywordRow}`).font = { bold: true, size: 12 };
            
            // Color code headers
            const headerCell = wsKeywords.getCell(`A${keywordRow}`);
            switch (category.toUpperCase()) {
                case 'INFRASTRUKTUR':
                    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
                    break;
                case 'LINGKUNGAN':
                    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
                    break;
                case 'KEAMANAN':
                    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
                    break;
                case 'PELAYANAN':
                    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
                    break;
            }
            
            keywordRow++;

            // Headers
            wsKeywords.getCell(`A${keywordRow}`).value = 'Kata Kunci';
            wsKeywords.getCell(`B${keywordRow}`).value = 'Frekuensi';
            wsKeywords.getCell(`C${keywordRow}`).value = 'Persentase';
            
            const subHeaderRow = wsKeywords.getRow(keywordRow);
            subHeaderRow.font = { bold: true };
            subHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
            keywordRow++;

            // Top keywords
            keywords.slice(0, 10).forEach(([word, freq, percent]) => {
                wsKeywords.getCell(`A${keywordRow}`).value = word;
                wsKeywords.getCell(`B${keywordRow}`).value = freq;
                wsKeywords.getCell(`C${keywordRow}`).value = `${percent}%`;
                keywordRow++;
            });

            keywordRow += 2; // Space between categories
        });

        wsKeywords.getColumn('A').width = 20;
        wsKeywords.getColumn('B').width = 12;
        wsKeywords.getColumn('C').width = 12;

        // ============= SAVE FILE =============
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `dataset_berlabel_export_${timestamp}.xlsx`;
        const filepath = path.join(EXPORT_DIR, filename);

        console.log('💾 Saving Excel file...');
        await workbook.xlsx.writeFile(filepath);

        console.log('\n✅ EXPORT COMPLETED SUCCESSFULLY!');
        console.log(`📁 File saved: ${filename}`);
        console.log(`📂 Location: ${filepath}`);
        console.log(`📊 Records exported: ${dataset.length}`);
        console.log(`📋 Sheets created: 3 (Dataset Lengkap, Statistik, Kata Kunci)`);

        // Show file info
        const fileStats = await fs.stat(filepath);
        const fileSizeKB = (fileStats.size / 1024).toFixed(2);
        console.log(`📦 File size: ${fileSizeKB} KB`);

        return {
            success: true,
            filename,
            filepath,
            records: dataset.length,
            fileSize: fileSizeKB
        };

    } catch (error) {
        console.error('❌ EXPORT FAILED:', error.message);
        throw error;
    }
}

function calculateDatasetStatistics(dataset) {
    const stats = {
        total: dataset.length,
        categoryDistribution: {},
        textLengths: [],
        timestamps: [],
        uniqueWords: new Set()
    };

    dataset.forEach(item => {
        // Category distribution
        const category = item.Kategori || item.kategori || 'Unknown';
        stats.categoryDistribution[category] = (stats.categoryDistribution[category] || 0) + 1;

        // Text length analysis
        const textLength = (item.deskripsi || '').length;
        stats.textLengths.push(textLength);

        // Collect timestamps
        if (item.timestamp) {
            stats.timestamps.push(new Date(item.timestamp));
        }

        // Unique words
        const words = (item.deskripsi || '').toLowerCase().split(/\s+/);
        words.forEach(word => {
            if (word.length > 2) { // Only words with 3+ characters
                stats.uniqueWords.add(word.replace(/[^a-z]/g, ''));
            }
        });
    });

    // Calculate derived statistics
    stats.avgTextLength = Math.round(stats.textLengths.reduce((a, b) => a + b, 0) / stats.textLengths.length);
    stats.minTextLength = Math.min(...stats.textLengths);
    stats.maxTextLength = Math.max(...stats.textLengths);
    stats.uniqueWords = stats.uniqueWords.size;

    // Date range
    if (stats.timestamps.length > 0) {
        const sortedDates = stats.timestamps.sort();
        stats.dateRange = {
            start: sortedDates[0].toLocaleDateString('id-ID'),
            end: sortedDates[sortedDates.length - 1].toLocaleDateString('id-ID')
        };
    } else {
        stats.dateRange = { start: 'N/A', end: 'N/A' };
    }

    return stats;
}

function analyzeKeywordsByCategory(dataset) {
    const categoryKeywords = {};

    // Group by category
    dataset.forEach(item => {
        const category = item.Kategori || item.kategori || 'Unknown';
        if (!categoryKeywords[category]) {
            categoryKeywords[category] = [];
        }
        
        const text = (item.deskripsi || '').toLowerCase();
        const words = text.split(/\s+/).filter(word => word.length > 3); // Words with 4+ chars
        categoryKeywords[category].push(...words);
    });

    // Calculate frequency for each category
    const result = {};
    Object.entries(categoryKeywords).forEach(([category, words]) => {
        const frequency = {};
        words.forEach(word => {
            const cleanWord = word.replace(/[^a-z]/g, '');
            if (cleanWord.length > 3) {
                frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
            }
        });

        // Sort by frequency and calculate percentages
        const totalWords = Object.values(frequency).reduce((a, b) => a + b, 0);
        result[category] = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15) // Top 15 words
            .map(([word, freq]) => [word, freq, ((freq / totalWords) * 100).toFixed(1)]);
    });

    return result;
}

// Run export if called directly
if (require.main === module) {
    exportDatasetToExcel().catch(console.error);
}

module.exports = { exportDatasetToExcel };