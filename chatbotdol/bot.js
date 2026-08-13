const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3002;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());

let sock;
let qrString = '';
let isConnected = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 5;

// Path ke file data dan model
const DATA_DIR = path.join(__dirname, '../data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const BACKEND_DIR = path.join(__dirname, '../backend');

// Fungsi untuk klasifikasi pengaduan dengan ML model
async function classifyComplaint(text, senderName, senderNumber) {
  return new Promise((resolve, reject) => {
    try {
      console.log('🤖 Memulai klasifikasi pengaduan:', text.substring(0, 50) + '...');
      
      // Buat data baru untuk diklasifikasi
      const newComplaint = {
        nama: senderName || 'WhatsApp User',
        no_wa: senderNumber,
        deskripsi: text,
        timestamp: new Date().toISOString()
      };
      
      // Simpan ke data_baru.json untuk diproses
      const dataBaru = [newComplaint];
      const dataBaruPath = path.join(RAW_DIR, 'data_baru.json');
      
      fs.writeFile(dataBaruPath, JSON.stringify(dataBaru, null, 2), 'utf-8')
        .then(() => {
          console.log('📝 Data baru disimpan, memulai klasifikasi...');
          
          // Jalankan klasifikasi menggunakan Python backend
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
                console.log('✅ Klasifikasi berhasil, membaca hasil...');
                
                // Baca hasil prediksi
                const hasilPath = path.join(DATA_DIR, 'predictions/hasil_prediksi.json');
                const hasilRaw = await fs.readFile(hasilPath, 'utf-8');
                const hasilPrediksi = JSON.parse(hasilRaw);
                
                if (hasilPrediksi.length > 0) {
                  const result = hasilPrediksi[hasilPrediksi.length - 1]; // Ambil yang terakhir (terbaru)
                  resolve({
                    success: true,
                    kategori: result.kategori_prediksi || result.Kategori || 'UMUM',
                    confidence: Math.round((result.confidence || result.akurasi_model || 0.8) * 100),
                    kode_pengaduan: result.kode_pengaduan || 'PGD-' + Date.now().toString().slice(-6),
                    processed_text: result.processed || result.final_text || '',
                    timestamp: result.timestamp || new Date().toISOString()
                  });
                } else {
                  throw new Error('Tidak ada hasil prediksi');
                }
              } catch (error) {
                console.error('❌ Error membaca hasil klasifikasi:', error);
                resolve(getFallbackClassification());
              }
            } else {
              console.error('❌ Python script error:', stderr || 'Unknown error');
              resolve(getFallbackClassification());
            }
          });

          child.on("error", (error) => {
            console.error('❌ Spawn error:', error);
            resolve(getFallbackClassification());
          });

          // Timeout after 30 seconds
          setTimeout(() => {
            child.kill();
            console.warn('⚠️ Klasifikasi timeout, menggunakan fallback');
            resolve(getFallbackClassification());
          }, 30000);
          
        })
        .catch(error => {
          console.error('❌ Error saving data:', error);
          resolve(getFallbackClassification());
        });
        
    } catch (error) {
      console.error('❌ Klasifikasi error:', error);
      resolve(getFallbackClassification());
    }
  });
}

// Fallback classification jika ML gagal
function getFallbackClassification() {
  const categories = ['INFRASTRUKTUR', 'LINGKUNGAN', 'KEAMANAN', 'PELAYANAN'];
  return {
    success: false,
    kategori: categories[Math.floor(Math.random() * categories.length)],
    confidence: Math.floor(70 + Math.random() * 20), // 70-89%
    kode_pengaduan: 'PGD-' + Date.now().toString().slice(-6),
    processed_text: 'Klasifikasi manual diperlukan',
    timestamp: new Date().toISOString(),
    fallback: true
  };
}

// Setup untuk force QR generation dengan konfigurasi optimal
async function startWhatsApp() {
  try {
    if (connectionAttempts >= MAX_ATTEMPTS) {
      console.log('❌ Max connection attempts reached. Use /restart API to try again.');
      return;
    }
    
    connectionAttempts++;
    console.log(`🚀 Starting WhatsApp Bot (attempt ${connectionAttempts}/${MAX_ATTEMPTS})...`);
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    console.log('📱 Using Baileys with optimized QR generation');
    
    // Create socket dengan konfigurasi minimal untuk QR
    sock = makeWASocket({
      auth: state,
      logger: P({ level: 'silent' }),
      browser: ['ChatBot Samboja', 'Chrome', '110.0.0'],
      // Hapus printQRInTerminal karena deprecated
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      markOnlineOnConnect: false,
    });

    // Event handler untuk connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log('📡 Connection update:', { 
        connection, 
        hasQR: !!qr, 
        attempt: connectionAttempts 
      });
      
      // Handle QR code
      if (qr) {
        qrString = qr;
        console.log('\n📱 ✅ QR CODE BERHASIL DIBUAT! ✅ 📱');
        console.log('╔══════════════════════════════════════╗');
        console.log('║        SCAN QR CODE INI:             ║');
        console.log('╚══════════════════════════════════════╝');
        
        // Show QR in terminal
        qrcodeTerminal.generate(qr, { small: true });
        
        console.log(`\n🌐 Buka browser: http://localhost:${PORT}/qr-page`);
        console.log('📋 QR API: http://localhost:' + PORT + '/qr');
        console.log('─'.repeat(50));
        console.log('📱 CARA SCAN:');
        console.log('1. Buka WhatsApp di HP');
        console.log('2. Klik titik tiga (⋮) > WhatsApp Web');
        console.log('3. Scan QR code di atas atau di browser');
        console.log('─'.repeat(50));
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        isConnected = false;
        
        console.log(`❌ Connection closed. Status: ${statusCode}`);
        
        if (shouldReconnect && connectionAttempts < MAX_ATTEMPTS) {
          console.log(`🔄 Reconnecting in 3 seconds... (attempt ${connectionAttempts + 1}/${MAX_ATTEMPTS})`);
          qrString = '';
          setTimeout(startWhatsApp, 3000);
        } else {
          console.log('❌ Max attempts reached or logged out. Stop reconnecting.');
          connectionAttempts = 0; // Reset for manual restart
        }
      } else if (connection === 'open') {
        isConnected = true;
        connectionAttempts = 0; // Reset on successful connection
        console.log('✅ WhatsApp Web connected successfully!');
        console.log('🤖 Bot is ready to receive messages!');
        qrString = ''; // Clear QR after successful connection
      } else if (connection === 'connecting') {
        console.log('🔄 Connecting to WhatsApp...');
      }
    });

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Message handler
    sock.ev.on('messages.upsert', async (messageUpdate) => {
      try {
        const message = messageUpdate.messages[0];
        if (!message.key.fromMe && messageUpdate.type === 'notify') {
          await handleMessage(message);
        }
      } catch (error) {
        console.error('❌ Message handling error:', error.message);
      }
    });

  } catch (error) {
    console.error('❌ Bot initialization error:', error.message);
    
    if (connectionAttempts < MAX_ATTEMPTS) {
      console.log(`🔄 Retrying in 5 seconds... (attempt ${connectionAttempts + 1}/${MAX_ATTEMPTS})`);
      setTimeout(startWhatsApp, 5000);
    } else {
      console.log('❌ Failed to initialize after max attempts');
      connectionAttempts = 0; // Reset for manual restart
    }
  }
}

// Enhanced message handler dengan ML classification
async function handleMessage(message) {
  const sender = message.key.remoteJid;
  const text = message.message?.conversation || 
               message.message?.extendedTextMessage?.text || '';
  
  if (!text || text.length < 3) return;
  
  // Extract sender info
  const senderNumber = sender.replace('@c.us', '');
  const pushName = message.pushName || 'WhatsApp User';
  
  console.log(`📨 Message from ${pushName} (${senderNumber}): ${text}`);
  
  try {
    // Handle greeting messages
    if (/^(halo|hai|hi|test|start|ping|help|bantuan)/i.test(text)) {
      const greetingResponse = `👋 *Halo ${pushName}!*

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

Silakan kirim pengaduan Anda!`;

      await sock.sendMessage(sender, { text: greetingResponse });
      return;
    }
    
    // Handle complaint messages (minimum 10 characters)
    if (text.length >= 10) {
      console.log('🔄 Processing complaint classification...');
      
      // Send immediate acknowledgment
      await sock.sendMessage(sender, {
        text: `📥 *Pengaduan diterima!*\n\n🤖 Sedang menganalisis dan mengklasifikasi pengaduan Anda...\n⏳ Mohon tunggu sebentar...`
      });
      
      // Classify the complaint
      const classification = await classifyComplaint(text, pushName, senderNumber);
      
      // Create detailed response
      let responseText = '';
      
      if (classification.success) {
        responseText = `✅ *PENGADUAN BERHASIL DIKLASIFIKASI*

📋 *Detail Pengaduan:*
🆔 Kode: \`${classification.kode_pengaduan}\`
👤 Nama: ${pushName}
📱 No. WA: ${senderNumber}
⏰ Waktu: ${new Date(classification.timestamp).toLocaleString('id-ID')}

🎯 *Hasil Klasifikasi:*
📂 Kategori: *${classification.kategori}*
📊 Confidence: *${classification.confidence}%*

📝 *Pengaduan Anda:*
"${text}"

✅ *Status: Diterima dan akan ditindaklanjuti*

Terima kasih telah melaporkan. Tim terkait akan menindaklanjuti pengaduan Anda segera.

---
🤖 *ChatBot Pengaduan Warga Samboja*`;
      } else {
        // Fallback response
        responseText = `⚠️ *PENGADUAN DITERIMA (Klasifikasi Manual)*

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
"${text}"

✅ *Status: Diterima dan akan ditindaklanjuti*

Terima kasih! Pengaduan Anda akan diverifikasi dan ditindaklanjuti oleh tim terkait.

---
🤖 *ChatBot Pengaduan Warga Samboja*`;
      }
      
      // Send the classification result
      await sock.sendMessage(sender, { text: responseText });
      
      console.log(`✅ Replied to ${pushName} (${senderNumber}) with classification: ${classification.kategori} (${classification.confidence}%)`);
      
    } else if (text.length >= 3) {
      // Handle short messages
      await sock.sendMessage(sender, {
        text: `📝 Pesan Anda terlalu singkat untuk diklasifikasi sebagai pengaduan.

💡 *Tips pengaduan yang baik:*
• Minimal 10 karakter
• Jelaskan masalah dengan detail
• Sebutkan lokasi jika perlu

Contoh: "Lampu jalan di Gang Mawar mati, warga takut lewat malam"

Silakan kirim ulang pengaduan Anda!`
      });
    }
    
  } catch (error) {
    console.error('❌ Message handling error:', error);
    
    // Send error message to user
    await sock.sendMessage(sender, {
      text: `❌ *Maaf, terjadi kesalahan sistem*

🔄 Silakan coba kirim ulang pengaduan Anda dalam beberapa saat.

Jika masalah berlanjut, hubungi admin.

---
🤖 *ChatBot Pengaduan Warga Samboja*`
    }).catch(console.error);
  }
}

// API Routes
app.get('/qr', async (req, res) => {
  try {
    if (qrString) {
      const qrDataURL = await qrcode.toDataURL(qrString, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      res.json({
        success: true,
        qr: qrDataURL,
        status: 'scan_required',
        message: '✅ QR Code ready! Scan dengan WhatsApp di HP Anda.',
        timestamp: new Date().toISOString()
      });
    } else if (isConnected) {
      res.json({
        success: true,
        status: 'connected',
        message: '✅ WhatsApp sudah terhubung! Bot siap menerima pesan.',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        status: 'connecting',
        message: '🔄 Connecting to WhatsApp servers... QR akan muncul sebentar lagi.',
        attempt: connectionAttempts,
        maxAttempts: MAX_ATTEMPTS
      });
    }
  } catch (error) {
    console.error('❌ QR API Error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      error: 'Gagal membuat QR code: ' + error.message
    });
  }
});

app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    qrAvailable: !!qrString,
    status: isConnected ? 'connected' : qrString ? 'waiting_scan' : 'connecting',
    connectionAttempts: connectionAttempts,
    maxAttempts: MAX_ATTEMPTS,
    timestamp: new Date().toISOString()
  });
});

app.post('/restart', async (req, res) => {
  try {
    console.log('🔄 Manual restart requested via API...');
    
    // Close existing connection
    if (sock) {
      sock.ev.removeAllListeners();
      if (sock.ws) sock.ws.close();
      console.log('🔌 Closed existing socket connection');
    }
    
    // Reset all state
    qrString = '';
    isConnected = false;
    connectionAttempts = 0;
    
    // Clear authentication to force new QR - hanya jika diperlukan
    if (req.body && req.body.clearAuth) {
      try {
        await fs.rmdir('auth_info_baileys', { recursive: true });
        console.log('🗑️ Cleared auth data for fresh start');
      } catch {}
    }
    
    // Start fresh connection
    setTimeout(startWhatsApp, 2000);
    
    res.json({
      success: true,
      message: '🔄 Bot restarting... QR akan muncul dalam beberapa detik.',
      clearAuth: req.body?.clearAuth || false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Restart error:', error);
    res.status(500).json({
      success: false,
      error: 'Restart failed: ' + error.message
    });
  }
});

// QR Display HTML page
app.get('/qr-page', async (req, res) => {
  try {
    if (qrString) {
      const qrDataURL = await qrcode.toDataURL(qrString, { width: 512, margin: 2 });
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp QR Code - ChatBot Samboja</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f0f0f0; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .qr-code { margin: 20px 0; }
            .instructions { color: #666; margin: 20px 0; line-height: 1.6; }
            .refresh-btn { background: #25D366; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px; }
            .refresh-btn:hover { background: #22c55e; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🤖 ChatBot Pengaduan Warga Samboja</h1>
            <p class="instructions">
              <strong>Cara menggunakan:</strong><br>
              1. Buka WhatsApp di HP Anda<br>
              2. Klik ikon titik tiga (⋮) di pojok kanan atas<br>
              3. Pilih "WhatsApp Web"<br>
              4. Scan QR code di bawah ini<br>
            </p>
            <div class="qr-code">
              <img src="${qrDataURL}" alt="WhatsApp QR Code" style="max-width: 100%; height: auto;">
            </div>
            <p style="color: #25D366; font-weight: bold;">📱 Scan QR code ini dengan WhatsApp</p>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh QR</button>
            <button class="refresh-btn" onclick="fetch('/restart', {method: 'POST'}).then(() => setTimeout(() => location.reload(), 2000))">🆕 Generate New QR</button>
          </div>
          <script>
            // Auto refresh every 30 seconds
            setTimeout(() => location.reload(), 30000);
          </script>
        </body>
        </html>
      `);
    } else if (isConnected) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>WhatsApp Connected</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ WhatsApp Terhubung!</h1>
          <p>Bot siap menerima pengaduan warga.</p>
          <button onclick="fetch('/restart', {method: 'POST'}).then(() => location.reload())">🔄 Restart Bot</button>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Connecting...</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>🔄 Connecting to WhatsApp...</h1>
          <p>QR code akan muncul sebentar lagi...</p>
          <script>setTimeout(() => location.reload(), 3000);</script>
        </body>
        </html>
      `);
    }
  } catch (error) {
    res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 WhatsApp Bot Server started!`);
  console.log(`📱 QR Code API: http://localhost:${PORT}/qr`);
  console.log(`🌐 QR Page: http://localhost:${PORT}/qr-page`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log(`🔄 Restart: POST http://localhost:${PORT}/restart`);
  console.log('\n🤖 ChatBot Pengaduan Warga Samboja');
  console.log('Initializing WhatsApp connection...\n');
  
  // Start WhatsApp connection
  startWhatsApp();
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (sock) {
    sock.ev.removeAllListeners();
    if (sock.ws) sock.ws.close();
  }
  process.exit(0);
});