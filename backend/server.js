const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

const DATA_FILE = path.join(__dirname, "data/data_kategorial.json");

// ambil semua data
app.get("/api/pengaduan", (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Gagal membaca data" });
    }
});

// ambil detail berdasarkan index
app.get("/api/pengaduan/:id", (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        const item = data[req.params.id];

        if (!item) return res.status(404).json({ error: "Data tidak ditemukan" });

        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Error server" });
    }
});

app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});