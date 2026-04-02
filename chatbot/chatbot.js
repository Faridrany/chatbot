const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");

const app = express();
app.use(cors());

let currentQR = null;

const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.on("qr", async (qr) => {
    console.log("QR baru!");

    // ubah ke base64 image
    currentQR = await QRCode.toDataURL(qr);
});

client.on("ready", () => {
    console.log("🤖 WhatsApp siap!");
    currentQR = null;
});

// endpoint ambil QR
app.get("/qr", (req, res) => {
    if (!currentQR) {
        return res.json({ status: "connected" });
    }
    res.json({ qr: currentQR });
});

app.listen(3001, () => console.log("Server jalan di http://localhost:3001"));

client.initialize();