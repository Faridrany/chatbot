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

// 🟢 QR CODE (placeholder — integrasikan dengan whatsapp-web.js jika diperlukan)
app.get("/qr", (req, res) => {
  res.json({ qr: null }); // null = sudah terhubung / belum ada sesi WA aktif
});

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

    const kategoriCount = {};

    // Cari tanggal terbaru dari data sebagai acuan "now"
    let latestTs = new Date(0);
    pengaduan.forEach((item) => {
      const ts = new Date(item.timestamp);
      if (ts > latestTs) latestTs = ts;
    });

    const ms3Hari = 3 * 24 * 60 * 60 * 1000;
    const ms7Hari = 7 * 24 * 60 * 60 * 1000;

    let baru3Hari = 0;
    let baru7Hari = 0;

    pengaduan.forEach((item) => {
      const cat = item.kategori_prediksi || 'unknown';
      kategoriCount[cat] = (kategoriCount[cat] || 0) + 1;

      const ts = new Date(item.timestamp);
      const diff = latestTs - ts;
      if (diff <= ms3Hari) baru3Hari++;
      if (diff <= ms7Hari) baru7Hari++;
    });

    // Kategori terbanyak
    const kategoriTerbanyak = Object.entries(kategoriCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // Data per minggu (4 minggu terakhir relatif dari data terbaru)
    const weeklyData = [0, 0, 0, 0];
    pengaduan.forEach((item) => {
      const ts = new Date(item.timestamp);
      const diffDays = Math.floor((latestTs - ts) / (24 * 60 * 60 * 1000));
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

// 🟢 API DETAIL + PIPELINE PREPROCESSING
app.get("/api/pengaduan/:id/processed", async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const pengaduan = JSON.parse(data);
    const item = pengaduan[parseInt(req.params.id)];

    if (!item) return res.status(404).json({ error: "Data tidak ditemukan" });

    // Coba cocokkan dengan file processed berdasarkan deskripsi
    const processedDir = path.join(__dirname, "../data/processed");
    const files = ["casefolded.json", "cleaned.json", "normalized.json", "tokenized.json", "stop_removed.json", "stemmed.json", "final_processed.json"];

    const pipeline = {};
    for (const file of files) {
      try {
        const raw = await fs.readFile(path.join(processedDir, file), "utf-8");
        const arr = JSON.parse(raw);
        const match = arr.find((d) => d.deskripsi?.trim() === item.deskripsi?.trim());
        if (match) {
          const key = Object.keys(match).find((k) => k !== "deskripsi");
          pipeline[key] = match[key];
        }
      } catch (_) {}
    }

    res.json({
      ...item,
      pipeline: Object.keys(pipeline).length > 0 ? pipeline : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Error server" });
  }
});

// 🟢 API STATISTIK MODEL
app.get("/api/statistik", async (req, res) => {
  try {
    const CATEGORIES = ["KEAMANAN", "INFRASTRUKTUR", "LINGKUNGAN", "PELAYANAN"];

    // Baca hasil training
    const trainingRaw = await fs.readFile(path.join(__dirname, "../data/hasil_training.json"), "utf-8");
    const training = JSON.parse(trainingRaw);

    // Baca data prediksi
    const predRaw = await fs.readFile(DATA_FILE, "utf-8");
    const predData = JSON.parse(predRaw);

    // Baca dataset berlabel (ground truth)
    const labelRaw = await fs.readFile(path.join(__dirname, "../data/raw/dataset_berlabel.json"), "utf-8");
    const labelData = JSON.parse(labelRaw);

    // Hitung distribusi ground truth dari dataset berlabel
    const gtCount = {};
    CATEGORIES.forEach((c) => { gtCount[c] = 0; });
    labelData.forEach((item) => {
      const cat = item.Kategori || item.kategori;
      if (gtCount[cat] !== undefined) gtCount[cat]++;
    });

    // Hitung distribusi prediksi dari data_kategorial
    const predCount = {};
    CATEGORIES.forEach((c) => { predCount[c] = 0; });
    predData.forEach((item) => {
      if (predCount[item.kategori_prediksi] !== undefined) predCount[item.kategori_prediksi]++;
    });

    // Bangun confusion matrix dari dataset berlabel
    // Coba cocokkan by deskripsi dulu
    const predMap = {};
    predData.forEach((item) => {
      if (item.deskripsi) predMap[item.deskripsi.trim()] = item.kategori_prediksi;
    });

    const matrix = {};
    CATEGORIES.forEach((a) => {
      matrix[a] = {};
      CATEGORIES.forEach((p) => { matrix[a][p] = 0; });
    });

    let matched = 0;
    labelData.forEach((item) => {
      const actual = item.Kategori || item.kategori;
      const predicted = predMap[item.deskripsi?.trim()];
      if (actual && predicted && CATEGORIES.includes(actual) && CATEGORIES.includes(predicted)) {
        matrix[actual][predicted]++;
        matched++;
      }
    });

    // Jika tidak ada yang cocok, estimasi confusion matrix dari akurasi model
    // menggunakan distribusi ground truth dan akurasi yang diketahui
    if (matched === 0) {
      const accuracy = training.akurasi; // 0.8
      CATEGORIES.forEach((actual) => {
        const total = gtCount[actual];
        if (total === 0) return;
        const tp = Math.round(total * accuracy);
        const errors = total - tp;
        matrix[actual][actual] = tp;
        // Distribusikan error ke kelas lain secara merata
        const otherCats = CATEGORIES.filter((c) => c !== actual);
        otherCats.forEach((other, i) => {
          const share = i < errors % otherCats.length
            ? Math.ceil(errors / otherCats.length)
            : Math.floor(errors / otherCats.length);
          matrix[actual][other] = share;
        });
      });
    }

    // Hitung per-class metrics dari confusion matrix
    const perClass = {};
    CATEGORIES.forEach((cat) => {
      const tp = matrix[cat][cat];
      const fp = CATEGORIES.reduce((s, a) => s + (a !== cat ? matrix[a][cat] : 0), 0);
      const fn = CATEGORIES.reduce((s, p) => s + (p !== cat ? matrix[cat][p] : 0), 0);
      const tn = CATEGORIES.reduce((s, a) =>
        s + CATEGORIES.reduce((ss, p) => ss + (a !== cat && p !== cat ? matrix[a][p] : 0), 0), 0);

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall    = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1        = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
      const support   = CATEGORIES.reduce((s, p) => s + matrix[cat][p], 0);

      perClass[cat] = {
        precision: parseFloat(precision.toFixed(4)),
        recall:    parseFloat(recall.toFixed(4)),
        f1:        parseFloat(f1.toFixed(4)),
        support,
        tp, fp, fn, tn,
      };
    });

    res.json({
      akurasi: training.akurasi,
      tfidf: {
        fitur: training.fitur_tfidf,
        estimators: training.estimators,
        total_data: training.total_data,
      },
      confusionMatrix: matrix,
      perClass,
      distribusi: predCount,
      distribusiGT: gtCount,
      matched,
      estimatedMatrix: matched === 0,
      totalPrediksi: predData.length,
      totalLabel: labelData.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hitung statistik: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🟢 Express Server: http://localhost:${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}/api/pengaduan`);
});