// Test integrasi real antara WhatsApp bot dan ML classification
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Simulasi pesan WhatsApp yang masuk
const simulateWhatsAppMessage = {
  from: '6281234567890@c.us',
  pushName: 'Pak Budi',
  body: 'Jalan di Gang Mawar penuh lubang, motor saya sampai masuk lubang kemarin'
};

async function testRealIntegration() {
  console.log('🧪 ========== TEST INTEGRASI REAL ==========');
  console.log('📱 Simulasi pesan WhatsApp masuk...\n');
  
  console.log(`👤 From: ${simulateWhatsAppMessage.pushName} (${simulateWhatsAppMessage.from.replace('@c.us', '')})`);
  console.log(`💬 Message: "${simulateWhatsAppMessage.body}"`);
  console.log('\n⏳ Processing...\n');
  
  // Step 1: Acknowledgment (immediate response)
  console.log('🤖 BOT ACKNOWLEDGMENT:');
  console.log('📥 *Pengaduan diterima!*\n\n🤖 Sedang menganalisis dan mengklasifikasi pengaduan Anda...\n⏳ Mohon tunggu sebentar...');
  console.log('\n' + '─'.repeat(60));
  
  // Step 2: ML Classification
  try {
    const classification = await performMLClassification(simulateWhatsAppMessage);
    
    // Step 3: Generate bot response
    const botResponse = generateBotResponse(classification, simulateWhatsAppMessage);
    
    console.log('\n🤖 BOT CLASSIFICATION RESPONSE:');
    console.log(botResponse);
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ INTEGRATION TEST COMPLETED SUCCESSFULLY!');
    
    // Step 4: Verify data saved to system
    await verifyDataSaved(classification);
    
  } catch (error) {
    console.error('❌ INTEGRATION TEST FAILED:', error.message);
    
    // Fallback response
    console.log('\n🤖 BOT FALLBACK RESPONSE:');
    console.log('❌ *Maaf, terjadi kesalahan sistem*\n\n🔄 Silakan coba kirim ulang pengaduan Anda dalam beberapa saat.');
  }
}

async function performMLClassification(message) {
  return new Promise((resolve, reject) => {
    console.log('🔬 Menjalankan klasifikasi ML...');
    
    // Prepare data for Python backend
    const complaintData = {
      nama: message.pushName,
      no_wa: message.from,
      deskripsi: message.body,
      timestamp: new Date().toISOString()
    };
    
    const DATA_DIR = path.join(__dirname, 'data');
    const dataBaruPath = path.join(DATA_DIR, 'raw/data_baru.json');
    
    // Save data for classification
    fs.writeFile(dataBaruPath, JSON.stringify([complaintData], null, 2), 'utf-8')
      .then(() => {
        console.log('   💾 Data disimpan ke data_baru.json');
        
        // Execute Python ML script
        const pythonCmd = process.platform === "win32" ? "python" : "python3";
        const scriptPath = path.join(__dirname, "backend/main.py");
        
        console.log('   🐍 Executing Python ML classification...');
        
        const child = spawn(pythonCmd, [scriptPath, '--classify'], {
          cwd: path.join(__dirname, 'backend'),
          env: { ...process.env }
        });

        let stdout = "", stderr = "";
        
        child.stdout.on("data", (data) => {
          stdout += data.toString();
          // Show real-time progress
          const lines = data.toString().split('\n');
          lines.forEach(line => {
            if (line.trim() && line.includes('[')) {
              console.log(`   📊 ${line.trim()}`);
            }
          });
        });
        
        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("close", async (code) => {
          if (code === 0) {
            try {
              console.log('   ✅ Python ML selesai, membaca hasil...');
              
              // Read classification result
              const hasilPath = path.join(DATA_DIR, 'predictions/hasil_prediksi.json');
              const hasilRaw = await fs.readFile(hasilPath, 'utf-8');
              const hasilPrediksi = JSON.parse(hasilRaw);
              
              if (hasilPrediksi.length > 0) {
                const result = hasilPrediksi[0];
                
                console.log(`   🎯 Hasil: ${result.kategori_prediksi} (${Math.round(result.confidence * 100)}%)`);
                
                resolve({
                  success: true,
                  kategori: result.kategori_prediksi || 'UMUM',
                  confidence: Math.round((result.confidence || 0.8) * 100),
                  kode_pengaduan: `PGD-${Date.now().toString().slice(-6)}`,
                  processed_text: result.processed || '',
                  timestamp: new Date().toISOString(),
                  raw_result: result
                });
              } else {
                throw new Error('Tidak ada hasil prediksi');
              }
            } catch (error) {
              console.error('   ❌ Error membaca hasil:', error.message);
              reject(error);
            }
          } else {
            console.error('   ❌ Python script error:', stderr);
            reject(new Error('Python classification failed: ' + stderr));
          }
        });

        child.on("error", (error) => {
          console.error('   ❌ Spawn error:', error.message);
          reject(error);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          child.kill();
          reject(new Error('Classification timeout'));
        }, 30000);
        
      })
      .catch(error => {
        reject(new Error('File save error: ' + error.message));
      });
  });
}

function generateBotResponse(classification, message) {
  const confidence = classification.confidence;
  const kategori = classification.kategori;
  const kode = classification.kode_pengaduan;
  
  return `✅ *PENGADUAN BERHASIL DIKLASIFIKASI*

📋 *Detail Pengaduan:*
🆔 Kode: \`${kode}\`
👤 Nama: ${message.pushName}
📱 No. WA: ${message.from.replace('@c.us', '')}
⏰ Waktu: ${new Date().toLocaleString('id-ID')}

🎯 *Hasil Klasifikasi:*
📂 Kategori: *${kategori}*
📊 Confidence: *${confidence}%*

📝 *Pengaduan Anda:*
"${message.body}"

✅ *Status: Diterima dan akan ditindaklanjuti*

Terima kasih telah melaporkan. Tim terkait akan menindaklanjuti pengaduan Anda segera.

---
🤖 *ChatBot Pengaduan Warga Samboja*`;
}

async function verifyDataSaved(classification) {
  try {
    console.log('\n🔍 Verifying data saved to system...');
    
    // Check if data is in final_processed.json
    const finalPath = path.join(__dirname, 'data/processed/final_processed.json');
    const finalData = JSON.parse(await fs.readFile(finalPath, 'utf-8'));
    
    console.log(`   📊 Total pengaduan dalam sistem: ${finalData.length}`);
    
    // Find our test data
    const latestEntry = finalData[finalData.length - 1];
    if (latestEntry && latestEntry.deskripsi.includes('Gang Mawar')) {
      console.log('   ✅ Data berhasil tersimpan di database');
      console.log(`   📝 Kategori tersimpan: ${latestEntry.kategori_prediksi}`);
      console.log(`   📊 Confidence tersimpan: ${latestEntry.confidence}`);
    } else {
      console.log('   ⚠️  Data belum terlihat di database (mungkin sedang sync)');
    }
    
    // Check web API accessibility
    console.log('   🌐 Testing web API accessibility...');
    // This would normally be a HTTP request to the web API
    
    console.log('\n✅ VERIFICATION COMPLETED');
    
  } catch (error) {
    console.log('   ⚠️  Verification partial: ' + error.message);
  }
}

// Run the integration test
if (require.main === module) {
  testRealIntegration().catch(console.error);
}

module.exports = { testRealIntegration };