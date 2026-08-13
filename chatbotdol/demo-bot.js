const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Demo state
let connectionState = 'connecting'; // connecting, qr_ready, connected
let demoMessages = [
  { from: '628123456789', text: 'Jalan di depan rumah saya rusak parah, banyak lubang', time: new Date() },
  { from: '628987654321', text: 'Lampu jalan mati sudah 3 hari, daerah jadi gelap', time: new Date() },
  { from: '628555444333', text: 'Ada sampah menumpuk di TPS, baunya mengganggu warga', time: new Date() },
];

// Simulate WhatsApp connection cycle
function simulateConnection() {
  console.log('🔄 Demo Bot: Simulating WhatsApp connection...');
  
  setTimeout(() => {
    connectionState = 'qr_ready';
    console.log('📱 Demo Bot: QR Code ready! (simulated)');
    console.log('🌐 Visit: http://localhost:3002/qr-page');
    
    // After 30 seconds, simulate successful connection
    setTimeout(() => {
      connectionState = 'connected';
      console.log('✅ Demo Bot: WhatsApp connected! (simulated)');
      console.log('🤖 Bot ready to receive complaints');
      
      // Simulate periodic messages
      setInterval(() => {
        if (connectionState === 'connected' && Math.random() > 0.7) {
          simulateIncomingMessage();
        }
      }, 10000);
      
    }, 30000);
  }, 3000);
}

function simulateIncomingMessage() {
  const complaints = [
    'Jalan berlubang besar di Gang Mawar',
    'Lampu taman tidak menyala',
    'Selokan tersumbat sampah',
    'Keamanan kurang di malam hari',
    'Pelayanan RT lambat untuk surat pengantar',
    'Air PDAM keruh dan berbau',
    'Sampah tidak diangkut 3 hari',
    'Pohon tumbang menghalangi jalan'
  ];
  
  const categories = ['Infrastruktur', 'Lingkungan', 'Keamanan', 'Pelayanan'];
  const complaint = complaints[Math.floor(Math.random() * complaints.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const confidence = (75 + Math.random() * 20).toFixed(1);
  
  console.log(`📨 New complaint: "${complaint}" → ${category} (${confidence}%)`);
  
  // Simulate bot response
  setTimeout(() => {
    console.log(`✅ Auto-reply sent: Pengaduan diklasifikasi sebagai ${category} dengan confidence ${confidence}%`);
  }, 2000);
}

// Generate demo QR code
async function generateDemoQR() {
  const demoQRData = 'https://wa.me/qr/DEMO123456789ABCDEF'; // Demo QR data
  return await qrcode.toDataURL(demoQRData, { width: 400 });
}

// API Routes
app.get('/qr', async (req, res) => {
  if (connectionState === 'qr_ready') {
    const qrDataURL = await generateDemoQR();
    res.json({
      success: true,
      qr: qrDataURL,
      status: 'scan_required',
      message: '✅ QR Code ready! (DEMO MODE)',
      demo: true
    });
  } else if (connectionState === 'connected') {
    res.json({
      success: true,
      status: 'connected',
      message: '✅ WhatsApp connected! (DEMO MODE)',
      demo: true
    });
  } else {
    res.json({
      success: false,
      status: 'connecting',
      message: '🔄 Connecting to WhatsApp... (DEMO MODE)',
      demo: true
    });
  }
});

app.get('/qr-page', async (req, res) => {
  if (connectionState === 'qr_ready') {
    const qrDataURL = await generateDemoQR();
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Bot QR Code (DEMO)</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; background: #f0f2f5; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
          .demo-badge { background: #ff6b35; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-bottom: 20px; display: inline-block; }
          .qr-container { margin: 20px 0; }
          .instructions { color: #666; margin: 20px 0; line-height: 1.6; }
          .btn { background: #25D366; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; margin: 10px; font-size: 14px; }
          .btn:hover { background: #22c55e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="demo-badge">DEMO MODE</div>
          <h1>🤖 ChatBot Pengaduan Samboja</h1>
          <p class="instructions">
            <strong>Mode Demo:</strong> Ini adalah simulasi QR code.<br>
            Dalam implementasi nyata, scan QR ini dengan WhatsApp untuk menghubungkan bot.
          </p>
          <div class="qr-container">
            <img src="${qrDataURL}" style="border: 3px solid #25D366; border-radius: 10px; max-width: 100%;">
          </div>
          <p style="color: #25D366; font-weight: bold;">📱 Scan QR code (Demo)</p>
          <button class="btn" onclick="simulateConnection()">✅ Simulate Connection</button>
          <button class="btn" onclick="location.reload()">🔄 Refresh</button>
          
          <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #666;">
            <strong>Demo Features:</strong><br>
            • QR code generation simulation<br>
            • Auto-classification of complaints<br>
            • Real-time message processing<br>
            • Integration with dashboard
          </div>
        </div>
        
        <script>
          function simulateConnection() {
            alert('🎉 Demo: WhatsApp connection simulated!\\nBot is now ready to receive complaints.');
            fetch('/simulate-connect', {method: 'POST'}).then(() => {
              setTimeout(() => location.reload(), 1000);
            });
          }
        </script>
      </body>
      </html>
    `);
  } else if (connectionState === 'connected') {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>WhatsApp Connected (DEMO)</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px; background: #f0f2f5;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px;">
          <div style="background: #ff6b35; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-bottom: 20px; display: inline-block;">DEMO MODE</div>
          <h1>✅ WhatsApp Connected!</h1>
          <p>Bot is ready to receive complaints (simulated)</p>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Demo Status:</strong> Connected<br>
            <strong>Messages Processed:</strong> ${demoMessages.length}<br>
            <strong>Classification:</strong> Active
          </div>
          <button onclick="location.href='/'" style="background: #25D366; color: white; padding: 10px 20px; border: none; border-radius: 5px;">🏠 Dashboard</button>
        </div>
      </body>
      </html>
    `);
  } else {
    res.send(`
      <html><body style="text-align: center; padding: 50px; font-family: Arial;">
        <h1>🔄 Connecting...</h1>
        <p>Demo bot is initializing...</p>
        <script>setTimeout(() => location.reload(), 3000);</script>
      </body></html>
    `);
  }
});

app.get('/status', (req, res) => {
  res.json({
    connected: connectionState === 'connected',
    qrAvailable: connectionState === 'qr_ready',
    status: connectionState,
    demo: true,
    messages: demoMessages.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/simulate-connect', (req, res) => {
  connectionState = 'connected';
  console.log('🎯 Demo: Simulated WhatsApp connection successful!');
  res.json({ success: true, message: 'Connection simulated' });
});

// Start demo bot
app.listen(PORT, () => {
  console.log(`\n🎭 DEMO WhatsApp Bot Server started!`);
  console.log(`📱 QR Code API: http://localhost:${PORT}/qr`);
  console.log(`🌐 QR Page: http://localhost:${PORT}/qr-page`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
  console.log(`\n🤖 ChatBot Pengaduan Samboja (DEMO MODE)`);
  console.log(`⚠️  This is a demo simulation. Real WhatsApp integration may require:`);
  console.log(`   - WhatsApp Business API`);
  console.log(`   - Alternative bot frameworks`);
  console.log(`   - VPS/Server with stable IP\n`);
  
  simulateConnection();
});

process.on('SIGINT', () => {
  console.log('\n🛑 Demo bot shutting down...');
  process.exit(0);
});