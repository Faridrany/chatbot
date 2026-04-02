const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

const BACKUP_FILE = path.join(__dirname, "Dashboard/public/backup_pengaduan.json");

// Buat file backup jika belum ada
if (!fs.existsSync(BACKUP_FILE)) fs.writeFileSync(BACKUP_FILE, "[]", "utf-8");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

// Simpan status loop per user
const userLoopStatus = {};

client.on("qr", qr => qrcode.generate(qr, { small: true }));
client.on("ready", () => console.log("🤖 Chatbot WhatsApp siap!"));

client.on("message", async msg => {
    if (msg.fromMe || msg.isGroupMsg || msg.broadcast || !msg._data.isNewMsg) return;

    const from = msg.from; // nomor WA pengirim
    const text = msg.body.trim().toLowerCase();

    // Inisialisasi status user jika belum ada
    if (!userLoopStatus[from]) userLoopStatus[from] = { waitingForMore: false };

    // Balasan sapaan
    if (/^(halo|hai|hi)$/i.test(text)) {
        await msg.reply("Halo! Kirim pengaduan:\nNama: [Nama]\nPengaduan: [isi]");
        return;
    }

    // Jika chatbot menunggu konfirmasi loop
    if (userLoopStatus[from].waitingForMore) {
        if (text === "ya") {
            await msg.reply("Silakan kirim pengaduan berikutnya:\nNama: [Nama]\nPengaduan: [isi]");
            userLoopStatus[from].waitingForMore = false; // reset loop sementara
        } else {
            await msg.reply("Terima kasih! Semua pengaduan Anda akan ditindaklanjuti.");
            userLoopStatus[from].waitingForMore = false;
        }
        return;
    }

    // Jika menerima pengaduan
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
            nama: nama,
            deskripsi: deskripsi,
            waktu: new Date().toISOString()
        };

        let existing = [];
        try { existing = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8")); } catch { }

        existing.push(data);

        fs.writeFileSync(BACKUP_FILE, JSON.stringify(existing, null, 2));

        await msg.reply("✅ Terima kasih atas pengaduannya. Akan kami tindak lanjuti.");

        // Tanyakan apakah ada pengaduan lain
        await msg.reply("Apakah Anda ingin mengirim pengaduan lain? (ya/tidak)");
        userLoopStatus[from].waitingForMore = true;
    }
});

client.initialize();
