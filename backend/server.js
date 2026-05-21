const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

const DATA_DIR      = path.join(__dirname, "../data");
const PROCESSED_DIR = path.join(DATA_DIR, "processed");

const cache = {
  pengaduan:      null,   // final_processed.json
  pipeline:       null,   // Map<deskripsi, {casefolded,cleaned,...}>
  training:       null,   // hasil_training.json
  datasetBerlabel: null,  // raw/dataset_berlabel.json
  stats:          null,   // hasil hitung stats (di-cache juga)
};

async function loadCache() {
  console.log("⏳ Loading data into memory...");

  const [
    pengaduanRaw,
    casefoldedRaw,
    cleanedRaw,
    normalizedRaw,
    tokenizedRaw,
    stopRemovedRaw,
    stemmedRaw,
    trainingRaw,
    labelRaw,
  ] = await Promise.all([
    fs.readFile(path.join(PROCESSED_DIR, "final_processed.json"), "utf-8"),
    fs.readFile(path.join(PROCESSED_DIR, "casefolded.json"),      "utf-8").catch(() => "[]"),
    fs.readFile(path.join(PROCESSED_DIR, "cleaned.json"),         "utf-8").catch(() => "[]"),
    fs.readFile(path.join(PROCESSED_DIR, "normalized.json"),      "utf-8").catch(() => "[]"),
    fs.readFile(path.join(PROCESSED_DIR, "tokenized.json"),       "utf-8").catch(() => "[]"),
    fs.readFile(path.join(PROCESSED_DIR, "stop_removed.json"),    "utf-8").catch(() => "[]"),
    fs.readFile(path.join(PROCESSED_DIR, "stemmed.json"),         "utf-8").catch(() => "[]"),
    fs.readFile(path.join(DATA_DIR, "hasil_training.json"),       "utf-8").catch(() => "{}"),
    fs.readFile(path.join(DATA_DIR, "raw/dataset_berlabel.json"), "utf-8").catch(() => "[]"),
  ]);

  cache.pengaduan       = JSON.parse(pengaduanRaw);
  cache.training        = JSON.parse(trainingRaw);
  cache.datasetBerlabel = JSON.parse(labelRaw);

  const normalize = (s) => s?.trim().replace(/\s+/g, " ") ?? "";

  const pipelineArrays = {
    casefolded:   JSON.parse(casefoldedRaw),
    cleaned:      JSON.parse(cleanedRaw),
    normalized:   JSON.parse(normalizedRaw),
    tokenized:    JSON.parse(tokenizedRaw),
    stop_removed: JSON.parse(stopRemovedRaw),
    stemmed:      JSON.parse(stemmedRaw),
  };

  const pipelineMap = new Map();

  for (const [key, arr] of Object.entries(pipelineArrays)) {
    for (const item of arr) {
      const desc = normalize(item.deskripsi);
      if (!desc) continue;
      if (!pipelineMap.has(desc)) pipelineMap.set(desc, {});
      if (item[key] !== undefined) pipelineMap.get(desc)[key] = item[key];
    }
  }

  cache.pipeline = pipelineMap;

  cache.stats = computeStats(cache.pengaduan);

  console.log(`✅ Cache loaded: ${cache.pengaduan.length} pengaduan, ${pipelineMap.size} pipeline entries`);
}
function computeStats(pengaduan) {
  const kategoriCount = {};
  let latestTs = new Date(0);

  for (const item of pengaduan) {
    const ts = new Date(item.timestamp);
    if (ts > latestTs) latestTs = ts;
    const cat = item.kategori_prediksi || "unknown";
    kategoriCount[cat] = (kategoriCount[cat] || 0) + 1;
  }

  const ms3Hari = 3 * 24 * 60 * 60 * 1000;
  const ms7Hari = 7 * 24 * 60 * 60 * 1000;
  let baru3Hari = 0, baru7Hari = 0;
  const weeklyData = [0, 0, 0, 0];

  for (const item of pengaduan) {
    const diff = latestTs - new Date(item.timestamp);
    if (diff <= ms3Hari) baru3Hari++;
    if (diff <= ms7Hari) baru7Hari++;
    const diffDays = Math.floor(diff / (24 * 60 * 60 * 1000));
    if      (diffDays < 7)  weeklyData[3]++;
    else if (diffDays < 14) weeklyData[2]++;
    else if (diffDays < 21) weeklyData[1]++;
    else if (diffDays < 28) weeklyData[0]++;
  }

  const kategoriTerbanyak =
    Object.entries(kategoriCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return { total: pengaduan.length, baru3Hari, baru7Hari, kategoriTerbanyak, kategori: kategoriCount, weeklyData };
}
// Evaluasi model — baca langsung dari hasil_training.json (akurat dari training)
app.get("/api/evaluasi", async (_req, res) => {
  try {
    const raw  = await fs.readFile(path.join(DATA_DIR, "hasil_training.json"), "utf-8");
    res.json(JSON.parse(raw));
  } catch {
    res.status(404).json({ error: "hasil_training.json belum ada. Jalankan python main.py terlebih dahulu." });
  }
});

app.get("/api/pengaduan", (_req, res) => {
  res.json(cache.pengaduan);
});

// Dataset berlabel — untuk halaman Data Pengaduan
// Normalisasi field: Kategori → kategori_prediksi, no_wa dibersihkan
app.get("/api/dataset", (_req, res) => {
  const data = cache.datasetBerlabel.map((item, i) => ({
    _id:               i,
    nama:              item.nama              ?? "",
    no_wa:             (item.no_wa ?? "").replace("@c.us", ""),
    deskripsi:         item.deskripsi         ?? "",
    kategori_prediksi: item.Kategori || item.kategori || "-",
    timestamp:         item.timestamp         ?? "-",
  }));
  res.json(data);
});
app.get("/api/stats", (_req, res) => {
  res.json(cache.stats);
});
app.get("/api/pengaduan/:id", (req, res) => {
  const item = cache.pengaduan[parseInt(req.params.id)];
  if (!item) return res.status(404).json({ error: "Data tidak ditemukan" });
  res.json(item);
});

app.get("/api/pengaduan/:id/processed", (req, res) => {
  const item = cache.pengaduan[parseInt(req.params.id)];
  if (!item) return res.status(404).json({ error: "Data tidak ditemukan" });

  const key = item.deskripsi?.trim().replace(/\s+/g, " ") ?? "";
  const pipelineData = cache.pipeline.get(key) ?? {};

  res.json({
    ...item,
    pipeline: {
      ...pipelineData,
      final_text: item.processed ?? "",
    },
  });
});

// Statistik model
app.get("/api/statistik", (_req, res) => {
  try {
    const CATEGORIES = ["KEAMANAN", "INFRASTRUKTUR", "LINGKUNGAN", "PELAYANAN"];
    const training    = cache.training;
    const predData    = cache.pengaduan;
    const labelData   = cache.datasetBerlabel;

    const gtCount   = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    const predCount = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));

    for (const item of labelData) {
      const cat = item.Kategori || item.kategori;
      if (gtCount[cat] !== undefined) gtCount[cat]++;
    }
    for (const item of predData) {
      if (predCount[item.kategori_prediksi] !== undefined) predCount[item.kategori_prediksi]++;
    }
    const predMap = new Map(predData.map((i) => [i.deskripsi?.trim(), i.kategori_prediksi]));

    const matrix = Object.fromEntries(
      CATEGORIES.map((a) => [a, Object.fromEntries(CATEGORIES.map((p) => [p, 0]))])
    );

    let matched = 0;
    for (const item of labelData) {
      const actual    = item.Kategori || item.kategori;
      const predicted = predMap.get(item.deskripsi?.trim());
      if (actual && predicted && CATEGORIES.includes(actual) && CATEGORIES.includes(predicted)) {
        matrix[actual][predicted]++;
        matched++;
      }
    }

    if (matched === 0) {
      const accuracy = training.akurasi;
      for (const actual of CATEGORIES) {
        const total = gtCount[actual];
        if (!total) continue;
        const tp     = Math.round(total * accuracy);
        const errors = total - tp;
        matrix[actual][actual] = tp;
        const others = CATEGORIES.filter((c) => c !== actual);
        others.forEach((other, i) => {
          matrix[actual][other] = i < errors % others.length
            ? Math.ceil(errors / others.length)
            : Math.floor(errors / others.length);
        });
      }
    }

    const perClass = {};
    for (const cat of CATEGORIES) {
      const tp = matrix[cat][cat];
      const fp = CATEGORIES.reduce((s, a) => s + (a !== cat ? matrix[a][cat] : 0), 0);
      const fn = CATEGORIES.reduce((s, p) => s + (p !== cat ? matrix[cat][p] : 0), 0);
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall    = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1        = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
      perClass[cat] = {
        precision: parseFloat(precision.toFixed(4)),
        recall:    parseFloat(recall.toFixed(4)),
        f1:        parseFloat(f1.toFixed(4)),
        support:   CATEGORIES.reduce((s, p) => s + matrix[cat][p], 0),
        tp, fp, fn,
      };
    }

    res.json({
      akurasi: training.akurasi,
      tfidf: { fitur: training.fitur_tfidf, estimators: training.estimators, total_data: training.total_data },
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

// ─────────────────────────────────────────────
// START — load cache dulu, baru listen
// ─────────────────────────────────────────────
loadCache()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🟢 Express Server: http://localhost:${PORT}`);
      console.log(`📊 API Docs: http://localhost:${PORT}/api/pengaduan`);
    });
  })
  .catch((err) => {
    console.error("❌ Gagal load cache:", err);
    process.exit(1);
  });
