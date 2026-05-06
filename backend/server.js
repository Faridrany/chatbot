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

const DATA_FILE = path.join(__dirname, "../data/data_kategorial.json");

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

    const now = new Date();
    const ms3Hari = 3 * 24 * 60 * 60 * 1000;
    const ms7Hari = 7 * 24 * 60 * 60 * 1000;

    const kategoriCount = {};
    let baru3Hari = 0;
    let baru7Hari = 0;

    pengaduan.forEach((item) => {
      const cat = item.kategori_prediksi || 'unknown';
      kategoriCount[cat] = (kategoriCount[cat] || 0) + 1;

      const ts = new Date(item.timestamp);
      const diff = now - ts;
      if (diff <= ms3Hari) baru3Hari++;
      if (diff <= ms7Hari) baru7Hari++;
    });

    // Kategori terbanyak
    const kategoriTerbanyak = Object.entries(kategoriCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // Data per minggu (4 minggu terakhir)
    const weeklyData = [0, 0, 0, 0];
    pengaduan.forEach((item) => {
      const ts = new Date(item.timestamp);
      const diffDays = Math.floor((now - ts) / (24 * 60 * 60 * 1000));
      if (diffDays < 7) weeklyData[3]++;
      else if (diffDays < 14) weeklyData[2]++;
      else if (diffDays < 21) weeklyData[1]++;
      else if (diffDays < 28) weeklyData[0]++;
    });

    res.json({
      total: pengaduan.length,
      baru3Hari,
      baru7Hari,
      kategoriTerbanyak,
      kategori: kategoriCount,
      weeklyData,
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