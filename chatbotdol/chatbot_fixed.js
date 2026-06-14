const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    credentials: true
}));
app.use(express.json());

const PORT = 3002;

// 📁 File Paths
const DATA_BARU_PATH = path.join(__dirname, "../data/raw/data_baru.json");
const BACKUP_FILE = path.join(__dirname, "../data/backup_pengaduan.json");

// 🛠️ Setup Files
async function setupFiles() {
    try {
        await fs.access(DATA_BARU_PATH);
    } catch {
        await fs.writeFile(DATA_BARU_PATH, "[]", "utf-8");
    }

    try {
        await fs.access(BACKUP_FILE);
    } catch {
        await fs.writeFile(BACKUP_FILE, "[]", "utf-8");
    }
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
const userState = {}; // Track user conversation state

// 🎫 Generate Token Unik
function generateToken() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TKN-${date}-${time}-${random}`;
}

// 📝 Format Timestamp
function formatTimestamp() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
}

// 💾 Simpan ke data_baru.json
async function saveToDat aBaru(pengaduan) {
    try {
        const content = await fs.readFile(DATA_BARU_PATH, "utf-8");
        const data = JSON.parse(content);
        data.push(pengaduan);
        await fs.writeFile(DATA_BARU_PATH, JSON.stringify(data, null, 2), "utf-8");
        console.log(`✅ Saved to data_baru.json: Token ${pengaduan.token}`);
        return true;
    } catch (error) {
        console.error("❌ Error saving to data_baru.json:", error);
        return false;
    }
}

// 💾 Simpan ke backup
async function saveToBackup(pengaduan) {
    try {
        const content = await fs.readFile(BACKUP_FILE, "utf-8");
        const data = JSON.parse(content);
        data.push({
            ...pengaduan,
            waktu_simpan: new Date().toISOString()
        });
        await fs.writeFile(BACKUP_FILE, JSON.stringify(data, null, 2), "utf-8");
        return true;
    } catch (error) {
        console.error("❌ Error saving to backup:", error);
        return false;
    }
}

// 🔥 EVENT HANDLERS
client.on("qr", async (qr) => {
    console.log("📱 QR RECEIVED - Scan sekarang!");
    qrcode.generate(qr, { small: true });
    currentQR = await QRCode.toDataURL(qr);
});

client.on("ready", () => {
    console.log("✅ WhatsApp Bot FULLY READY!");
    console.log("📱 Bot siap menerima pengaduan!");
    isReady = true;
    currentQR = null;
});

client.on("disconnected", (reason) => {
    console.log("❌ WhatsApp disconnected:", reason);
    isReady = false;
});

// 💬 MESSAGE HANDLER
client.on("message", async (msg) => {
    // Skip pesan dari bot sendiri, grup, broadcast, atau bukan pesan baru
    if (msg.fromMe || msg.isGroupMsg || msg.broadcast || !msg._data.isNewMsg) return;

    const from = msg.from;
    const text = msg.body.trim();

    console.log(`📨 Pesan dari ${from}: ${text.slice(0, 50)}...`);

    // Initialize user state
    if (!userState[from]) {
        userState[from] = {
            step: 'idle',
            nama: null,
            pendingToken: null
        };
    }

    const state = userState[from];

    // 🎉 SAPAAN / START
    if (/^(halo|hai|hi|assalamualaikum|mulai|start)/i.test(text)) {
        state.step = 'ask_name';
        await msg.reply(
            `👋 *Selamat datang di Sistem Pengaduan Warga Samboja!*\n\n` +
            `Silakan kirim pengaduan Anda.\n\n` +
            `*Contoh Format:*\n` +
            `Nama: Budi Santoso\n` +
            `Pengaduan: Lampu jalan di depan rumah saya sudah mati selama 3 hari. Tolong diperbaiki segera karena rawan pencurian.\n\n` +
            `*ATAU kirim langsung pengaduan Anda* (nama akan otomatis "Anonim")`
        );
        return;
    }

    // 📝 CEK STATUS PENGADUAN
    if (/^(status|cek|token)\s+TKN-/i.test(text)) {
        const tokenMatch = text.match(/TKN-\d+-\d+-\d+/);
        if (tokenMatch) {
            const token = tokenMatch[0];
            await msg.reply(
                `🔍 *Cek Status Pengaduan*\n\n` +
                `Token: ${token}\n\n` +
                `Silakan buka dashboard untuk melihat status:\n` +
                `http://localhost:3000/data-pengaduan\n\n` +
                `_Atau tunggu admin menghubungi Anda._`
            );
        }
        return;
    }

    // 📝 PROSES PENGADUAN
    if (text.length > 15) {
        try {
            // Parse format: "Nama: X\nPengaduan: Y"
            let nama = "Anonim";
            let deskripsi = text;

            const namaMatch = text.match(/^Nama:\s*(.+?)(?:\n|$)/im);
            const pengaduanMatch = text.match(/Pengaduan:\s*(.+)/is);

            if (namaMatch && pengaduanMatch) {
                nama = namaMatch[1].trim();
                deskripsi = pengaduanMatch[1].trim();
            } else if (namaMatch) {
                nama = namaMatch[1].trim();
                deskripsi = text.replace(/^Nama:\s*.+?\n?/im, '').trim();
            }

            // Validasi panjang deskripsi
            if (deskripsi.length < 10) {
                await msg.reply(
                    `⚠️ *Deskripsi terlalu pendek*\n\n` +
                    `Mohon jelaskan pengaduan Anda lebih detail (minimal 10 karakter).\n\n` +
                    `Contoh: "Jalan rusak berlubang di depan sekolah"`
                );
                return;
            }

            // Generate token
            const token = generateToken();
            const no_wa = from.replace('@c.us', '');
            const timestamp = formatTimestamp();

            // Data untuk Python
            const pengaduan = {
                nama,
                no_wa,
                deskripsi,
                timestamp,
                token
            };

            // Simpan ke data_baru.json
            const savedDataBaru = await saveToDataBaru(pengaduan);

            // Simpan ke backup
            const savedBackup = await saveToBackup({
                ...pengaduan,
                whatsapp_id: from,
                status: 'pending_classification'
            });

            if (savedDataBaru && savedBackup) {
                // Kirim konfirmasi ke user
                await msg.reply(
                    `✅ *PENGADUAN BERHASIL DITERIMA!*\n\n` +
                    `📝 *Detail:*\n` +
                    `👤 Nama: ${nama}\n` +
                    `📱 WhatsApp: ${no_wa}\n` +
                    `🎫 Token: *${token}*\n` +
                    `⏰ Waktu: ${timestamp}\n\n` +
                    `📋 *Deskripsi:*\n${deskripsi.slice(0, 100)}${deskripsi.length > 100 ? '...' : ''}\n\n` +
                    `⏳ *Status:* Menunggu Klasifikasi\n\n` +
                    `_Pengaduan Anda akan diproses oleh sistem AI dan ditindaklanjuti oleh petugas terkait._\n\n` +
                    `*Simpan token ini untuk cek status pengaduan!*\n\n` +
                    `Ketik *HALO* untuk pengaduan baru.`
                );

                console.log(`✅ Pengaduan tersimpan: ${token} dari ${nama}`);
                state.pendingToken = token;
            } else {
                await msg.reply(
                    `❌ *GAGAL MENYIMPAN PENGADUAN*\n\n` +
                    `Mohon maaf, terjadi kesalahan sistem.\n` +
                    `Silakan coba lagi atau hubungi admin.`
                );
            }

        } catch (error) {
            console.error("❌ Error processing message:", error);
            await msg.reply(
                `❌ *TERJADI KESALAHAN*\n\n` +
                `Mohon maaf, sistem sedang mengalami gangguan.\n` +
                `Silakan coba lagi dalam beberapa saat.`
            );
        }
    } else {
        // Pesan terlalu pendek
        await msg.reply(
            `⚠️ *Pesan terlalu pendek*\n\n` +
            `Untuk mengirim pengaduan, gunakan format:\n\n` +
            `*Nama: [Nama Anda]*\n` +
            `*Pengaduan: [Keluhan Anda]*\n\n` +
            `Atau ketik *HALO* untuk panduan lengkap.`
        );
    }
});

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

app.get("/status", async (req, res) => {
    try {
        const dataBaru = await fs.readFile(DATA_BARU_PATH, "utf-8");
        const backup = await fs.readFile(BACKUP_FILE, "utf-8");

        res.json({
            whatsapp: isReady ? "connected" : "disconnected",
            data_baru_count: JSON.parse(dataBaru).length,
            backup_count: JSON.parse(backup).length,
            last_check: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            whatsapp: isReady ? "connected" : "disconnected",
            error: error.message
        });
    }
});

// Endpoint untuk testing
app.post("/test-pengaduan", async (req, res) => {
    const { nama, deskripsi } = req.body;

    const pengaduan = {
        nama: nama || "Test User",
        no_wa: "6281234567890",
        deskripsi: deskripsi || "Test pengaduan dari API",
        timestamp: formatTimestamp(),
        token: generateToken()
    };

    const saved = await saveToDataBaru(pengaduan);
    await saveToBackup(pengaduan);

    res.json({
        success: saved,
        pengaduan,
        message: saved ? "Pengaduan tersimpan" : "Gagal menyimpan"
    });
});

// 🚀 STARTUP
async function start() {
    await setupFiles();

    app.listen(PORT, () => {
        console.log(`\n🚀 CHATBOT SERVER: http://localhost:${PORT}`);
        console.log(`📱 QR API: http://localhost:${PORT}/qr`);
        console.log(`📊 Status: http://localhost:${PORT}/status`);
        console.log(`🧪 Test: POST http://localhost:${PORT}/test-pengaduan`);
        console.log(`\n📝 Data akan disimpan ke:`);
        console.log(`   - ${DATA_BARU_PATH}`);
        console.log(`   - ${BACKUP_FILE}`);
    });

    client.initialize();
}

start().catch(console.error);
