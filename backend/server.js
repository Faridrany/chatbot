const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());

const DATA_DIR = path.join(__dirname, "../data");
const PROCESSED_DIR = path.join(DATA_DIR, "processed");

// ─────────────────────────────────────────────
// CACHE — hanya data yang sering diakses
// Pipeline file (casefolded, cleaned, dll) TIDAK di-load saat startup
// karena total ~3MB dan memperlambat boot. Di-load lazy per request.
// ─────────────────────────────────────────────
const cache = {
  pengaduan: null,        // final_processed.json  (~500KB, array 1200 item)
  training: null,        // hasil_training.json   (~2KB)
  stats: null,        // hasil komputasi stats
  pipelineMap: null,      // lazy-loaded saat pertama kali dibutuhkan
  pipelineLoading: false, // guard agar tidak double-load
};

// ── Baca hanya 2 file kecil/menengah saat startup ──
async function loadCache() {
  console.log("⏳ Loading core data into memory...");

  const [pengaduanRaw, trainingRaw] = await Promise.all([
    fs.readFile(path.join(PROCESSED_DIR, "final_processed.json"), "utf-8"),
    fs.readFile(path.join(DATA_DIR, "hasil_training.json"), "utf-8").catch(() => "{}"),
  ]);

  cache.pengaduan = JSON.parse(pengaduanRaw);
  cache.training = JSON.parse(trainingRaw);
  cache.stats = computeStats(cache.pengaduan);

  console.log(`✅ Cache loaded: ${cache.pengaduan.length} pengaduan`);
}

// ── Lazy load pipeline Map (hanya sekali, saat pertama kali diperlukan) ──
async function getPipelineMap() {
  if (cache.pipelineMap) return cache.pipelineMap;

  // Tunggu jika sedang loading (concurrent requests)
  if (cache.pipelineLoading) {
    await new Promise((resolve) => {
      const wait = setInterval(() => {
        if (!cache.pipelineLoading) { clearInterval(wait); resolve(); }
      }, 50);
    });
    return cache.pipelineMap;
  }

  cache.pipelineLoading = true;
  console.log("⏳ Lazy-loading pipeline files...");

  try {
    const [casefoldedRaw, cleanedRaw, normalizedRaw, tokenizedRaw, stopRaw, stemmedRaw] =
      await Promise.all([
        fs.readFile(path.join(PROCESSED_DIR, "casefolded.json"), "utf-8").catch(() => "[]"),
        fs.readFile(path.join(PROCESSED_DIR, "cleaned.json"), "utf-8").catch(() => "[]"),
        fs.readFile(path.join(PROCESSED_DIR, "normalized.json"), "utf-8").catch(() => "[]"),
        fs.readFile(path.join(PROCESSED_DIR, "tokenized.json"), "utf-8").catch(() => "[]"),
        fs.readFile(path.join(PROCESSED_DIR, "stop_removed.json"), "utf-8").catch(() => "[]"),
        fs.readFile(path.join(PROCESSED_DIR, "stemmed.json"), "utf-8").catch(() => "[]"),
      ]);

    const norm = (s) => s?.trim().replace(/\s+/g, " ") ?? "";
    const map = new Map();

    const entries = {
      cleaned: JSON.parse(cleanedRaw),
      casefolded: JSON.parse(casefoldedRaw),
      normalized: JSON.parse(normalizedRaw),
      tokenized: JSON.parse(tokenizedRaw),
      stop_removed: JSON.parse(stopRaw),
      stemmed: JSON.parse(stemmedRaw),
    };

    for (const [key, arr] of Object.entries(entries)) {
      for (const item of arr) {
        const desc = norm(item.deskripsi);
        if (!desc) continue;
        if (!map.has(desc)) map.set(desc, {});
        const val = item[key] !== undefined ? item[key] : item["hasil"];
        if (val !== undefined) map.get(desc)[key] = val;
      }
    }

    cache.pipelineMap = map;
    console.log(`✅ Pipeline map built: ${map.size} entries`);
  } finally {
    cache.pipelineLoading = false;
  }

  return cache.pipelineMap;
}

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
function computeStats(pengaduan) {
  const kategoriCount = {};
  let latestTs = new Date(0);
  let hasTs = false;

  for (const item of pengaduan) {
    const cat = item.kategori_prediksi || item.Kategori || item.kategori || "Unknown";
    kategoriCount[cat] = (kategoriCount[cat] || 0) + 1;

    const rawTs = item.timestamp || item.tanggal || item.created_at;
    if (rawTs) {
      const ts = new Date(rawTs);
      if (!isNaN(ts) && ts > latestTs) { latestTs = ts; hasTs = true; }
    }
  }

  const ms3 = 3 * 86400000;
  const ms7 = 7 * 86400000;
  let baru3 = 0, baru7 = 0;
  const weekly = [0, 0, 0, 0];

  if (hasTs) {
    for (const item of pengaduan) {
      const rawTs = item.timestamp || item.tanggal || item.created_at;
      if (!rawTs) continue;
      const ts = new Date(rawTs);
      if (isNaN(ts)) continue;
      const diff = latestTs - ts;
      if (diff <= ms3) baru3++;
      if (diff <= ms7) baru7++;
      const days = Math.floor(diff / 86400000);
      if (days < 7) weekly[3]++;
      else if (days < 14) weekly[2]++;
      else if (days < 21) weekly[1]++;
      else if (days < 28) weekly[0]++;
    }
  } else {
    const perWeek = Math.floor(pengaduan.length / 4);
    const remainder = pengaduan.length % 4;
    for (let i = 0; i < 4; i++) weekly[i] = perWeek + (i === 3 ? remainder : 0);
  }

  const kategoriTerbanyak =
    Object.entries(kategoriCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return { total: pengaduan.length, baru3Hari: baru3, baru7Hari: baru7, kategoriTerbanyak, kategori: kategoriCount, weeklyData: weekly };
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// Evaluasi model
app.get("/api/evaluasi", async (_req, res) => {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "hasil_training.json"), "utf-8");
    res.json(JSON.parse(raw));
  } catch {
    res.status(404).json({ error: "hasil_training.json belum ada. Jalankan python main.py --train." });
  }
});

// Stats dashboard
app.get("/api/stats", (_req, res) => {
  res.json(cache.stats);
});

// List pengaduan dengan paginasi + filter
app.get("/api/pengaduan", (_req, res) => {
  const page = Math.max(1, parseInt(_req.query.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(_req.query.limit ?? "10", 10)));
  const search = (_req.query.search ?? "").toLowerCase().trim();
  const kategori = (_req.query.kategori ?? "").toUpperCase().trim();

  let result = cache.pengaduan.map((item, i) => ({
    _id: i,
    nama: item.nama ?? "",
    no_wa: (item.no_wa ?? "").replace("@c.us", ""),
    deskripsi: item.deskripsi ?? "",
    kategori_prediksi: item.kategori_prediksi || item.Kategori || item.kategori || "-",
    timestamp: item.timestamp || item.tanggal || item.created_at || null,
    confidence: item.confidence ?? item.akurasi_model ?? null,
  }));

  if (search) {
    result = result.filter((item) =>
      item.deskripsi.toLowerCase().includes(search) ||
      item.nama.toLowerCase().includes(search)
    );
  }
  if (kategori && kategori !== "SEMUA") {
    result = result.filter((item) => item.kategori_prediksi === kategori);
  }

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const items = result.slice(start, start + limit);

  res.json({ items, total, page, totalPages, limit });
});

// Detail pengaduan (tanpa pipeline)
app.get("/api/pengaduan/:id", (req, res) => {
  const item = cache.pengaduan[parseInt(req.params.id)];
  if (!item) return res.status(404).json({ error: "Data tidak ditemukan" });
  res.json(item);
});

// Detail pengaduan + pipeline (lazy load pipeline map)
app.get("/api/pengaduan/:id/processed", async (req, res) => {
  const item = cache.pengaduan[parseInt(req.params.id)];
  if (!item) return res.status(404).json({ error: "Data tidak ditemukan" });

  const pipelineMap = await getPipelineMap();
  const key = item.deskripsi?.trim().replace(/\s+/g, " ") ?? "";
  const pipelineData = pipelineMap.get(key) ?? {};

  const confidence = item.confidence ?? item.akurasi_model
    ?? (cache.training?.akurasi ?? null);

  res.json({
    ...item,
    kategori_prediksi: item.kategori_prediksi || item.Kategori || item.kategori || "-",
    timestamp: item.timestamp || item.tanggal || item.created_at || "-",
    confidence,
    pipeline: {
      cleaned: pipelineData.cleaned ?? null,
      casefolded: pipelineData.casefolded ?? null,
      tokenized: pipelineData.tokenized ?? null,
      normalized: pipelineData.normalized ?? null,
      stop_removed: pipelineData.stop_removed ?? null,
      stemmed: pipelineData.stemmed ?? null,
      final_text: item.processed || item.final_text || pipelineData.final_text || "",
    },
  });
});

// Dataset berlabel
app.get("/api/dataset", async (_req, res) => {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "raw/dataset_berlabel.json"), "utf-8");
    const data = JSON.parse(raw);
    res.json(data.map((item, i) => ({
      _id: i,
      nama: item.nama ?? "",
      no_wa: (item.no_wa ?? "").replace("@c.us", ""),
      deskripsi: item.deskripsi ?? "",
      kategori_prediksi: item.Kategori || item.kategori || "-",
      timestamp: item.timestamp ?? "-",
    })));
  } catch {
    res.json([]);
  }
});

// Statistik model
app.get("/api/statistik", (_req, res) => {
  try {
    const CATEGORIES = ["KEAMANAN", "INFRASTRUKTUR", "LINGKUNGAN", "PELAYANAN"];
    const training = cache.training;
    const predData = cache.pengaduan;

    const predCount = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    for (const item of predData) {
      const cat = item.kategori_prediksi || item.Kategori || item.kategori;
      if (predCount[cat] !== undefined) predCount[cat]++;
    }

    res.json({
      akurasi: training.akurasi,
      tfidf: { fitur: training.fitur_tfidf, estimators: training.estimators, total_data: training.total_data },
      confusionMatrix: training.confusionMatrix,
      perClass: training.perClass,
      distribusi: predCount,
      totalPrediksi: predData.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hitung statistik: " + err.message });
  }
});

// ─────────────────────────────────────────────
// KLASIFIKASI — data baru dari WhatsApp chatbot
// ─────────────────────────────────────────────

app.get("/api/data-baru", async (_req, res) => {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "raw/data_baru.json"), "utf-8");
    const data = JSON.parse(raw);
    res.json(data.map((item) => ({ ...item, no_wa: (item.no_wa ?? "").replace("@c.us", "") })));
  } catch {
    res.json([]);
  }
});

app.get("/api/hasil-prediksi", async (_req, res) => {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "predictions/hasil_prediksi.json"), "utf-8");
    res.json(JSON.parse(raw));
  } catch {
    res.json([]);
  }
});

app.post("/api/klasifikasi", async (_req, res) => {
  try {
    const rawBaru = await fs.readFile(path.join(DATA_DIR, "raw/data_baru.json"), "utf-8").catch(() => "[]");
    const dataBaru = JSON.parse(rawBaru);
    if (!dataBaru.length) {
      return res.status(400).json({ success: false, error: "Tidak ada data baru untuk diklasifikasi." });
    }

    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const scriptPath = path.join(__dirname, "main.py");
    const child = spawn(pythonCmd, [scriptPath], { cwd: __dirname, env: { ...process.env } });

    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    child.on("close", async (code) => {
      if (code === 0) {
        // Reload core cache + reset pipeline cache
        try {
          await loadCache();
          cache.pipelineMap = null; // force lazy reload
        } catch (_) { }
        const rawHasil = await fs.readFile(path.join(DATA_DIR, "predictions/hasil_prediksi.json"), "utf-8").catch(() => "[]");
        const hasil = JSON.parse(rawHasil);
        res.json({ success: true, jumlah: hasil.length, log: stdout });
      } else {
        res.status(500).json({ success: false, error: stderr || "Proses Python gagal.", log: stdout });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// EXPORT EXCEL
// ─────────────────────────────────────────────
const EXPORT_EXCEL_PATH = path.join(__dirname, "../data/export/preprocessing_result.xlsx");

app.get("/api/export/preprocessing", async (_req, res) => {
  try {
    await fs.access(EXPORT_EXCEL_PATH);
    res.download(EXPORT_EXCEL_PATH, "preprocessing_result.xlsx");
  } catch {
    res.status(404).json({ error: "File Excel belum tersedia. Jalankan python main.py --train." });
  }
});

app.post("/api/export/preprocessing/generate", (_req, res) => {
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  const scriptPath = path.join(__dirname, "main.py");
  const child = spawn(pythonCmd, [scriptPath, "--export"], { cwd: __dirname, env: { ...process.env } });

  let stdout = "", stderr = "";
  child.stdout.on("data", (d) => { stdout += d.toString(); });
  child.stderr.on("data", (d) => { stderr += d.toString(); });

  child.on("close", (code) => {
    if (code === 0) res.json({ success: true, message: "File Excel berhasil dibuat.", log: stdout });
    else res.status(500).json({ success: false, error: stderr || "Proses Python gagal.", log: stdout });
  });
});

// ─────────────────────────────────────────────
// START — hanya load 2 file kecil, server langsung siap
// ─────────────────────────────────────────────
loadCache()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🟢 Express Server: http://localhost:${PORT}`);
      console.log(`📊 Data Pengaduan: ${cache.pengaduan.length} entri siap`);
    });
  })
  .catch((err) => {
    console.error("❌ Gagal load cache:", err.message);
    process.exit(1);
  });
