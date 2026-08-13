const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

let sock;
let qrString = '';
let isConnected = false;

// Simple WhatsApp connection
async function connectToWhatsApp() {
  try {
    console.log('🚀 Starting simple WhatsApp connection...');
    
    // Clear old auth
    try {
      await fs.rm('auth_info_baileys', { recursive: true, force: true });
    } catch {}
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
      auth: state,
      logger: P({ level: 'silent' }),
      browser: ['WhatsApp Bot', 'Safari', '1.0.0'],
      printQRInTerminal: true,
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        qrString = qr;
        console.log('\n🎯 QR CODE READY! 🎯');
        console.log('Visit: http://localhost:3003/qr-page');
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed. Reconnect:', shouldReconnect);
        
        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 3000);
        }
      } else if (connection === 'open') {
        console.log('✅ Connected to WhatsApp!');
        isConnected = true;
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Simple message handler
    sock.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];
      if (!msg.key.fromMe && msg.message) {
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        
        if (text.toLowerCase().includes('test')) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: '✅ Bot is working! Send your complaint and it will be classified.'
          });
        }
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    setTimeout(connectToWhatsApp, 5000);
  }
}

// API routes
app.get('/qr', async (req, res) => {
  if (qrString) {
    const qrDataURL = await qrcode.toDataURL(qrString);
    res.json({ success: true, qr: qrDataURL });
  } else {
    res.json({ success: false, message: 'No QR available' });
  }
});

app.get('/qr-page', async (req, res) => {
  if (qrString) {
    const qrDataURL = await qrcode.toDataURL(qrString, { width: 400 });
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Simple WhatsApp QR</title></head>
      <body style="text-align: center; padding: 50px; font-family: Arial;">
        <h1>🤖 WhatsApp Bot QR Code</h1>
        <p>Scan this with WhatsApp → Settings → Linked Devices</p>
        <img src="${qrDataURL}" style="border: 2px solid #25D366; border-radius: 10px;">
        <p><button onclick="location.reload()">🔄 Refresh</button></p>
      </body>
      </html>
    `);
  } else {
    res.send('<h1>No QR Code Available</h1><p>Bot is connecting...</p>');
  }
});

app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    qrAvailable: !!qrString,
    status: isConnected ? 'connected' : qrString ? 'waiting_scan' : 'connecting'
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Simple bot server: http://localhost:${PORT}`);
  console.log(`📱 QR page: http://localhost:${PORT}/qr-page`);
  connectToWhatsApp();
});