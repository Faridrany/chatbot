// chatbot/chatbot.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// =======================
// EXPRESS SETUP
// =======================
const app = express();
app.use(cors());

const PORT = 3001;

// =======================
// FILE BACKUP
// =======================
const BACKUP_FILE = path.join(__dirname, "Dashboard/public/backup_pengaduan.json");

if (!fs.existsSync(BACKUP_FILE)) {
    fs.writeFileSync(BACKUP_FILE, "[]", "utf-8");
}

// =======================
// WHATSAPP CLIENT
// =======================
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true },
});

// =======================
// STATE QR
// =======================
let currentQR = null;
let isReady = false;

// =======================
// USER LOOP STATUS
// =======================
const userLoopStatus = {};

// =======================
// QR EVENT
// =======================
client.on("qr", async (qr) => {
    console.log("📱 QR RECEIVED");

    // tampil di terminal
    qrcode.generate(qr, { small: true });

    // convert ke base64 untuk frontend
    currentQR = await QRCode.toDataURL(qr);
});

// =======================
// READY EVENT
// =======================
client.on("ready", () => {
    console.log("🤖 Chatbot WhatsApp siap!");
    isReady = true;
    currentQR = null;
});

// =======================
// MESSAGE HANDLER (TETAP)
// =======================
client.on("message", async (msg) => {
    if (msg.fromMe || msg.isGroupMsg || msg.broadcast || !msg._data.isNewMsg)
        return;

    const from = msg.from;
    const text = msg.body.trim().toLowerCase();

    if (!userLoopStatus[from]) {
        userLoopStatus[from] = { waitingForMore: false };
    }

    // sapaan
    if (/^(halo|hai|hi)$/i.test(text)) {
        await msg.reply("Halo! Kirim pengaduan:\nNama: [Nama]\nPengaduan: [isi]");
        return;
    }

    // loop pengaduan
    if (userLoopStatus[from].waitingForMore) {
        if (text === "ya") {
            await msg.reply("Silakan kirim pengaduan berikutnya:\nNama: [Nama]\nPengaduan: [isi]");
        } else {
            await msg.reply("Terima kasih! Semua pengaduan Anda akan ditindaklanjuti.");
        }

        userLoopStatus[from].waitingForMore = false;
        return;
    }

    // parsing pengaduan
    if (/pengaduan:/i.test(text)) {
        const namaMatch = msg.body.match(/nama:\s*(.+)/i);
        const nama = namaMatch ? namaMatch[1].trim() : "Anonim";

        const deskripsiMatch = msg.body.match(/pengaduan:\s*([\s\S]+)/i);
        const deskripsi = deskripsiMatch ? deskripsiMatch[1].trim() : "";

        if (!deskripsi) {
            await msg.reply("⚠️ Mohon isi pengaduan dengan lengkap.");
            return;
        }

        const data = {
            nama,
            deskripsi,
            waktu: new Date().toISOString(),
        };

        let existing = [];
        try {
            existing = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
        } catch { }

        existing.push(data);

        fs.writeFileSync(BACKUP_FILE, JSON.stringify(existing, null, 2));

        await msg.reply("✅ Terima kasih atas pengaduannya. Akan kami tindak lanjuti.");
        await msg.reply("Apakah Anda ingin mengirim pengaduan lain? (ya/tidak)");

        userLoopStatus[from].waitingForMore = true;
    }
});

// =======================
// API QR
// =======================
app.get("/qr", (req, res) => {
    if (isReady) {
        return res.json({ status: "connected" });
    }

    res.json({ qr: currentQR });
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
    console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});

// =======================
// START WHATSAPP
// =======================
client.initialize();