const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
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

let client;
let qrString = '';
let isConnected = false;
let isInitializing = false;

// User conversation state management
const userSessions = new Map();
const MESSAGE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

// Conversation states
const STATES = {
  INITIAL: 'initial',
  WAITING_NAME: 'waiting_name',
  WAITING_COMPLAINT: 'waiting_complaint',
  COMPLAINT_RECEIVED: 'complaint_received',
  WAITING_CONFIRMATION: 'waiting_confirmation'
};

// User session structure
class UserSession {
  constructor(userId) {
    this.userId = userId;
    this.state = STATES.INITIAL;
    this.name = null;
    this.complaints = [];
    this.lastMessageTime = Date.now();
    this.currentComplaint = null;
  }
  
  updateActivity() {
    this.lastMessageTime = Date.now();
  }
  
  isExpired() {
    return (Date.now() - this.lastMessageTime) > MESSAGE_TIMEOUT;
  }
  
  reset() {
    this.state = STATES.INITIAL;
    this.name = null;
    this.currentComplaint = null;
    this.updateActivity();
  }
}

// Get or create user session
function getUserSession(userId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, new UserSession(userId));
  }
  
  const session = userSessions.get(userId);
  
  // Reset expired sessions
  if (session.isExpired() && session.state !== STATES.INITIAL) {
    session.reset();
  }
  
  session.updateActivity();
  return session;
}

// Clean up expired sessions periodically
setInterval(() => {
  for (const [userId, session] of userSessions.entries()) {
    if (session.isExpired()) {
      userSessions.delete(userId);
    }
  }
}, 60000); // Clean every minute
// Initialize WhatsApp client
async function initializeWhatsApp() {
  if (isInitializing) {
    console.log('⚠️ Already initializing, please wait...');
    return;
  }

  isInitializing = true;
  console.log('🚀 Initializing Conversational WhatsApp Bot...');

  try {
    // Tidak hapus session lama, biarkan persist untuk reconnect
    console.log('🔄 Using existing session if available');

    client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'chatbot-samboja-conv'
      }),
      puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security'
        ]
      }
    });

    // QR Code generation
    client.on('qr', async (qr) => {
      qrString = qr;
      console.log('\n' + '='.repeat(60));
      console.log('📱 QR CODE GENERATED! 📱');
      console.log('='.repeat(60));
      
      // Generate QR in terminal
      const QRCode = require('qrcode-terminal');
      QRCode.generate(qr, { small: true });
      
      console.log('\n🌐 Web QR: http://localhost:3002/qr-page');
      console.log('📋 API QR: http://localhost:3002/qr');
      console.log('='.repeat(60));
    });

    // Client ready
    client.on('ready', () => {
      isConnected = true;
      qrString = '';
      isInitializing = false;
      
      console.log('\n' + '✅'.repeat(20));
      console.log('🎉 CONVERSATIONAL WHATSAPP BOT READY! 🎉');
      console.log('🤖 Bot with conversation flow is active!');
      console.log('💬 Try: "Halo" to start conversation');
      console.log('✅'.repeat(20) + '\n');
    });
    // Authentication events
    client.on('authenticated', () => {
      console.log('✅ WhatsApp authentication successful!');
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
      isInitializing = false;
      setTimeout(() => {
        console.log('🔄 Restarting after auth failure...');
        initializeWhatsApp();
      }, 5000);
    });

    client.on('disconnected', (reason) => {
      console.log('❌ Client disconnected:', reason);
      isConnected = false;
      isInitializing = false;
      setTimeout(() => {
        console.log('🔄 Auto-restarting client...');
        initializeWhatsApp();
      }, 10000);
    });

    // Incoming messages
    client.on('message', async (message) => {
      try {
        await handleConversationalMessage(message);
      } catch (error) {
        console.error('❌ Message handling error:', error.message);
      }
    });

    // Loading screen
    client.on('loading_screen', (percent, message) => {
      console.log(`⏳ Loading: ${percent}% - ${message}`);
    });

    // Start the client
    await client.initialize();

  } catch (error) {
    console.error('❌ WhatsApp initialization error:', error.message);
    isInitializing = false;
    setTimeout(() => {
      console.log('🔄 Retrying initialization...');
      initializeWhatsApp();
    }, 15000);
  }
}
// Main conversational message handler
async function handleConversationalMessage(message) {
  try {
    // Skip own messages, group messages, and status
    if (message.fromMe || message.from.includes('@g.us') || message.isStatus) {
      console.log('🚫 Skipped:', message.from.includes('@g.us') ? 'Group message' : 'Own message/Status');
      return;
    }

    // Skip old messages (older than 2 minutes)
    const messageTime = message.timestamp * 1000; // Convert to milliseconds
    const now = Date.now();
    if ((now - messageTime) > MESSAGE_TIMEOUT) {
      console.log('🕐 Skipped old message:', new Date(messageTime).toLocaleString());
      return;
    }

    const sender = message.from;
    const messageBody = (message.body || '').trim();
    const session = getUserSession(sender);
    
    console.log(`📨 [${session.state}] Message from ${sender}: "${messageBody}"`);
    
    // Route to appropriate handler based on conversation state
    switch (session.state) {
      case STATES.INITIAL:
        await handleInitialMessage(message, session, messageBody);
        break;
      
      case STATES.WAITING_NAME:
        await handleNameInput(message, session, messageBody);
        break;
        
      case STATES.WAITING_COMPLAINT:
        await handleComplaintInput(message, session, messageBody);
        break;
        
      case STATES.WAITING_CONFIRMATION:
        await handleConfirmation(message, session, messageBody);
        break;
        
      default:
        await handleInitialMessage(message, session, messageBody);
    }
    
  } catch (error) {
    console.error('❌ Error in handleConversationalMessage:', error.message);
  }
}
// Handle initial greeting
async function handleInitialMessage(message, session, messageBody) {
  // Check for greeting keywords
  const greetings = ['halo', 'hai', 'hello', 'hi', 'selamat', 'pagi', 'siang', 'sore', 'malam'];
  const isGreeting = greetings.some(greeting => 
    messageBody.toLowerCase().includes(greeting)
  );
  
  if (isGreeting || session.state === STATES.INITIAL) {
    session.state = STATES.WAITING_NAME;
    
    await message.reply(`👋 *Selamat datang di ChatBot Pengaduan Warga Samboja!*

🤖 Saya akan membantu Anda melaporkan pengaduan dengan sistem klasifikasi otomatis.

📝 *Untuk memulai, silakan ketik nama lengkap Anda:*`);
    
    console.log(`✅ Sent greeting to ${message.from}`);
  } else {
    // Handle non-greeting as potential complaint
    await handleComplaintInput(message, session, messageBody);
  }
}

// Handle name input
async function handleNameInput(message, session, messageBody) {
  if (messageBody.length < 2) {
    await message.reply('ℹ️ Mohon masukkan nama lengkap Anda (minimal 2 karakter):');
    return;
  }
  
  // Validate name (only letters and spaces)
  if (!/^[a-zA-Z\s]+$/.test(messageBody)) {
    await message.reply('ℹ️ Nama hanya boleh berisi huruf dan spasi. Silakan masukkan nama yang valid:');
    return;
  }
  
  session.name = messageBody;
  session.state = STATES.WAITING_COMPLAINT;
  
  await message.reply(`✅ Terima kasih, *${session.name}*!

📋 Sekarang silakan sampaikan pengaduan Anda dengan detail:

*Contoh yang baik:*
• "Jalan di RT 03 rusak parah, banyak lubang besar"
• "Lampu jalan di Gang Mawar mati sejak 3 hari"
• "Sampah menumpuk di TPS dekat masjid"

💡 *Tips:* Berikan deskripsi yang jelas agar bisa diklasifikasi dengan tepat.`);
  
  console.log(`✅ Name saved for ${message.from}: ${session.name}`);
}
// Handle complaint input
async function handleComplaintInput(message, session, messageBody) {
  // Check if complaint is too short
  if (messageBody.length < 10) {
    await message.reply(`⚠️ *Deskripsi terlalu singkat!*

📝 Mohon berikan deskripsi yang lebih detail (minimal 10 karakter) agar pengaduan dapat diproses dengan baik.

*Contoh:*
• "Jalan berlubang di depan rumah no 15"
• "Air PAM keruh dan berbau aneh"

Silakan coba lagi:`);
    return;
  }
  
  // Generate complaint code and timestamp
  const complaintCode = generateComplaintCode();
  const timestamp = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta'
  });
  
  // Save unclassified complaint data
  const complaintData = {
    nama: session.name || 'Tidak diketahui',
    no_wa: message.from, // Format: 6281234567801@c.us
    deskripsi: messageBody,
    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '), // Format: 2025-11-02 00:56:39
    kode_pengaduan: complaintCode,
    status: 'Menunggu Klasifikasi'
  };
  
  // Save to pending complaints file
  await savePendingComplaint(complaintData);
  
  // Save complaint to session (without classification)
  session.currentComplaint = complaintData;
  session.complaints.push(session.currentComplaint);
  session.state = STATES.WAITING_CONFIRMATION;
  
  // Simple response to user (NO classification or confidence info)
  await message.reply(`✅ *PENGADUAN DITERIMA!*

👤 *Nama:* ${session.name}
🕐 *Waktu:* ${timestamp}
📝 *Kode:* ${complaintCode}

📄 *Isi Pengaduan:*
"${messageBody}"

✅ Pengaduan Anda telah dicatat dan akan segera ditindaklanjuti oleh tim terkait.

❓ *Apakah Anda ingin melaporkan pengaduan lain?*
Ketik *YA* untuk lanjut atau *TIDAK* untuk selesai.`);
  
  console.log(`✅ Complaint saved (pending classification): ${complaintCode} - ${messageBody.substring(0, 50)}...`);
}
// Handle confirmation (YA/TIDAK)
async function handleConfirmation(message, session, messageBody) {
  const response = messageBody.toLowerCase();
  
  if (response.includes('ya') || response.includes('iya') || response.includes('lanjut')) {
    // User wants to continue with another complaint
    session.state = STATES.WAITING_COMPLAINT;
    
    await message.reply(`👍 *Baik, ${session.name}!*

📋 Silakan sampaikan pengaduan berikutnya:

💡 *Reminder:* Berikan deskripsi yang detail dan jelas.`);
    
    console.log(`✅ User ${message.from} wants to continue with another complaint`);
    
  } else if (response.includes('tidak') || response.includes('selesai') || response.includes('stop')) {
    // User wants to finish
    const totalComplaints = session.complaints.length;
    
    await message.reply(`🙏 *Terima kasih, ${session.name}!*

📊 *Ringkasan:*
• Total pengaduan: ${totalComplaints}
• Status: Semua telah dicatat ✅

🤖 *ChatBot Pengaduan Warga Samboja*
📞 Untuk informasi lebih lanjut, hubungi RT/RW setempat.

Selamat beristirahat! 👋`);
    
    console.log(`✅ Session completed for ${message.from} - Total complaints: ${totalComplaints}`);
    
    // Log all complaints for this session
    session.complaints.forEach((complaint, index) => {
      console.log(`📝 Complaint ${index + 1}: [${complaint.category}] ${complaint.code} - ${complaint.text.substring(0, 50)}...`);
    });
    
    // Reset session
    session.reset();
    
  } else {
    // Invalid response
    await message.reply(`❓ Mohon balas dengan:
• *YA* - untuk melaporkan pengaduan lain
• *TIDAK* - untuk menyelesaikan

Silakan pilih:`);
  }
}
// Save pending complaint to file
async function savePendingComplaint(complaintData) {
  try {
    const pendingFile = path.join(__dirname, '../data/raw/pending_complaints.json');
    
    let pendingComplaints = [];
    try {
      const existingData = await fs.readFile(pendingFile, 'utf-8');
      pendingComplaints = JSON.parse(existingData);
    } catch {
      // File doesn't exist, start with empty array
    }
    
    // Add new complaint
    pendingComplaints.push(complaintData);
    
    // Save back to file
    await fs.writeFile(pendingFile, JSON.stringify(pendingComplaints, null, 2), 'utf-8');
    
    console.log(`💾 Saved pending complaint to: ${pendingFile}`);
  } catch (error) {
    console.error('❌ Error saving pending complaint:', error.message);
  }
}

// Generate unique complaint code
function generateComplaintCode() {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PGD-${timestamp.slice(-6)}${randomNum}`;
}
// API Routes (same as before)
app.get('/qr', async (req, res) => {
  try {
    if (qrString) {
      const qrDataURL = await qrcode.toDataURL(qrString, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      
      res.json({
        success: true,
        qr: qrDataURL,
        status: 'scan_required',
        message: '✅ QR Code ready! Scan dengan WhatsApp.',
        timestamp: new Date().toISOString()
      });
    } else if (isConnected) {
      res.json({
        success: true,
        status: 'connected',
        message: '✅ Conversational Bot connected!',
        activeSessions: userSessions.size,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        status: isInitializing ? 'initializing' : 'disconnected',
        message: isInitializing ? '🔄 Menginisialisasi bot...' : '❌ Bot tidak terhubung',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'QR generation failed: ' + error.message
    });
  }
});

app.get('/qr-page', async (req, res) => {
  if (qrString) {
    const qrDataURL = await qrcode.toDataURL(qrString, { width: 400 });
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Conversational WhatsApp Bot - Samboja</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; margin: 0; }
          .container { max-width: 500px; margin: 0 auto; background: white; color: #333; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          .badge { background: #e91e63; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; margin-bottom: 20px; display: inline-block; }
          .qr-code { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 15px; }
          .flow { background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left; }
          .btn { background: #25D366; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; margin: 8px; font-size: 14px; transition: all 0.3s; }
          .btn:hover { background: #22c55e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">💬 CONVERSATIONAL BOT</div>
          
          <h1>🤖 ChatBot Pengaduan Samboja</h1>
          <p style="color: #666; margin-bottom: 30px;">Bot dengan Alur Percakapan Interaktif</p>
          
          <div class="qr-code">
            <img src="${qrDataURL}" style="max-width: 100%; border: 3px solid #25D366; border-radius: 15px;">
          </div>
          
          <div class="flow">
            <h3 style="color: #e91e63; margin-top: 0;">💬 Alur Percakapan Bot:</h3>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Sapaan:</strong> "Halo" → Bot minta nama</li>
              <li><strong>Nama:</strong> "Budi" → Bot minta pengaduan</li>
              <li><strong>Pengaduan:</strong> "Jalan rusak parah" → Konfirmasi + klasifikasi</li>
              <li><strong>Singkat:</strong> "Rusak" → Peringatan deskripsi kurang</li>
              <li><strong>Lanjut:</strong> "YA" → Minta pengaduan berikutnya</li>
              <li><strong>Selesai:</strong> "TIDAK" → Pesan terima kasih</li>
            </ol>
          </div>
          
          <button class="btn" onclick="location.reload()">🔄 Refresh QR</button>
          <button class="btn" onclick="restartBot()">🆕 Restart Bot</button>
        </div>
        
        <script>
          function restartBot() {
            if(confirm('Restart conversational bot?')) {
              fetch('/restart', {method: 'POST'}).then(() => {
                alert('Bot restarting...');
                setTimeout(() => location.reload(), 8000);
              });
            }
          }
          setTimeout(() => location.reload(), 120000);
        </script>
      </body>
      </html>
    `);
  } else if (isConnected) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Conversational Bot Connected</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #4caf50, #45a049);">
        <div style="max-width: 500px; margin: 0 auto; background: white; color: #333; padding: 40px; border-radius: 20px;">
          <div style="background: #e91e63; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; margin-bottom: 20px; display: inline-block;">CONVERSATIONAL BOT ACTIVE</div>
          <h1>✅ Bot Percakapan Terhubung!</h1>
          <p style="color: #666;">🤖 Bot siap menerima pengaduan dengan alur percakapan</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left;">
            <h3 style="color: #2e7d32; margin-top: 0;">Status Real-time:</h3>
            <p><strong>Connection:</strong> Active ✅</p>
            <p><strong>Conversation Flow:</strong> Ready 💬</p>
            <p><strong>Active Sessions:</strong> ${userSessions.size} 👥</p>
            <p><strong>Message Handling:</strong> Interactive 🔄</p>
          </div>
          
          <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #e65100;">💡 Test Flow:</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
              1. Kirim "Halo" ke WhatsApp<br>
              2. Masukkan nama Anda<br>
              3. Sampaikan pengaduan<br>
              4. Pilih YA/TIDAK untuk lanjut
            </p>
          </div>
          
          <a href="http://localhost:3000" style="background: #2196f3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; margin: 5px; display: inline-block;">📊 Dashboard</a>
          <button onclick="restartBot()" style="background: #ff9800; color: white; padding: 12px 25px; border: none; border-radius: 8px; margin: 5px; cursor: pointer;">🔄 Restart</button>
        </div>
        
        <script>
          function restartBot() {
            if(confirm('Restart conversational bot?')) {
              fetch('/restart', {method: 'POST'}).then(() => {
                alert('Bot restarting...');
                setTimeout(() => location.reload(), 8000);
              });
            }
          }
        </script>
      </body>
      </html>
    `);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Initializing Conversational Bot</title></head>
      <body style="text-align: center; padding: 50px; font-family: Arial; background: linear-gradient(135deg, #ff9800, #ff5722);">
        <div style="max-width: 400px; margin: 0 auto; background: white; color: #333; padding: 40px; border-radius: 20px;">
          <h1>🔄 Menginisialisasi Bot Percakapan...</h1>
          <p>Mohon tunggu, conversational bot sedang ${isInitializing ? 'memuat' : 'mencoba terhubung'}...</p>
          
          <div style="margin: 30px 0;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #ff9800; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          </div>
        </div>
        
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        <script>setTimeout(() => location.reload(), 8000);</script>
      </body>
      </html>
    `);
  }
});

app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    qrAvailable: !!qrString,
    initializing: isInitializing,
    status: isConnected ? 'connected' : qrString ? 'waiting_scan' : isInitializing ? 'initializing' : 'disconnected',
    client: 'whatsapp-web.js-conversational',
    activeSessions: userSessions.size,
    sessionTimeout: MESSAGE_TIMEOUT / 1000 + 's',
    timestamp: new Date().toISOString()
  });
});
app.post('/restart', async (req, res) => {
  try {
    console.log('🔄 Manual restart requested...');
    
    if (client) {
      await client.destroy();
    }
    
    // Clear all user sessions
    userSessions.clear();
    
    qrString = '';
    isConnected = false;
    isInitializing = false;
    
    setTimeout(initializeWhatsApp, 3000);
    
    res.json({
      success: true,
      message: 'Conversational bot restarting...',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active sessions info (for monitoring)
app.get('/sessions', (req, res) => {
  const sessions = Array.from(userSessions.entries()).map(([userId, session]) => ({
    userId: userId.replace(/@.*/, '@***'), // Hide full number for privacy
    state: session.state,
    name: session.name,
    complaintsCount: session.complaints.length,
    lastActivity: new Date(session.lastMessageTime).toLocaleString('id-ID')
  }));
  
  res.json({
    totalSessions: userSessions.size,
    sessions: sessions
  });
});

// Start server and initialize WhatsApp
app.listen(PORT, () => {
  console.log(`\n🚀 Conversational WhatsApp Bot Server`);
  console.log(`📱 QR Code API: http://localhost:${PORT}/qr`);
  console.log(`🌐 QR Web Page: http://localhost:${PORT}/qr-page`);
  console.log(`📊 Status API: http://localhost:${PORT}/status`);
  console.log(`👥 Sessions API: http://localhost:${PORT}/sessions`);
  console.log(`\n🤖 ChatBot Pengaduan Warga Samboja - CONVERSATIONAL FLOW`);
  console.log(`💬 Interactive conversation with state management`);
  console.log(`⏰ Session timeout: ${MESSAGE_TIMEOUT / 60000} minutes\n`);
  
  // Initialize WhatsApp after server start
  setTimeout(initializeWhatsApp, 2000);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down conversational bot gracefully...');
  
  if (client) {
    await client.destroy();
  }
  
  // Log session summary before exit
  console.log(`📊 Final session summary: ${userSessions.size} active sessions`);
  
  process.exit(0);
});