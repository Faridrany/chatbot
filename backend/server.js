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
  stats: null,            // hasil komputasi stats (dari final_processed.json)
  statsTraining: null,    // statistik data latih (dari dataset_berlabel.json)
  pipelineMap: null,      // lazy-loaded saat pertama kali dibutuhkan
  pipelineLoading: false, // guard agar tidak double-load
};

// ── Baca hanya file kecil/menengah saat startup ──
async function loadCache() {
  console.log("⏳ Loading core data into memory...");

  const [finalProcessedRaw, trainingRaw, berlabelRaw] = await Promise.all([
    fs.readFile(path.join(PROCESSED_DIR, "final_processed.json"), "utf-8"),
    fs.readFile(path.join(DATA_DIR, "hasil_training.json"), "utf-8").catch(() => "{}"),
    fs.readFile(path.join(DATA_DIR, "raw/dataset_berlabel.json"), "utf-8").catch(() => "[]"),
  ]);

  cache.pengaduan = JSON.parse(finalProcessedRaw);
  cache.training = JSON.parse(trainingRaw);
  cache.stats = computeStats(cache.pengaduan);
  cache.statsTraining = computeTrainingStats(JSON.parse(berlabelRaw));

  console.log(`✅ Cache loaded: ${cache.pengaduan.length} pengaduan (training + klasifikasi), ${cache.statsTraining.totalDataLatih} data latih`);
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

/** Statistik data latih — sumber: dataset_berlabel.json */
function computeTrainingStats(dataset) {
  const distribusi = {};
  for (const item of dataset) {
    const cat = item.Kategori || item.kategori || "Unknown";
    distribusi[cat] = (distribusi[cat] || 0) + 1;
  }
  return {
    totalDataLatih: dataset.length,
    distribusiLatih: distribusi,
  };
}

/** Statistik pengaduan masuk — sumber: final_processed.json */
function computeStats(pengaduan) {
  const kategoriCount = {};
  let latestTs = new Date(0);
  let hasTs = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let totalHariIni = 0;

  for (const item of pengaduan) {
    const cat = item.kategori_prediksi || item.Kategori || item.kategori || "Unknown";
    kategoriCount[cat] = (kategoriCount[cat] || 0) + 1;

    const rawTs = item.timestamp || item.tanggal || item.created_at;
    if (rawTs && rawTs !== "-") {
      const ts = new Date(rawTs);
      if (!isNaN(ts)) {
        if (ts > latestTs) { latestTs = ts; hasTs = true; }
        const tsDay = new Date(ts);
        tsDay.setHours(0, 0, 0, 0);
        if (tsDay.getTime() === today.getTime()) totalHariIni++;
      }
    }
  }

  const ms3 = 3 * 86400000;
  const ms7 = 7 * 86400000;
  let baru3 = 0, baru7 = 0;
  const weekly = [0, 0, 0, 0];

  if (hasTs) {
    for (const item of pengaduan) {
      const rawTs = item.timestamp || item.tanggal || item.created_at;
      if (!rawTs || rawTs === "-") continue;
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

  return {
    total: pengaduan.length,
    totalPengaduan: pengaduan.length,
    totalBaru: totalHariIni,
    baru3Hari: baru3,
    baru7Hari: baru7,
    kategoriTerbanyak,
    kategori: kategoriCount,
    weeklyData: weekly,
  };
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

// Stats dashboard — sumber: final_processed.json
app.get("/api/stats", (_req, res) => {
  res.json({
    ...cache.stats,
    totalDataLatih: cache.statsTraining?.totalDataLatih ?? 0,
  });
});

// Stats data latih — sumber: dataset_berlabel.json
app.get("/api/stats/training", (_req, res) => {
  res.json(cache.statsTraining ?? { totalDataLatih: 0, distribusiLatih: {} });
});

// List pengaduan dengan paginasi + filter
app.get("/api/pengaduan", (_req, res) => {
  const page = Math.max(1, parseInt(_req.query.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(_req.query.limit ?? "10", 10)));
  const search = (_req.query.search ?? "").toLowerCase().trim();
  const kategori = (_req.query.kategori ?? "").toUpperCase().trim();

  let result = cache.pengaduan.map((item, i) => ({
    _id: i,
    kode_pengaduan: item.kode_pengaduan ?? `PGD-${String(i + 1).padStart(4, "0")}`,
    nama: item.nama ?? "",
    no_wa: (item.no_wa ?? "").replace("@c.us", ""),
    deskripsi: item.deskripsi ?? "",
    processed: item.processed ?? item.final_text ?? "",
    kategori_prediksi: item.kategori_prediksi || item.Kategori || item.kategori || "-",
    label_asli: item.label_asli ?? "-",
    timestamp: item.timestamp || item.tanggal || item.created_at || null,
    confidence: item.confidence ?? item.akurasi_model ?? null,
    status: item.status ?? "Menunggu",
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

// ── HAPUS pengaduan ──
app.delete("/api/pengaduan/:id", async (req, res) => {
  const idx = parseInt(req.params.id);
  if (isNaN(idx) || idx < 0 || idx >= cache.pengaduan.length) {
    return res.status(404).json({ error: "Data tidak ditemukan" });
  }
  cache.pengaduan.splice(idx, 1);
  // Simpan kembali ke final_processed.json
  await fs.writeFile(
    path.join(PROCESSED_DIR, "final_processed.json"),
    JSON.stringify(cache.pengaduan, null, 4),
    "utf-8"
  );
  // Recompute stats
  cache.stats = computeStats(cache.pengaduan);
  // Reset pipeline cache
  cache.pipelineMap = null;
  res.json({ success: true, total: cache.pengaduan.length });
});

// ── UPDATE STATUS pengaduan ──
app.patch("/api/pengaduan/:id/status", async (req, res) => {
  const idx = parseInt(req.params.id);
  const { status } = req.body;
  const VALID = ["Menunggu", "Diproses", "Selesai"];

  if (isNaN(idx) || idx < 0 || idx >= cache.pengaduan.length) {
    return res.status(404).json({ error: "Data tidak ditemukan" });
  }
  if (!VALID.includes(status)) {
    return res.status(400).json({ error: `Status tidak valid. Pilihan: ${VALID.join(", ")}` });
  }

  cache.pengaduan[idx].status = status;
  await fs.writeFile(
    path.join(PROCESSED_DIR, "final_processed.json"),
    JSON.stringify(cache.pengaduan, null, 4),
    "utf-8"
  );
  // Reset pipeline cache
  cache.pipelineMap = null;
  res.json({ success: true, status });
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
    proba_all: item.proba_all ?? null,
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
// STAGE FILES — normalized lookup by kode_pengaduan
// ─────────────────────────────────────────────
const STAGES_DIR = path.join(DATA_DIR, "stages");

// Helper: lazy-load a stage file (keyed by kode_pengaduan)
const stageCache = {};
async function loadStage(name) {
  if (stageCache[name]) return stageCache[name];
  try {
    const raw = await fs.readFile(path.join(STAGES_DIR, `${name}.json`), "utf-8");
    stageCache[name] = JSON.parse(raw);
    return stageCache[name];
  } catch {
    return {};
  }
}

// GET /api/stages/:kode — ambil semua stage detail satu pengaduan
app.get("/api/stages/:kode", async (req, res) => {
  const kode = req.params.kode;
  const include = (req.query.include ?? "tfidf,filtering,seleksi_fitur,random_forest,tokenisasi")
    .split(",").map(s => s.trim());

  const result = {};
  await Promise.all(include.map(async (stage) => {
    const data = await loadStage(stage);
    result[stage] = data[kode] ?? null;
  }));

  res.json(result);
});

// GET /api/stages/tfidf/:kode — TF-IDF terms untuk satu pengaduan
app.get("/api/stages/tfidf/:kode", async (req, res) => {
  const data = await loadStage("tfidf");
  const entry = data[req.params.kode];
  if (!entry) return res.status(404).json({ error: "Kode pengaduan tidak ditemukan" });
  res.json(entry);
});

// GET /api/stages/tokenisasi/:kode
app.get("/api/stages/tokenisasi/:kode", async (req, res) => {
  const data = await loadStage("tokenisasi");
  const entry = data[req.params.kode];
  if (!entry) return res.status(404).json({ error: "Kode pengaduan tidak ditemukan" });
  res.json(entry);
});

// GET /api/stages/filtering/:kode
app.get("/api/stages/filtering/:kode", async (req, res) => {
  const data = await loadStage("filtering");
  const entry = data[req.params.kode];
  if (!entry) return res.status(404).json({ error: "Kode pengaduan tidak ditemukan" });
  res.json(entry);
});

// GET /api/stages/seleksi_fitur/:kode
app.get("/api/stages/seleksi_fitur/:kode", async (req, res) => {
  const data = await loadStage("seleksi_fitur");
  const entry = data[req.params.kode];
  if (!entry) return res.status(404).json({ error: "Kode pengaduan tidak ditemukan" });
  res.json(entry);
});

// GET /api/stages/random_forest/:kode
app.get("/api/stages/random_forest/:kode", async (req, res) => {
  const data = await loadStage("random_forest");
  const entry = data[req.params.kode];
  if (!entry) return res.status(404).json({ error: "Kode pengaduan tidak ditemukan" });
  res.json(entry);
});



// ─────────────────────────────────────────────
// BOOTSTRAP SAMPLING — data nyata per pohon
// ─────────────────────────────────────────────

// Cache bootstrap: hanya load per-tree saat diminta (on-demand)
const bootstrapCache = {
  summary: null,      // ringkasan semua 20 pohon (kecil, ~5KB)
  lookup: null,       // kode_pengaduan → nama/deskripsi/kategori
  trees: {},          // tree_N → data detail (lazy per pohon)
};

// Load summary & lookup sekali saja
async function getBootstrapSummary() {
  if (bootstrapCache.summary) return bootstrapCache.summary;
  try {
    const raw = await fs.readFile(path.join(STAGES_DIR, "bootstrap.json"), "utf-8");
    const data = JSON.parse(raw);
    // Simpan versi ringkasan (tanpa array sampel & oob — bisa besar)
    const summary = {};
    for (const [key, val] of Object.entries(data)) {
      summary[key] = {
        total_sampel: val.total_sampel,
        unique_sampel: val.unique_sampel,
        duplikat: val.duplikat,
        oob_count: val.oob_count,
        class_distribution: val.class_distribution,
        oob_class_distribution: val.oob_class_distribution,
      };
    }
    bootstrapCache.summary = summary;
    return summary;
  } catch {
    return null;
  }
}

async function getBootstrapLookup() {
  if (bootstrapCache.lookup) return bootstrapCache.lookup;
  try {
    const raw = await fs.readFile(path.join(STAGES_DIR, "bootstrap_lookup.json"), "utf-8");
    bootstrapCache.lookup = JSON.parse(raw);
    return bootstrapCache.lookup;
  } catch {
    return {};
  }
}

async function getBootstrapTree(treeId) {
  const key = `tree_${treeId}`;
  if (bootstrapCache.trees[key]) return bootstrapCache.trees[key];
  try {
    const raw = await fs.readFile(path.join(STAGES_DIR, "bootstrap.json"), "utf-8");
    const data = JSON.parse(raw);
    if (data[key]) {
      bootstrapCache.trees[key] = data[key];
      return data[key];
    }
    return null;
  } catch {
    return null;
  }
}

// GET /api/bootstrap — ringkasan semua 20 pohon
app.get("/api/bootstrap", async (_req, res) => {
  try {
    const summary = await getBootstrapSummary();
    if (!summary) {
      return res.status(404).json({ error: "bootstrap.json belum ada. Jalankan python main.py --train." });
    }
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bootstrap/:treeId — detail sampel & OOB untuk satu pohon (on-demand)
app.get("/api/bootstrap/:treeId", async (req, res) => {
  try {
    const treeId = parseInt(req.params.treeId, 10);
    if (isNaN(treeId) || treeId < 1 || treeId > 20) {
      return res.status(400).json({ error: "treeId harus antara 1 dan 20" });
    }

    const [treeData, lookup] = await Promise.all([
      getBootstrapTree(treeId),
      getBootstrapLookup(),
    ]);

    if (!treeData) {
      return res.status(404).json({ error: `Data untuk tree_${treeId} tidak ditemukan` });
    }

    // Enrich sampel dengan nama & deskripsi dari lookup
    const sampelEnriched = (treeData.sampel || []).map((s) => {
      const info = lookup[s.kode_pengaduan] || {};
      return {
        kode_pengaduan: s.kode_pengaduan,
        diambil: s.diambil,
        kategori: s.kategori,
        nama: info.nama || "-",
        deskripsi: info.deskripsi || "-",
      };
    });

    // Enrich OOB dengan nama & deskripsi dari lookup
    const oobEnriched = (treeData.oob || []).map((kode) => {
      const info = lookup[kode] || {};
      return {
        kode_pengaduan: kode,
        kategori: info.kategori || "-",
        nama: info.nama || "-",
        deskripsi: info.deskripsi || "-",
      };
    });

    res.json({
      tree_id: treeId,
      total_sampel: treeData.total_sampel,
      unique_sampel: treeData.unique_sampel,
      duplikat: treeData.duplikat,
      oob_count: treeData.oob_count,
      class_distribution: treeData.class_distribution,
      oob_class_distribution: treeData.oob_class_distribution,
      sampel: sampelEnriched,
      oob: oobEnriched,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/api/tfidf", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit ?? "50", 10)));
    const search = (req.query.search ?? "").toLowerCase().trim();
    const status = (req.query.status ?? "semua").toLowerCase(); // "terpilih" | "eliminasi" | "semua"
    const ngram = (req.query.ngram ?? "semua").toLowerCase(); // "unigram" | "bigram" | "semua"

    const rawTerms = await fs.readFile(path.join(DATA_DIR, "tfidf_terms.json"), "utf-8")
      .catch(() => "[]");
    const training = cache.training;

    let terms = JSON.parse(rawTerms);

    // Filter
    if (search) terms = terms.filter(t => t.term.includes(search));
    if (status !== "semua") {
      const wantSelected = status === "terpilih";
      terms = terms.filter(t => t.selected === wantSelected);
    }
    if (ngram !== "semua") terms = terms.filter(t => t.ngram === ngram);

    const total = terms.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const items = terms.slice((page - 1) * limit, page * limit);

    res.json({
      summary: {
        fitur_tfidf: training.fitur_tfidf ?? 2612,
        fitur_selected: training.fitur_selected ?? 1000,
        ngram_range: training.ngram_range ?? [1, 2],
        total_data: training.total_data ?? 1200,
        data_train: training.data_train ?? 960,
        data_test: training.data_test ?? 240,
        total_unigram: JSON.parse(rawTerms).filter(t => t.ngram === "unigram").length,
        total_bigram: JSON.parse(rawTerms).filter(t => t.ngram === "bigram").length,
      },
      items,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sample dokumen ter-vektorisasi
app.get("/api/tfidf/samples", async (_req, res) => {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "tfidf_sample_docs.json"), "utf-8")
      .catch(() => "[]");
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// MAJORITY VOTING — per-pengaduan transparency
// ─────────────────────────────────────────────
const votingCache = { data: null, loading: false };

async function getVotingData() {
  if (votingCache.data) return votingCache.data;
  if (votingCache.loading) {
    await new Promise((r) => { const w = setInterval(() => { if (!votingCache.loading) { clearInterval(w); r(); } }, 50); });
    return votingCache.data;
  }
  votingCache.loading = true;
  try {
    const raw = await fs.readFile(path.join(STAGES_DIR, "majority_voting.json"), "utf-8");
    votingCache.data = JSON.parse(raw);
  } catch { votingCache.data = null; }
  finally { votingCache.loading = false; }
  return votingCache.data;
}

// GET /api/voting — daftar semua pengaduan dengan ringkasan voting (paginasi + filter)
app.get("/api/voting", async (req, res) => {
  try {
    const data = await getVotingData();
    if (!data) return res.status(404).json({ error: "majority_voting.json belum ada. Jalankan python main.py --train." });

    const page   = Math.max(1, parseInt(req.query.page   ?? "1",  10));
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit ?? "20", 10)));
    const search = (req.query.search  ?? "").toLowerCase().trim();
    const filter = (req.query.benar   ?? "semua").toLowerCase(); // benar | salah | semua
    const kat    = (req.query.kategori ?? "").toUpperCase().trim();

    const kodeLookup = new Map(cache.pengaduan.map((p) => [p.kode_pengaduan, p]));

    let items = Object.entries(data)
      .filter(([k]) => !k.startsWith("_"))
      .map(([kode, v]) => {
        const info = kodeLookup.get(kode) ?? {};
        // Hitung ringkasan vote
        const n20   = Object.keys(v.vote_per_pohon ?? {}).length;
        const winV  = (v.distribusi_vote ?? {})[v.majority_vote] ?? 0;
        return {
          kode_pengaduan  : kode,
          nama            : info.nama ?? "-",
          deskripsi       : info.deskripsi ?? "-",
          label_asli      : v.label_asli,
          majority_vote   : v.majority_vote,
          confidence      : v.confidence,
          benar           : v.benar,
          distribusi_vote : v.distribusi_vote,
          n_majority_votes: winV,
          n_total_votes   : n20,
          low_confidence  : winV < Math.ceil(n20 / 2) + 2, // < 12 suara dari 20
        };
      });

    if (search) items = items.filter((i) =>
      i.kode_pengaduan.toLowerCase().includes(search) ||
      i.nama.toLowerCase().includes(search) ||
      i.deskripsi.toLowerCase().includes(search)
    );
    if (filter === "benar") items = items.filter((i) => i.benar);
    if (filter === "salah") items = items.filter((i) => !i.benar);
    if (kat && kat !== "SEMUA") items = items.filter((i) => i.label_asli === kat || i.majority_vote === kat);

    const total      = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ items: items.slice((page - 1) * limit, page * limit), total, page, totalPages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/voting/:kode — detail voting lengkap satu pengaduan (on-demand)
app.get("/api/voting/:kode", async (req, res) => {
  try {
    const data = await getVotingData();
    if (!data) return res.status(404).json({ error: "majority_voting.json belum ada." });

    const kode  = req.params.kode;
    const entry = data[kode];
    if (!entry) return res.status(404).json({ error: `${kode} tidak ditemukan` });

    const info  = cache.pengaduan.find((p) => p.kode_pengaduan === kode) ?? {};
    res.json({
      kode_pengaduan      : kode,
      nama                : info.nama ?? "-",
      deskripsi           : info.deskripsi ?? "-",
      processed           : info.processed ?? "-",
      label_asli          : entry.label_asli,
      majority_vote       : entry.majority_vote,
      confidence          : entry.confidence,
      benar               : entry.benar,
      distribusi_vote     : entry.distribusi_vote,
      vote_per_pohon      : entry.vote_per_pohon,
      pohon_representatif : entry.pohon_representatif,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ─────────────────────────────────────────────
const giniCache = { summary: null, trees: {}, loading: false };

async function loadGiniSummary() {
  if (giniCache.summary) return giniCache.summary;
  if (giniCache.loading) {
    await new Promise((r) => { const w = setInterval(() => { if (!giniCache.loading) { clearInterval(w); r(); } }, 50); });
    return giniCache.summary;
  }
  giniCache.loading = true;
  try {
    const raw  = await fs.readFile(path.join(STAGES_DIR, "gini_splitting.json"), "utf-8");
    const full = JSON.parse(raw);
    // Simpan ringkasan (tanpa array nodes) + term_split_global
    const summary = { _meta: full._meta, _term_split_global: full._term_split_global, trees: {} };
    for (const [k, v] of Object.entries(full)) {
      if (k.startsWith("tree_")) {
        summary.trees[k] = {
          total_node: v.total_node, total_split: v.total_split,
          total_leaf: v.total_leaf, kedalaman: v.kedalaman,
          rata_gini: v.rata_gini,   top_term: v.top_term,
        };
      }
    }
    giniCache.summary = summary;
    // Cache nodes per pohon lazy (simpan full data tapi pisah)
    for (const [k, v] of Object.entries(full)) {
      if (k.startsWith("tree_")) giniCache.trees[k] = v.nodes;
    }
  } catch { giniCache.summary = null; }
  finally { giniCache.loading = false; }
  return giniCache.summary;
}

// GET /api/gini — ringkasan semua pohon + term_split_global
app.get("/api/gini", async (_req, res) => {
  try {
    const s = await loadGiniSummary();
    if (!s) return res.status(404).json({ error: "gini_splitting.json belum ada. Jalankan python main.py --train." });
    res.json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/gini/terms — HARUS sebelum /api/gini/:treeId agar tidak terambil sebagai treeId
// term split global dengan filter min_pohon
app.get("/api/gini/terms", async (req, res) => {
  try {
    const s = await loadGiniSummary();
    if (!s) return res.status(404).json({ error: "gini_splitting.json belum ada." });

    const minPohon = parseInt(req.query.min_pohon ?? "1", 10);
    const search   = (req.query.search ?? "").toLowerCase().trim();
    const page     = Math.max(1, parseInt(req.query.page  ?? "1",  10));
    const limit    = Math.min(200, Math.max(1, parseInt(req.query.limit ?? "50", 10)));

    let terms = (s._term_split_global ?? [])
      .filter((t) => t.pohon_unik >= minPohon)
      .filter((t) => !search || t.term.includes(search));

    const total      = terms.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ items: terms.slice((page - 1) * limit, page * limit), total, page, totalPages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/gini/:treeId/nodes — semua node pohon (tanpa sampel_ids)
app.get("/api/gini/:treeId/nodes", async (req, res) => {
  try {
    await loadGiniSummary();
    const key   = `tree_${req.params.treeId}`;
    const nodes = giniCache.trees[key];
    if (!nodes) return res.status(404).json({ error: `tree_${req.params.treeId} tidak ditemukan` });

    const search = (req.query.search ?? "").toLowerCase().trim();
    const tipe   = (req.query.tipe   ?? "semua").toLowerCase();
    const pure   = req.query.pure;

    let items = nodes;
    if (tipe !== "semua")    items = items.filter((n) => n.tipe === tipe);
    if (pure === "1")        items = items.filter((n) => n.is_pure);
    if (search)              items = items.filter((n) => n.term_split?.includes(search));

    res.json({ tree_id: parseInt(req.params.treeId), total: items.length, nodes: items });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/gini/:treeId/node/:nodeId/samples — sampel per node (on-demand)
app.get("/api/gini/:treeId/node/:nodeId/samples", async (req, res) => {
  try {
    const treeId = req.params.treeId;
    const nodeId = req.params.nodeId;
    const sampleFile = path.join(STAGES_DIR, "gini_samples", `tree${treeId}_node${nodeId}.json`);

    let kodes = [];
    try {
      const raw = await fs.readFile(sampleFile, "utf-8");
      kodes = JSON.parse(raw);
    } catch { /* file tidak ada = node kosong */ }

    const kodeLookup = new Map(cache.pengaduan.map((p) => [p.kode_pengaduan, p]));
    const items = kodes.map((kode) => {
      const info = kodeLookup.get(kode) ?? {};
      return {
        kode_pengaduan   : kode,
        nama             : info.nama ?? "-",
        deskripsi        : info.deskripsi ?? "-",
        label_asli       : info.label_asli ?? "-",
        kategori_prediksi: info.kategori_prediksi ?? "-",
      };
    });

    res.json({ tree_id: parseInt(treeId), node_id: parseInt(nodeId), total: items.length, items });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ─────────────────────────────────────────────
const oobCache = { data: null, loading: false };

async function getOobData() {
  if (oobCache.data) return oobCache.data;
  if (oobCache.loading) {
    await new Promise((r) => { const w = setInterval(() => { if (!oobCache.loading) { clearInterval(w); r(); } }, 50); });
    return oobCache.data;
  }
  oobCache.loading = true;
  try {
    const raw = await fs.readFile(path.join(STAGES_DIR, "oob.json"), "utf-8");
    oobCache.data = JSON.parse(raw);
  } catch { oobCache.data = null; }
  finally { oobCache.loading = false; }
  return oobCache.data;
}

// GET /api/oob — ringkasan semua pohon (tanpa oob_data detail)
app.get("/api/oob", async (_req, res) => {
  try {
    const data = await getOobData();
    if (!data) return res.status(404).json({ error: "oob.json belum ada. Jalankan python main.py --train." });
    const summary = {
      oob_score_global: data.oob_score_global,
      jumlah_pohon    : data.jumlah_pohon,
      per_pohon: Object.fromEntries(
        Object.entries(data.per_pohon).map(([k, v]) => [k, {
          oob_count   : v.oob_count,
          benar       : v.benar,
          salah       : v.salah,
          oob_accuracy: v.oob_accuracy,
        }])
      ),
    };
    res.json(summary);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/oob/akumulasi — rekap per pengaduan lintas pohon (on-demand, paginasi)
// HARUS sebelum /api/oob/:treeId agar tidak terambil sebagai treeId
app.get("/api/oob/akumulasi", async (req, res) => {
  try {
    const data = await getOobData();
    if (!data) return res.status(404).json({ error: "oob.json belum ada." });

    const page    = Math.max(1, parseInt(req.query.page  ?? "1",  10));
    const limit   = Math.min(200, Math.max(1, parseInt(req.query.limit ?? "50", 10)));
    const search  = (req.query.search   ?? "").toLowerCase().trim();
    const filter  = (req.query.konsisten ?? "semua").toLowerCase(); // konsisten | tidak | semua

    const kodeLookup = new Map(cache.pengaduan.map((p) => [p.kode_pengaduan, p]));
    let items = Object.entries(data.akumulasi ?? {}).map(([kode, v]) => ({
      kode_pengaduan    : kode,
      label_asli        : v.label_asli,
      prediksi_final_oob: v.prediksi_final_oob,
      muncul_di_pohon   : v.muncul_di_pohon,
      konsisten         : v.konsisten,
      nama              : kodeLookup.get(kode)?.nama     ?? "-",
      deskripsi         : kodeLookup.get(kode)?.deskripsi ?? "-",
    }));

    if (search) items = items.filter((i) =>
      i.kode_pengaduan.toLowerCase().includes(search) ||
      i.nama.toLowerCase().includes(search)
    );
    if (filter === "konsisten") items = items.filter((i) => i.konsisten);
    if (filter === "tidak")     items = items.filter((i) => !i.konsisten);

    const total      = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ items: items.slice((page - 1) * limit, page * limit), total, page, totalPages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/oob/:treeId — detail oob_data satu pohon (on-demand)
app.get("/api/oob/:treeId", async (req, res) => {
  try {
    const data = await getOobData();
    if (!data) return res.status(404).json({ error: "oob.json belum ada." });
    const key     = `tree_${req.params.treeId}`;
    const treeData = data.per_pohon?.[key];
    if (!treeData) return res.status(404).json({ error: `tree_${req.params.treeId} tidak ditemukan` });

    // Enrich dengan nama & deskripsi dari cache pengaduan
    const kodeLookup = new Map(cache.pengaduan.map((p) => [p.kode_pengaduan, p]));
    const enriched = (treeData.oob_data || []).map((d) => {
      const info = kodeLookup.get(d.kode_pengaduan) ?? {};
      return { ...d, nama: info.nama ?? "-", deskripsi: info.deskripsi ?? "-" };
    });
    res.json({ ...treeData, oob_data: enriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────
// CROSS VALIDATION — detail per fold
// ─────────────────────────────────────────────
const cvCache = { data: null, loading: false };

async function getCvData() {
  if (cvCache.data) return cvCache.data;
  if (cvCache.loading) {
    await new Promise((r) => { const w = setInterval(() => { if (!cvCache.loading) { clearInterval(w); r(); } }, 50); });
    return cvCache.data;
  }
  cvCache.loading = true;
  try {
    const raw = await fs.readFile(path.join(STAGES_DIR, "cross_validation.json"), "utf-8");
    cvCache.data = JSON.parse(raw);
  } catch { cvCache.data = null; }
  finally { cvCache.loading = false; }
  return cvCache.data;
}

// GET /api/cv — ringkasan semua fold (tanpa hasil_testing detail)
// GET /api/cv — ringkasan semua fold (tanpa hasil_testing detail)
app.get("/api/cv", async (_req, res) => {
  try {
    const data = await getCvData();
    if (!data) return res.status(404).json({ error: "cross_validation.json belum ada. Jalankan python main.py --train." });
    const summary = {
      n_folds           : data.n_folds,
      rata_rata_akurasi : data.rata_rata_akurasi,
      std_akurasi       : data.std_akurasi,
      cv_scores         : data.cv_scores,
      folds: Object.fromEntries(
        Object.entries(data.folds ?? {}).map(([k, v]) => [k, {
          training_size: v.training_size,
          testing_size : v.testing_size,
          akurasi      : v.akurasi,
        }])
      ),
      jumlah_konsisten_salah: (data.data_konsisten_salah ?? []).length,
    };
    res.json(summary);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/cv/konsisten-salah — HARUS sebelum /api/cv/:foldId agar tidak terambil sebagai foldId
app.get("/api/cv/konsisten-salah", async (req, res) => {
  try {
    const data = await getCvData();
    if (!data) return res.status(404).json({ error: "cross_validation.json belum ada." });
    const kodeLookup = new Map(cache.pengaduan.map((p) => [p.kode_pengaduan, p]));
    const items = (data.data_konsisten_salah ?? []).map((d) => ({
      ...d,
      nama    : kodeLookup.get(d.kode_pengaduan)?.nama     ?? "-",
      deskripsi: kodeLookup.get(d.kode_pengaduan)?.deskripsi ?? "-",
    }));
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/cv/:foldId — detail hasil_testing satu fold (on-demand)
app.get("/api/cv/:foldId", async (req, res) => {
  try {
    const data = await getCvData();
    if (!data) return res.status(404).json({ error: "cross_validation.json belum ada." });
    const key      = `fold_${req.params.foldId}`;
    const foldData = data.folds?.[key];
    if (!foldData) return res.status(404).json({ error: `fold_${req.params.foldId} tidak ditemukan` });

    const page   = Math.max(1, parseInt(req.query.page  ?? "1", 10));
    const limit  = Math.min(500, Math.max(1, parseInt(req.query.limit ?? "50", 10)));
    const search = (req.query.search  ?? "").toLowerCase().trim();
    const filter = (req.query.benar   ?? "semua").toLowerCase();
    const kat    = (req.query.kategori ?? "").toUpperCase().trim();

    const kodeLookup = new Map(cache.pengaduan.map((p) => [p.kode_pengaduan, p]));
    let items = (foldData.hasil_testing ?? []).map((d) => {
      const info = kodeLookup.get(d.kode_pengaduan) ?? {};
      return { ...d, nama: info.nama ?? "-", deskripsi: info.deskripsi ?? "-" };
    });

    if (search) items = items.filter((i) =>
      i.kode_pengaduan.toLowerCase().includes(search) ||
      i.nama.toLowerCase().includes(search) ||
      i.deskripsi.toLowerCase().includes(search)
    );
    if (filter === "benar") items = items.filter((i) => i.benar);
    if (filter === "salah") items = items.filter((i) => !i.benar);
    if (kat && kat !== "SEMUA") items = items.filter((i) => i.label_asli === kat);

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      fold_id      : parseInt(req.params.foldId),
      akurasi      : foldData.akurasi,
      training_size: foldData.training_size,
      testing_size : foldData.testing_size,
      items        : items.slice((page - 1) * limit, page * limit),
      total, page, totalPages,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ─────────────────────────────────────────────

// Cache filtering (lazy, dimuat sekali saat pertama request)
const filteringCache = {
  data: null,
  loading: false,
};

async function getFilteringData() {
  if (filteringCache.data) return filteringCache.data;
  if (filteringCache.loading) {
    await new Promise((resolve) => {
      const w = setInterval(() => { if (!filteringCache.loading) { clearInterval(w); resolve(); } }, 50);
    });
    return filteringCache.data;
  }
  filteringCache.loading = true;
  try {
    const raw = await fs.readFile(path.join(STAGES_DIR, "filtering.json"), "utf-8");
    filteringCache.data = JSON.parse(raw);
  } catch { filteringCache.data = null; }
  finally { filteringCache.loading = false; }
  return filteringCache.data;
}

// GET /api/filtering/summary
// Query: page, limit, search, jenis (terbuang|lolos|semua), sort (df_asc|df_desc|term_asc)
app.get("/api/filtering/summary", async (req, res) => {
  try {
    const data = await getFilteringData();
    if (!data) return res.status(404).json({ error: "filtering.json belum ada. Jalankan python main.py --train." });

    const konfigurasi = data["_konfigurasi"] ?? {};
    const global_     = data["_global"] ?? {};

    const page   = Math.max(1, parseInt(req.query.page  ?? "1",  10));
    const limit  = Math.min(500, Math.max(1, parseInt(req.query.limit ?? "50", 10)));
    const search = (req.query.search ?? "").toLowerCase().trim();
    const jenis  = (req.query.jenis  ?? "semua").toLowerCase();
    const sort   = (req.query.sort   ?? "df_asc").toLowerCase();

    let terms = [];
    if (jenis === "terbuang" || jenis === "semua") {
      terms = terms.concat((global_.term_terbuang ?? []).map((t) => ({ ...t, jenis: "terbuang" })));
    }
    if (jenis === "lolos" || jenis === "semua") {
      terms = terms.concat((global_.term_lolos ?? []).map((t) => ({ ...t, jenis: "lolos" })));
    }

    if (search) terms = terms.filter((t) => t.term.includes(search));

    if (sort === "df_asc")   terms.sort((a, b) => a.df - b.df);
    if (sort === "df_desc")  terms.sort((a, b) => b.df - a.df);
    if (sort === "term_asc") terms.sort((a, b) => a.term.localeCompare(b.term));

    const total      = terms.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const items      = terms.slice((page - 1) * limit, page * limit);

    res.json({
      konfigurasi,
      stats: {
        total_sebelum_filter: global_.total_sebelum_filter ?? 0,
        total_terbuang:       global_.total_terbuang ?? 0,
        total_lolos:          global_.total_lolos ?? 0,
      },
      items,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/filtering/pengaduan/:kode — detail per pengaduan (on-demand)
app.get("/api/filtering/pengaduan/:kode", async (req, res) => {
  try {
    const data = await getFilteringData();
    if (!data) return res.status(404).json({ error: "filtering.json belum ada." });

    const kode  = req.params.kode;
    const entry = data[kode];
    if (!entry) return res.status(404).json({ error: `Kode ${kode} tidak ditemukan` });

    const main = cache.pengaduan.find((p) => p.kode_pengaduan === kode) ?? {};

    res.json({
      kode_pengaduan : kode,
      nama           : main.nama ?? "-",
      deskripsi      : main.deskripsi ?? "-",
      kategori       : main.kategori_prediksi ?? main.label_asli ?? "-",
      sebelum        : entry.sebelum ?? [],
      kena_filter    : entry.kena_filter ?? [],
      tersisa        : entry.tersisa ?? [],
      lolos_count    : entry.lolos_count ?? 0,
      terbuang_count : entry.terbuang_count ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
