const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], // Frontend + Express
  credentials: true
}));
app.use(express.json());

const PORT = 3002; // Port berbeda untuk chatbot

// 📁 File Paths
const BACKUP_FILE = path.join(__dirname, "../data/backup_pengaduan.json");
const CATEGORIAL_FILE = path.join(__dirname, "../server/data/data_kategorial.json");
const ML_API_URL = "http://localhost:8000/api/predict"; // FastAPI ML

// 🛠️ Setup Files
async function setupFiles() {
  if (!await fs.access(BACKUP_FILE).catch(() => false)) {
    await fs.writeFile(BACKUP_FILE, "[]", "utf-8");
  }
  await fs.mkdir(path.dirname(CATEGORIAL_FILE), { recursive: true });
}

// 🤖 WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

let currentQR = null;
let isReady = false;
const userLoopStatus = {};

// 📊 Kategori Colors untuk Response
const KATEGORI_COLORS = {
  'Infrastruktur': '🛣️',
  'Lingkungan': '🌳', 
  'Keamanan': '👮',
  'Pelayanan': '🏛️',
  'Lainnya': '📋'
};

// 🔥 EVENT HANDLERS
client.on("qr", async (qr) => {
  console.log("📱 QR RECEIVED - Scan sekarang!");
  qrcode.generate(qr, { small: true });
  currentQR = await QRCode.toDataURL(qr);
});

client.on("ready", () => {
  console.log("✅ WhatsApp Bot FULLY READY!");
  isReady = true;
  currentQR = null;
});

client.on("disconnected", (reason) => {
  console.log("❌ WhatsApp disconnected:", reason);
  isReady = false;
});

// 💬 MESSAGE HANDLER (Dengan ML Integration)
client.on("message", async (msg) => {
  if (msg.fromMe || msg.isGroupMsg || msg.broadcast || !msg._data.isNewMsg) return;

  const from = msg.from;
  const text = msg.body.trim();
  
  console.log(`📨 Pesan dari ${from}: ${text.slice(0, 50)}...`);

  // Initialize user state
  if (!userLoopStatus[from]) {
    userLoopStatus[from] = { waitingForMore: false, name: null };
  }

  // 🎉 SAPAAN
  if (/^(halo|hai|hi|assalamualaikum)/i.test(text)) {
    await msg.reply(`Halo! 👋\n\nKirim pengaduan Anda:\n\n*Format:*\n\`Nama: [Nama Anda]\`\n\`Pengaduan: [Isi keluhan]\`\n\nContoh:\nNama: Budi\nPengaduan: Jalan rusak di RT 03`);
    return;
  }

  // 🔄 LOOP PENGADUAN
  if (userLoopStatus[from].waitingForMore) {
    if (text.toLowerCase() === "ya") {
      await msg.reply("Silakan kirim pengaduan berikutnya:\n\n*Format:*\nNama: [Nama]\nPengaduan: [Isi keluhan]");
    } else {
      await msg.reply("✅ Terima kasih! Semua pengaduan sudah tercatat.\n\n*Ketik "HALO" untuk pengaduan baru.*");
    }
    userLoopStatus[from].waitingForMore = false;
    return;
  }

  // 🤖 AUTO CLASSIFICATION (Tanpa format khusus)
  if (text.length > 10) {
    try {
      console.log(`🔍 Mengklasifikasi: ${text.slice(0, 30)}...`);
      
      // 🚀 Kirim ke ML API
      const mlResponse = await axios.post(ML_API_URL, { text }, { timeout: 10000 });
      
      const { kategori, confidence, cleaned } = mlResponse.data;
      const emoji = KATEGORI_COLORS[kategori] || '📋';
      
      // 💾 Simpan ke Backup
      const pengaduan = {
        nama: userLoopStatus[from].name || "Anonim",
        text,
        text_cleaned: cleaned,
        kategori,
        confidence,
        whatsapp_id: from,
        waktu: new Date().toISOString()
      };

      // Update backup_pengaduan.json
      let backupData = [];
      try {
        const backupContent = await fs.readFile(BACKUP_FILE, "utf-8");
        backupData = JSON.parse(backupContent);
      } catch {}
      
      backupData.push(pengaduan);
      await fs.writeFile(BACKUP_FILE, JSON.stringify(backupData, null, 2));
      
      // 🔄 Sync ke data_kategorial.json (untuk frontend)
      await syncToCategorial();

      // 📱 Balas dengan hasil ML
      const reply = `✅ *PENGADUAN DITERIMA!*

${emoji} **Kategori:** ${kategori}
📊 **Keyakinan:** ${confidence}
🧹 **Diproses:** ${cleaned.slice(0, 50)}...

*Detail:*
- Nama: ${pengaduan.nama}
- Waktu: ${new Date().toLocaleString('id-ID')}
- ID WhatsApp: ${from.slice(-10)}

*Ketik YA untuk pengaduan lain, atau TIDAK untuk selesai.*`;

      await msg.reply(reply);
      userLoopStatus[from].waitingForMore = true;
      
    } catch (error) {
      console.error("❌ ML Error:", error.message);
      await msg.reply("⚠️ Sistem klasifikasi sedang maintenance.\n\nCoba lagi dalam 5 menit atau hubungi admin.");
    }
  }
});

// 🔄 SYNC FUNCTION (Backup → Categorial)
async function syncToCategorial() {
  try {
    const backupContent = await fs.readFile(BACKUP_FILE, "utf-8");
    const backupData = JSON.parse(backupContent);
    
    // Filter & sort terbaru
    const categorialData = backupData
      .filter(item => item.kategori && item.text_cleaned)
      .sort((a, b) => new Date(b.waktu) - new Date(a.waktu))
      .slice(0, 1000); // Max 1000 records
    
    await fs.writeFile(CATEGORIAL_FILE, JSON.stringify(categorialData, null, 2));
    console.log(`🔄 Synced ${categorialData.length} records to categorial`);
  } catch (error) {
    console.error("❌ Sync error:", error);
  }
}

// 🌐 API ENDPOINTS
app.get("/qr", (req, res) => {
  if (isReady) {
    res.json({ 
      status: "connected", 
      message: "WhatsApp Bot aktif!",
      timestamp: new Date().toISOString()
    });
  } else if (currentQR) {
    res.json({ qr: currentQR, status: "scan" });
  } else {
    res.json({ status: "initializing", message: "Menunggu QR..." });
  }
});

app.get("/status", (req, res) => {
  res.json({ 
    whatsapp: isReady ? "connected" : "disconnected",
    ml_api: "http://localhost:8000",
    backup_count: (async () => {
      try {
        const data = await fs.readFile(BACKUP_FILE, "utf-8");
        return JSON.parse(data).length;
      } catch {
        return 0;
      }
    })()
  });
});

app.post("/sync", async (req, res) => {
  await syncToCategorial();
  res.json({ success: true, message: "Synced!" });
});

// 🚀 STARTUP
async function start() {
  await setupFiles();
  await syncToCategorial(); // Initial sync
  
  app.listen(PORT, () => {
    console.log(`\n🚀 CHATBOT SERVER: http://localhost:${PORT}`);
    console.log(`📱 QR API: http://localhost:${PORT}/qr`);
    console.log(`📊 Status: http://localhost:${PORT}/status`);
  });
  
  client.initialize();
}

start().catch(console.error);