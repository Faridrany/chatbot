const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Path setup
const DATA_DIR = path.join(__dirname, 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const BACKEND_DIR = path.join(__dirname, 'backend');

// Test function untuk klasifikasi pengaduan
async function testClassification() {
  console.log('🧪 ========== TEST KLASIFIKASI PENGADUAN ==========');
  
  const testComplaints = [
    {
      nama: 'John Doe',
      no_wa: '6281234567890@c.us',
      deskripsi: 'Lampu PJU di Gang Mawar mati total sudah 3 hari. Warga takut lewat malam hari karena gelap.',
      expected: 'INFRASTRUKTUR'
    },
    {
      nama: 'Jane Smith', 
      no_wa: '6285678901234@c.us',
      deskripsi: 'Ada tumpukan sampah di pinggir jalan Karya Jaya yang sudah menimbulkan bau busuk.',
      expected: 'LINGKUNGAN'
    },
    {
      nama: 'Bob Wilson',
      no_wa: '6289876543210@c.us', 
      deskripsi: 'Sekelompok remaja sering buat keributan dan mabuk-mabukan di depan rumah warga.',
      expected: 'KEAMANAN'
    },
    {
      nama: 'Alice Brown',
      no_wa: '6287654321098@c.us',
      deskripsi: 'Pelayanan di kantor kelurahan sangat lambat, sudah menunggu 3 jam belum dilayani.',
      expected: 'PELAYANAN'
    }
  ];
  
  for (let i = 0; i < testComplaints.length; i++) {
    const complaint = testComplaints[i];
    
    console.log(`\n📋 TEST ${i + 1}/4: ${complaint.expected}`);
    console.log(`👤 Nama: ${complaint.nama}`);
    console.log(`📱 No WA: ${complaint.no_wa.replace('@c.us', '')}`);
    console.log(`📝 Pengaduan: "${complaint.deskripsi}"`);
    console.log(`🎯 Ekspektasi: ${complaint.expected}`);
    console.log('⏳ Memproses klasifikasi...\n');
    
    try {
      const result = await classifyComplaint(complaint);
      
      console.log('✅ HASIL KLASIFIKASI:');
      console.log(`📂 Kategori: ${result.kategori}`);
      console.log(`📊 Confidence: ${result.confidence}%`);
      console.log(`🆔 Kode: ${result.kode_pengaduan}`);
      console.log(`⏰ Waktu: ${new Date(result.timestamp).toLocaleString('id-ID')}`);
      
      // Cek akurasi
      const isAccurate = result.kategori === complaint.expected;
      console.log(`${isAccurate ? '✅' : '❌'} Akurasi: ${isAccurate ? 'BENAR' : 'SALAH'}`);
      
      if (!isAccurate) {
        console.log(`   Expected: ${complaint.expected}, Got: ${result.kategori}`);
      }
      
    } catch (error) {
      console.error('❌ ERROR:', error.message);
    }
    
    console.log('─'.repeat(60));
  }
  
  console.log('\n🎉 TEST SELESAI!\n');
}

// Fungsi klasifikasi yang sama seperti di bot
async function classifyComplaint(complaint) {
  return new Promise((resolve, reject) => {
    try {
      // Simpan data untuk klasifikasi
      const dataBaru = [complaint];
      const dataBaruPath = path.join(RAW_DIR, 'data_baru.json');
      
      fs.writeFile(dataBaruPath, JSON.stringify(dataBaru, null, 2), 'utf-8')
        .then(() => {
          console.log('   💾 Data disimpan, menjalankan Python ML...');
          
          const pythonCmd = process.platform === "win32" ? "python" : "python3";
          const scriptPath = path.join(BACKEND_DIR, "main.py");
          
          const child = spawn(pythonCmd, [scriptPath, '--classify'], {
            cwd: BACKEND_DIR,
            env: { ...process.env }
          });

          let stdout = "", stderr = "";
          
          child.stdout.on("data", (data) => {
            stdout += data.toString();
          });
          
          child.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          child.on("close", async (code) => {
            if (code === 0) {
              try {
                console.log('   🤖 Python selesai, membaca hasil...');
                
                const hasilPath = path.join(DATA_DIR, 'predictions/hasil_prediksi.json');
                const hasilRaw = await fs.readFile(hasilPath, 'utf-8');
                const hasilPrediksi = JSON.parse(hasilRaw);
                
                if (hasilPrediksi.length > 0) {
                  const result = hasilPrediksi[0]; // Ambil hasil pertama
                  resolve({
                    success: true,
                    kategori: result.kategori_prediksi || result.Kategori || 'UMUM',
                    confidence: Math.round((result.confidence || 0.8) * 100),
                    kode_pengaduan: result.kode_pengaduan || 'PGD-TEST',
                    processed_text: result.processed || '',
                    timestamp: result.timestamp || new Date().toISOString()
                  });
                } else {
                  throw new Error('Tidak ada hasil prediksi');
                }
              } catch (error) {
                reject(new Error('Error membaca hasil: ' + error.message));
              }
            } else {
              reject(new Error('Python error: ' + (stderr || 'Unknown')));
            }
          });

          child.on("error", (error) => {
            reject(new Error('Spawn error: ' + error.message));
          });

          setTimeout(() => {
            child.kill();
            reject(new Error('Timeout'));
          }, 30000);
          
        })
        .catch(error => {
          reject(new Error('File save error: ' + error.message));
        });
        
    } catch (error) {
      reject(error);
    }
  });
}

// Jalankan test
if (require.main === module) {
  testClassification().catch(console.error);
}

module.exports = { testClassification, classifyComplaint };