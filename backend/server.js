const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3001;

app.use(cors({
  origin: "http://localhost:3000",  // Vite port
  credentials: true
}));
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data/data_kategorial.json");

// 🟢 API DATA PENGADUAN
app.get("/api/pengaduan", async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const pengaduan = JSON.parse(data);
    res.json(pengaduan);
  } catch (err) {
    res.status(500).json({ error: "Gagal membaca data" });
  }
});

// 🟢 API STATS
app.get("/api/stats", async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const pengaduan = JSON.parse(data);
    
    const stats = pengaduan.reduce((acc, item) => {
      const cat = item.kategori || 'unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total: pengaduan.length,
      kategori: stats,
      terbaru: pengaduan.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal hitung stats" });
  }
});

// 🟢 API DETAIL
app.get("/api/pengaduan/:id", async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const pengaduan = JSON.parse(data);
    const item = pengaduan[parseInt(req.params.id)];
    
    if (!item) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Error server" });
  }
});

app.listen(PORT, () => {
  console.log(`🟢 Express Server: http://localhost:${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}/api/pengaduan`);
});