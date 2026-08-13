// Demo respons chatbot WhatsApp dengan klasifikasi ML
const fs = require('fs').promises;
const path = require('path');
const { classifyComplaint } = require('./test_classification.js');

function formatWhatsAppResponse(classification, pushName, senderNumber, originalText) {
  if (classification.success) {
    return `✅ *PENGADUAN BERHASIL DIKLASIFIKASI*

📋 *Detail Pengaduan:*
🆔 Kode: \`${classification.kode_pengaduan}\`
👤 Nama: ${pushName}
📱 No. WA: ${senderNumber}
⏰ Waktu: ${new Date(classification.timestamp).toLocaleString('id-ID')}

🎯 *Hasil Klasifikasi:*
📂 Kategori: *${classification.kategori}*
📊 Confidence: *${classification.confidence}%*

📝 *Pengaduan Anda:*
"${originalText}"

✅ *Status: Diterima dan akan ditindaklanjuti*

Terima kasih telah melaporkan. Tim terkait akan menindaklanjuti pengaduan Anda segera.

---
🤖 *ChatBot Pengaduan Warga Samboja*`;
  } else {
    return `⚠️ *PENGADUAN DITERIMA (Klasifikasi Manual)*

📋 *Detail Pengaduan:*
🆔 Kode: \`${classification.kode_pengaduan}\`
👤 Nama: ${pushName}
📱 No. WA: ${senderNumber}
⏰ Waktu: ${new Date().toLocaleString('id-ID')}

🎯 *Klasifikasi Sementara:*
📂 Kategori: *${classification.kategori}*
📊 Confidence: *${classification.confidence}%*
⚠️ Status: Perlu verifikasi manual

📝 *Pengaduan Anda:*
"${originalText}"

✅ *Status: Diterima dan akan ditindaklanjuti*

Terima kasih! Pengaduan Anda akan diverifikasi dan ditindaklanjuti oleh tim terkait.

---
🤖 *ChatBot Pengaduan Warga Samboja*`;
  }
}

async function demoChatbotResponses() {
  console.log('📱 ========== DEMO CHATBOT WHATSAPP RESPONSES ==========\n');
  
  const demoMessages = [
    {
      pushName: 'Pak Rahman',
      senderNumber: '6281234567890',
      text: 'Jalan di komplek Handil Bakti rusak parah, banyak lubang besar. Motor bisa masuk lubang.'
    },
    {
      pushName: 'Bu Sari',
      senderNumber: '6285678901234', 
      text: 'Ada bau busuk dari saluran air di Gang Melati. Kayanya ada yang mampet.'
    },
    {
      pushName: 'Bapak Andi',
      senderNumber: '6289876543210',
      text: 'Maling motor sering beraksi di parkiran pasar. Kemarin motor tetangga hilang lagi.'
    }
  ];
  
  for (let i = 0; i < demoMessages.length; i++) {
    const msg = demoMessages[i];
    
    console.log(`📱 DEMO PESAN ${i + 1}:`);
    console.log(`From: ${msg.pushName} (${msg.senderNumber})`);
    console.log(`Message: "${msg.text}"`);
    console.log('\n⏳ Bot sedang memproses...\n');
    
    // Simulate immediate acknowledgment
    console.log('🤖 BOT RESPONSE (Acknowledgment):');
    console.log('📥 *Pengaduan diterima!*\n\n🤖 Sedang menganalisis dan mengklasifikasi pengaduan Anda...\n⏳ Mohon tunggu sebentar...');
    console.log('\n' + '─'.repeat(70));
    
    try {
      const complaint = {
        nama: msg.pushName,
        no_wa: msg.senderNumber + '@c.us',
        deskripsi: msg.text,
        timestamp: new Date().toISOString()
      };
      
      const classification = await classifyComplaint(complaint);
      const response = formatWhatsAppResponse(classification, msg.pushName, msg.senderNumber, msg.text);
      
      console.log('\n🤖 BOT RESPONSE (Classification Result):');
      console.log(response);
      
    } catch (error) {
      console.log('\n❌ BOT RESPONSE (Error):');
      console.log(`❌ *Maaf, terjadi kesalahan sistem*

🔄 Silakan coba kirim ulang pengaduan Anda dalam beberapa saat.

Jika masalah berlanjut, hubungi admin.

---
🤖 *ChatBot Pengaduan Warga Samboja*`);
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
  }
  
  console.log('✨ DEMO SELESAI!\n');
  
  // Show greeting example
  console.log('📱 CONTOH PESAN GREETING:');
  console.log('From: User Baru (628123456789)');
  console.log('Message: "Halo"');
  console.log('\n🤖 BOT RESPONSE:');
  console.log(`👋 *Halo User Baru!*

🤖 *Selamat datang di ChatBot Pengaduan Warga Samboja*

✅ *Cara menggunakan:*
• Kirim pengaduan Anda dalam bentuk teks
• Bot akan otomatis mengklasifikasi kategori
• Anda akan menerima konfirmasi beserta detail

📋 *Kategori yang tersedia:*
🏗️ Infrastruktur (jalan, lampu, jembatan)
🌿 Lingkungan (sampah, polusi, kebersihan) 
🚨 Keamanan (kejahatan, gangguan ketertiban)
🏢 Pelayanan (administrasi, layanan publik)

💡 *Contoh pengaduan yang baik:*
"Lampu jalan di Gang Mawar mati sudah 3 hari, warga takut lewat malam hari"

Silakan kirim pengaduan Anda!`);
  
  console.log('\n🎯 FITUR YANG TELAH DIIMPLEMENTASI:');
  console.log('✅ Klasifikasi otomatis dengan Machine Learning');
  console.log('✅ Confidence score untuk setiap prediksi');
  console.log('✅ Kode pengaduan unik untuk tracking'); 
  console.log('✅ Response yang informatif dan user-friendly');
  console.log('✅ Error handling yang robust');
  console.log('✅ Greeting dan help messages');
  console.log('✅ Integrasi dengan backend Python ML');
  console.log('✅ Real-time classification');
}

// Jalankan demo
if (require.main === module) {
  demoChatbotResponses().catch(console.error);
}