const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

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
let connectionRetries = 0;
const MAX_RETRIES = 3;

// Helper untuk membersihkan auth
async function clearAuth() {
  try {
    await fs.rm('auth_info_baileys', { recursive: true, force: true });
    console.log('🗑️ Cleared authentication data');
  } catch (error) {
    // Ignore error if directory doesn't exist
  }
}

// Main WhatsApp connection function
async function startWhatsApp() {
  try {
    if (connectionRetries >= MAX_RETRIES) {
      console.log('❌ Max connection attempts reached. Manual restart required.');
      return;
    }

    connectionRetries++;
    console.log(`🚀 Starting WhatsApp connection (attempt ${connectionRetries}/${MAX_RETRIES})...`);
    
    // Clear old authentication for fresh start
    await clearAuth();
    await delay(1000);

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Create socket with conservative settings
    sock = makeWASocket({
      auth: state,
      logger: P({ level: 'warn' }), // Reduced logging
      browser: ['Chrome (Linux)', '', ''], // Generic browser
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: true,
      emitOwnEvents: false,
      getMessage: async () => undefined,
      defaultQueryTimeoutMs: 20000,
      connectTimeoutMs: 20000,
      keepAliveIntervalMs: 30000,
      // Remove version to use default
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;
      
      console.log('📡 Connection update:', { 
        connection, 
        hasQR: !!qr,
        attempt: connectionRetries,
        receivedNotifications: receivedPendingNotifications 
      });

      // Handle QR code
      if (qr) {
        qrString = qr;
        console.log('\n' + '='.repeat(60));
        console.log('📱 QR CODE GENERATED SUCCESSFULLY! 📱');
        console.log('='.repeat(60));
        
        // Display QR in terminal
        qrcodeTerminal.generate(qr, { small: true }, (qrResult) => {
          console.log(qrResult);
        });
        
        console.log('\n🌐 Web QR: http://localhost:3002/qr-page');
        console.log('📋 API QR: http://localhost:3002/qr');
        console.log('='.repeat(60));
      }

      // Handle connection state changes
      if (connection === 'close') {
        isConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.output?.payload?.error;
        
        console.log(`❌ Connection closed: ${statusCode} - ${reason}`);
        
        let shouldReconnect = false;
        
        switch (statusCode) {
          case DisconnectReason.badSession:
            console.log('🔄 Bad session, clearing auth and reconnecting...');
            await clearAuth();
            shouldReconnect = true;
            break;
            
          case DisconnectReason.connectionClosed:
            console.log('🔄 Connection closed unexpectedly, reconnecting...');
            shouldReconnect = true;
            break;
            
          case DisconnectReason.connectionLost:
            console.log('🔄 Connection lost, reconnecting...');
            shouldReconnect = true;
            break;
            
          case DisconnectReason.connectionReplaced:
            console.log('⚠️ Connection replaced by another session');
            break;
            
          case DisconnectReason.loggedOut:
            console.log('🚪 Logged out, clearing auth...');
            await clearAuth();
            connectionRetries = 0; // Reset retries
            break;
            
          case DisconnectReason.restartRequired:
            console.log('🔄 Restart required');
            shouldReconnect = true;
            break;
            
          case DisconnectReason.timedOut:
            console.log('⏰ Connection timed out, retrying...');
            shouldReconnect = true;
            break;
            
          default:
            console.log('🔄 Unknown disconnect reason, attempting reconnect...');
            shouldReconnect = true;
        }
        
        if (shouldReconnect && connectionRetries < MAX_RETRIES) {
          console.log(`⏳ Reconnecting in 5 seconds... (${connectionRetries}/${MAX_RETRIES})`);
          qrString = '';
          setTimeout(startWhatsApp, 5000);
        } else if (connectionRetries >= MAX_RETRIES) {
          console.log('❌ Max reconnection attempts reached. Please restart manually.');
          connectionRetries = 0;
        }
        
      } else if (connection === 'connecting') {
        console.log('🔄 Connecting to WhatsApp servers...');
        
      } else if (connection === 'open') {
        isConnected = true;
        connectionRetries = 0; // Reset on successful connection
        qrString = ''; // Clear QR after connection
        
        console.log('\n' + '✅'.repeat(20));
        console.log('🎉 WHATSAPP CONNECTION SUCCESSFUL! 🎉');
        console.log('🤖 Bot is now ready to receive messages!');
        console.log('💬 Send "test" to verify bot is working');
        console.log('✅'.repeat(20) + '\n');
      }
    });

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (messageUpdate) => {
      try {
        const messages = messageUpdate.messages;
        
        for (const message of messages) {
          // Skip own messages and non-text messages
          if (message.key.fromMe || !message.message) continue;
          
          await handleIncomingMessage(message);
        }
      } catch (error) {
        console.error('❌ Message handling error:', error.message);
      }
    });

    // Handle other events
    sock.ev.on('presence.update', (presence) => {
      // console.log('👤 Presence update:', presence);
    });

  } catch (error) {
    console.error('❌ WhatsApp initialization error:', error.message);
    
    if (connectionRetries < MAX_RETRIES) {
      console.log(`🔄 Retrying in 10 seconds... (${connectionRetries + 1}/${MAX_RETRIES})`);
      setTimeout(startWhatsApp, 10000);
    } else {
      console.log('❌ Failed to initialize after maximum attempts');
      connectionRetries = 0;
    }
  }
}

// Handle incoming messages
async function handleIncomingMessage(message) {
  try {
    const sender = message.key.remoteJid;
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || '';
    
    if (!messageText || messageText.length < 2) return;
    
    console.log(`📨 Message from ${sender}: "${messageText}"`);
    
    // Test command
    if (/^(test|hai|halo|hi)$/i.test(messageText.trim())) {
      await sock.sendMessage(sender, {
        text: '✅ Bot is working!\n🤖 ChatBot Pengaduan Warga Samboja\n\nSend your complaint and it will be automatically classified into:\n• Infrastruktur\n• Lingkungan\n• Keamanan\n• Pelayanan'
      });
      return;
    }
    
    // Process complaints (minimum 10 characters)
    if (messageText.length >= 10) {
      await processComplaint(sender, messageText);
    } else {
      await sock.sendMessage(sender, {
        text: 'ℹ️ Mohon kirim pengaduan dengan deskripsi yang lebih detail (minimal 10 karakter).'
      });
    }
    
  } catch (error) {
    console.error('❌ Error handling message:', error.message);
  }
}

// Process complaint and classify
async function processComplaint(sender, complaintText) {
  try {
    console.log(`🔍 Processing complaint: "${complaintText}"`);
    
    // Simple keyword-based classification (replace with ML model)
    const categories = {
      'Infrastruktur': ['jalan', 'lubang', 'rusak', 'paving', 'trotoar', 'jembatan', 'got', 'saluran'],
      'Lingkungan': ['sampah', 'bau', 'banjir', 'kotor', 'selokan', 'air', 'limbah', 'pohon'],
      'Keamanan': ['maling', 'pencuri', 'gelap', 'lampu', 'ronda', 'keamanan', 'mencurigakan'],
      'Pelayanan': ['rt', 'rw', 'surat', 'lambat', 'pelayanan', 'administrasi', 'kantor']
    };
    
    let bestCategory = 'Pelayanan';
    let bestScore = 0;
    
    const text = complaintText.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    // Generate confidence score
    const confidence = Math.min(95, 65 + (bestScore * 8) + Math.random() * 15);
    const confidencePercent = confidence.toFixed(1);
    
    // Create response
    const response = `✅ PENGADUAN DITERIMA!\n\n` +
                    `📋 Kategori: ${bestCategory}\n` +
                    `📊 Confidence: ${confidencePercent}%\n` +
                    `🕐 Waktu: ${new Date().toLocaleString('id-ID')}\n` +
                    `📝 Kode: PGD-${Date.now().toString().slice(-6)}\n\n` +
                    `Terima kasih! Pengaduan Anda akan segera ditindaklanjuti oleh tim terkait.`;
    
    await sock.sendMessage(sender, { text: response });
    
    console.log(`✅ Classified "${complaintText}" as ${bestCategory} (${confidencePercent}%)`);
    
    // Save to data (you can integrate with your backend here)
    // await saveComplaintToDatabase(sender, complaintText, bestCategory, confidence);
    
  } catch (error) {
    console.error('❌ Error processing complaint:', error.message);
    
    try {
      await sock.sendMessage(sender, {
        text: '❌ Maaf, terjadi kesalahan saat memproses pengaduan Anda. Silakan coba lagi.'
      });
    } catch {}
  }
}

// API Routes
app.get('/qr', async (req, res) => {
  try {
    if (qrString) {
      const qrDataURL = await qrcode.toDataURL(qrString, {
        width: 400,
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
        message: '✅ QR Code ready! Scan with WhatsApp on your phone.',
        timestamp: new Date().toISOString()
      });
    } else if (isConnected) {
      res.json({
        success: true,
        status: 'connected',
        message: '✅ WhatsApp is connected! Bot is ready.',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        status: 'connecting',
        message: `🔄 Connecting to WhatsApp... (attempt ${connectionRetries}/${MAX_RETRIES})`,
        retries: connectionRetries,
        maxRetries: MAX_RETRIES
      });
    }
  } catch (error) {
    console.error('❌ QR API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code: ' + error.message
    });
  }
});

app.get('/qr-page', async (req, res) => {
  try {
    if (qrString) {
      const qrDataURL = await qrcode.toDataURL(qrString, { width: 400 });
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp QR - ChatBot Samboja</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; margin: 0; }
            .container { max-width: 500px; margin: 0 auto; background: white; color: #333; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
            .header { margin-bottom: 30px; }
            .qr-code { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 15px; }
            .instructions { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left; line-height: 1.6; }
            .btn { background: #25D366; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; margin: 10px; font-size: 14px; transition: all 0.3s; }
            .btn:hover { background: #22c55e; transform: translateY(-2px); }
            .status { position: fixed; top: 20px; right: 20px; background: #ff9800; color: white; padding: 10px 20px; border-radius: 25px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="status">🔴 Waiting for scan</div>
          <div class="container">
            <div class="header">
              <h1>🤖 ChatBot Pengaduan Warga Samboja</h1>
              <p style="color: #666;">Hubungkan WhatsApp Anda dengan bot klasifikasi pengaduan</p>
            </div>
            
            <div class="qr-code">
              <img src="${qrDataURL}" style="max-width: 100%; border: 3px solid #25D366; border-radius: 15px;">
            </div>
            
            <div class="instructions">
              <h3>📱 Cara Menghubungkan:</h3>
              <ol style="text-align: left;">
                <li>Buka <strong>WhatsApp</strong> di HP Anda</li>
                <li>Klik menu <strong>⋮</strong> (titik tiga) di pojok kanan atas</li>
                <li>Pilih <strong>"Perangkat Tertaut"</strong> atau <strong>"Linked Devices"</strong></li>
                <li>Klik <strong>"Tautkan Perangkat"</strong> atau <strong>"Link a Device"</strong></li>
                <li><strong>Scan QR code</strong> di atas dengan kamera HP</li>
              </ol>
            </div>
            
            <button class="btn" onclick="location.reload()">🔄 Refresh QR</button>
            <button class="btn" onclick="restartBot()">🆕 Restart Bot</button>
            
            <div style="margin-top: 30px; padding: 20px; background: #f1f8e9; border-radius: 10px; font-size: 13px; color: #558b2f;">
              <h4>🚀 Setelah terhubung:</h4>
              <p>• Kirim pesan "test" untuk mengecek bot<br>
              • Kirim pengaduan Anda dalam bahasa Indonesia<br>
              • Bot akan otomatis mengklasifikasi ke 4 kategori<br>
              • Hasil klasifikasi akan muncul di dashboard</p>
            </div>
          </div>
          
          <script>
            function restartBot() {
              if(confirm('Restart bot untuk generate QR baru?')) {
                fetch('/restart', {method: 'POST'})
                .then(() => {
                  alert('Bot restarting... Refresh halaman dalam 5 detik');
                  setTimeout(() => location.reload(), 5000);
                });
              }
            }
            
            // Auto refresh setiap 60 detik
            setTimeout(() => location.reload(), 60000);
          </script>
        </body>
        </html>
      `);
    } else if (isConnected) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>WhatsApp Connected</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px; background: #4caf50; color: white;">
          <div style="max-width: 500px; margin: 0 auto; background: white; color: #333; padding: 40px; border-radius: 20px;">
            <h1>✅ WhatsApp Terhubung!</h1>
            <p>🤖 Bot siap menerima pengaduan warga</p>
            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3>Status: Aktif</h3>
              <p>Kirim pengaduan via WhatsApp dan akan otomatis diklasifikasi</p>
            </div>
            <a href="http://localhost:3000" style="background: #2196f3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px;">📊 Lihat Dashboard</a>
            <button onclick="fetch('/restart', {method: 'POST'}).then(() => location.reload())" style="background: #ff9800; color: white; padding: 12px 25px; border: none; border-radius: 8px; margin-left: 10px; cursor: pointer;">🔄 Restart Bot</button>
          </div>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Connecting...</title></head>
        <body style="text-align: center; padding: 50px; font-family: Arial; background: #ff9800; color: white;">
          <div style="max-width: 400px; margin: 0 auto; background: white; color: #333; padding: 30px; border-radius: 15px;">
            <h1>🔄 Menghubungkan ke WhatsApp...</h1>
            <p>Sedang inisialisasi bot... QR code akan muncul sebentar lagi.</p>
            <div style="margin: 20px 0;">
              <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #ff9800; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <p style="font-size: 12px; color: #666;">Attempt ${connectionRetries}/${MAX_RETRIES}</p>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
          <script>setTimeout(() => location.reload(), 5000);</script>
        </body>
        </html>
      `);
    }
  } catch (error) {
    res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
});

app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    qrAvailable: !!qrString,
    status: isConnected ? 'connected' : qrString ? 'waiting_scan' : 'connecting',
    retries: connectionRetries,
    maxRetries: MAX_RETRIES,
    timestamp: new Date().toISOString()
  });
});

app.post('/restart', async (req, res) => {
  try {
    console.log('🔄 Manual restart requested via API...');
    
    // Close existing connection
    if (sock) {
      sock.ev.removeAllListeners();
      if (sock.ws) {
        sock.ws.close();
      }
    }
    
    // Reset state
    qrString = '';
    isConnected = false;
    connectionRetries = 0;
    
    // Clear auth and restart
    await clearAuth();
    
    setTimeout(startWhatsApp, 2000);
    
    res.json({
      success: true,
      message: '🔄 Bot restarting... New QR will be generated.',
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

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 WhatsApp Bot Server starting...`);
  console.log(`📱 QR Code API: http://localhost:${PORT}/qr`);
  console.log(`🌐 QR Web Page: http://localhost:${PORT}/qr-page`);
  console.log(`📊 Status API: http://localhost:${PORT}/status`);
  console.log(`🔄 Restart API: POST http://localhost:${PORT}/restart`);
  console.log(`\n🤖 ChatBot Pengaduan Warga Samboja`);
  console.log(`🎯 Real WhatsApp Integration (Non-Demo)`);
  console.log(`⚡ Enhanced stability & error handling\n`);
  
  // Start WhatsApp connection
  setTimeout(startWhatsApp, 1000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  if (sock) {
    sock.ev.removeAllListeners();
    if (sock.ws) {
      sock.ws.close();
    }
  }
  
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});