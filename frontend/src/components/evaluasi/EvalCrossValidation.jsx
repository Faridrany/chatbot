import { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import {
  TrendingUp, Info, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";

const CATS = ["INFRASTRUKTUR", "KEAMANAN", "LINGKUNGAN", "PELAYANAN"];
const CAT_COLOR = {
  INFRASTRUKTUR: { bg: "#2E7D32", light: "#E8F5E9", text: "#1B5E20" },
  KEAMANAN:      { bg: "#1976D2", light: "#E3F2FD", text: "#0D47A1" },
  LINGKUNGAN:    { bg: "#388E3C", light: "#F1F8E9", text: "#1B5E20" },
  PELAYANAN:     { bg: "#F57C00", light: "#FFF3E0", text: "#E65100" },
};

function CatBadge({ val }) {
  const c = CAT_COLOR[val] || { bg: "#757575", light: "#F5F5F5", text: "#424242" };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: c.light, color: c.text, border: `1px solid ${c.bg}30` }}>
      {val}
    </span>
  );
}

function FallbackNotice() {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 flex items-start gap-4">
      <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-800 mb-1">Data cross-validation aktual belum tersedia</p>
        <p className="text-sm text-amber-700 mb-3">
          File <code className="bg-amber-100 px-1 rounded">data/stages/cross_validation.json</code> belum ada.
        </p>
        <code className="text-xs bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg block font-mono">
          python backend/main.py --train
        </code>
      </div>
    </div>
  );
}

// ── Bagian 1: Kartu ringkasan fold ───────────────────────────────────────────
function FoldSummary({ summary, selectedFold, onSelect }) {
  const folds = Object.entries(summary.folds ?? {})
    .map(([k, v]) => ({ fold_id: parseInt(k.replace("fold_", "")), ...v }))
    .sort((a, b) => a.fold_id - b.fold_id);

  const minAcc = Math.min(...folds.map((f) => f.akurasi));
  const maxAcc = Math.max(...folds.map((f) => f.akurasi));

  return (
    <div className="space-y-4">
      {/* Tabel fold */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="p-3 text-left font-semibold">Fold</th>
              <th className="p-3 text-center font-semibold">Data Training</th>
              <th className="p-3 text-center font-semibold">Data Testing</th>
              <th className="p-3 text-center font-semibold">Akurasi</th>
              <th className="p-3 text-center font-semibold w-24">Detail</th>
            </tr>
          </thead>
          <tbody>
            {folds.map((f, i) => {
              const isSelected = selectedFold === f.fold_id;
              const isMin      = f.akurasi === minAcc;
              const isMax      = f.akurasi === maxAcc;
              const accColor   = f.akurasi >= 0.9 ? "#2E7D32" : f.akurasi >= 0.85 ? "#F57C00" : "#D32F2F";
              return (
                <tr key={f.fold_id} className={`border-t transition-colors ${isSelected ? "bg-green-50 ring-2 ring-inset ring-green-400" : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-green-50"}`}>
                  <td className="p-3 font-semibold text-gray-800">Fold {f.fold_id}</td>
                  <td className="p-3 text-center text-gray-700 font-mono">{f.training_size}</td>
                  <td className="p-3 text-center text-gray-700 font-mono">{f.testing_size}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold" style={{ color: accColor }}>{(f.akurasi * 100).toFixed(2)}%</span>
                      {isMax && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded">🏆 Terbaik</span>}
                      {isMin && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 rounded">⬇ Terendah</span>}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => onSelect(isSelected ? null : f.fold_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isSelected ? "bg-green-700 text-white border-green-700" : "border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-700"}`}>
                      {isSelected ? <span className="flex items-center gap-1"><ChevronUp className="w-3 h-3" />Tutup</span>
                                  : <span className="flex items-center gap-1"><ChevronDown className="w-3 h-3" />Lihat</span>}
                    </button>
                  </td>
                </tr>
              );
            })}
            {/* Baris rata-rata */}
            <tr className="border-t bg-green-50 font-semibold">
              <td className="p-3 text-green-800">Rata-rata</td>
              <td className="p-3 text-center text-gray-600 font-mono">{folds[0]?.training_size ?? "-"}</td>
              <td className="p-3 text-center text-gray-600 font-mono">{folds[0]?.testing_size ?? "-"}</td>
              <td className="p-3 text-center">
                <span className="font-bold text-green-700">{(summary.rata_rata_akurasi * 100).toFixed(2)}%</span>
                <span className="text-xs text-gray-500 ml-1">±{(summary.std_akurasi * 100).toFixed(2)}%</span>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bar chart mini */}
      <div className="grid grid-cols-5 gap-2">
        {folds.map((f) => {
          const accPct = (f.akurasi * 100).toFixed(1);
          const isSelected = selectedFold === f.fold_id;
          return (
            <div key={f.fold_id} onClick={() => onSelect(isSelected ? null : f.fold_id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? "border-green-500 bg-green-50 shadow-md" : "bg-gray-50 hover:border-green-300"}`}>
              <p className="text-xs text-gray-500 mb-1">Fold {f.fold_id}</p>
              <p className="text-xl font-bold text-green-700">{accPct}%</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-green-600" style={{ width: `${f.akurasi * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bagian 2: Detail testing per fold (on-demand) ────────────────────────────
function FoldDetail({ foldId, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [search, setSearch] = useState("");
  const [filterBenar, setFilterBenar] = useState("semua");
  const [filterKat, setFilterKat]     = useState("SEMUA");
  const [page, setPage]     = useState(1);
  const PAGE = 25;

  const fetchPage = useCallback((p) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: PAGE, search, benar: filterBenar, kategori: filterKat });
    fetch(`/api/cv/${foldId}?${params}`)
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.error); }))
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [foldId, search, filterBenar, filterKat]);

  useEffect(() => { setPage(1); setSearch(""); setFilterBenar("semua"); setFilterKat("SEMUA"); }, [foldId]);
  useEffect(() => { fetchPage(page); }, [fetchPage, page]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-green-700 text-white">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5" />
          <span className="font-bold">Detail Testing — Fold {foldId}</span>
          {data && <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">{data.testing_size} data · {(data.akurasi * 100).toFixed(2)}% acc</span>}
        </div>
        <button onClick={onClose} className="hover:bg-green-600 rounded-lg p-1 transition-colors"><ChevronUp className="w-5 h-5" /></button>
      </div>

      {error && <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <input type="text" placeholder="Cari kode, nama, deskripsi..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={(e) => e.key === "Enter" && fetchPage(1)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-green-300" />
          <select value={filterBenar} onChange={(e) => { setFilterBenar(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
            <option value="semua">Semua</option>
            <option value="benar">✅ Benar</option>
            <option value="salah">❌ Salah</option>
          </select>
          <select value={filterKat} onChange={(e) => { setFilterKat(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
            <option value="SEMUA">Semua Kategori</option>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin self-center" />}
          {data && <span className="text-xs text-gray-400 self-center">{data.total} entri</span>}
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-green-50 text-green-900">
              <tr>
                <th className="p-3 text-left font-semibold">Kode</th>
                <th className="p-3 text-left font-semibold">Nama</th>
                <th className="p-3 text-left font-semibold">Cuplikan Deskripsi</th>
                <th className="p-3 text-center font-semibold">Label Asli</th>
                <th className="p-3 text-center font-semibold">Prediksi</th>
                <th className="p-3 text-center font-semibold">Hasil</th>
              </tr>
            </thead>
            <tbody>
              {!data?.items?.length ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">{loading ? "Memuat..." : "Tidak ada data"}</td></tr>
              ) : data.items.map((d, i) => (
                <tr key={`${d.kode_pengaduan}-${i}`} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50 transition-colors`}>
                  <td className="p-3 font-mono text-xs text-gray-600 whitespace-nowrap">{d.kode_pengaduan}</td>
                  <td className="p-3 text-xs text-gray-700 whitespace-nowrap">{d.nama}</td>
                  <td className="p-3 text-xs text-gray-600 max-w-xs"><span title={d.deskripsi}>{d.deskripsi?.substring(0, 70)}{d.deskripsi?.length > 70 ? "…" : ""}</span></td>
                  <td className="p-3 text-center"><CatBadge val={d.label_asli} /></td>
                  <td className="p-3 text-center"><CatBadge val={d.prediksi} /></td>
                  <td className="p-3 text-center">{d.benar
                    ? <span className="flex items-center justify-center gap-1 text-green-700 font-semibold text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Benar</span>
                    : <span className="flex items-center justify-center gap-1 text-red-600 font-semibold text-xs"><XCircle className="w-3.5 h-3.5" />Salah</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Halaman {data.page} dari {data.totalPages} · {data.total} total</span>
            <div className="flex gap-1">
              <button disabled={data.page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹ Prev</button>
              <button disabled={data.page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bagian 3: Data konsisten salah ───────────────────────────────────────────
function KonsistenSalahPanel() {
  const [items, setItems]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cv/konsisten-salah")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-6 text-gray-400"><RefreshCw className="w-4 h-4 animate-spin inline mr-2" />Memuat...</div>;
  if (!items?.length) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700 text-sm">
      <CheckCircle2 className="w-4 h-4" />
      Tidak ada pengaduan yang konsisten salah di ≥3 fold. Model sudah cukup konsisten.
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-red-50 text-red-900">
          <tr>
            <th className="p-3 text-left font-semibold">Kode</th>
            <th className="p-3 text-left font-semibold">Nama</th>
            <th className="p-3 text-left font-semibold">Cuplikan</th>
            <th className="p-3 text-center font-semibold">Label Asli</th>
            <th className="p-3 text-center font-semibold">Selalu Diprediksi</th>
            <th className="p-3 text-center font-semibold">Salah di Fold</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d, i) => (
            <tr key={d.kode_pengaduan} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-red-50/30"}`}>
              <td className="p-3 font-mono text-xs text-gray-600 whitespace-nowrap">{d.kode_pengaduan}</td>
              <td className="p-3 text-xs text-gray-700 whitespace-nowrap">{d.nama}</td>
              <td className="p-3 text-xs text-gray-600 max-w-xs">{d.deskripsi?.substring(0, 60)}{d.deskripsi?.length > 60 ? "…" : ""}</td>
              <td className="p-3 text-center"><CatBadge val={d.label_asli} /></td>
              <td className="p-3 text-center"><CatBadge val={d.prediksi_dominan} /></td>
              <td className="p-3 text-center text-xs text-gray-600">Fold {d.salah_di_fold.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function EvalCrossValidation({ onLogout }) {
  const [summary, setSummary]         = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [selectedFold, setSelectedFold] = useState(null);

  useEffect(() => {
    fetch("/api/cv")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setSummary(d); setLoadingPage(false); })
      .catch(() => setLoadingPage(false));
  }, []);

  const handleSelectFold = useCallback((foldId) => {
    setSelectedFold(foldId);
    if (foldId) setTimeout(() => document.getElementById("fold-detail-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">

          {/* Judul */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Cross-Validation 5-Fold</h1>
              <p className="text-sm text-gray-500 mt-1">
                Validasi robust — tiap fold menampilkan data testing aktual, lengkap dengan prediksi per pengaduan.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber: <code className="font-semibold mx-1">data/stages/cross_validation.json</code>
                → endpoint <code className="font-semibold">/api/cv</code>
              </div>
            </div>
          </div>

          {loadingPage && <div className="flex items-center gap-2 text-gray-400 py-12 justify-center"><RefreshCw className="w-5 h-5 animate-spin" />Memuat...</div>}
          {!loadingPage && !summary && <FallbackNotice />}

          {/* Kartu ringkasan */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "CV Mean",        value: `${(summary.rata_rata_akurasi * 100).toFixed(2)}%`, sub: "Rata-rata akurasi 5 fold",    color: "#2E7D32" },
                { label: "Std Dev",        value: `±${(summary.std_akurasi * 100).toFixed(2)}%`,      sub: "Variasi antar fold",           color: "#1976D2" },
                { label: "Jumlah Fold",    value: summary.n_folds ?? 5,                               sub: "StratifiedKFold",             color: "#F57C00" },
                { label: "Konsisten Salah",value: summary.jumlah_konsisten_salah ?? 0,                sub: "Salah di ≥3 fold",            color: "#D32F2F" },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl shadow p-5 border-l-4" style={{ borderColor: c.color }}>
                  <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bagian 1: Tabel + bar chart fold */}
          {summary && (
            <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
              <div>
                <h2 className="font-bold text-gray-800">Pembagian Data per Fold</h2>
                <p className="text-xs text-gray-400 mt-0.5">Klik <strong>Lihat</strong> atau klik kartu fold untuk membuka daftar 240 data testing-nya.</p>
              </div>
              <FoldSummary summary={summary} selectedFold={selectedFold} onSelect={handleSelectFold} />
            </div>
          )}

          {/* Bagian 2: Detail testing per fold */}
          {selectedFold && (
            <div id="fold-detail-panel">
              <FoldDetail foldId={selectedFold} onClose={() => setSelectedFold(null)} />
            </div>
          )}

          {/* Bagian 3: Konsisten salah */}
          {summary && (
            <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
              <div>
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Data yang Konsisten Salah di ≥3 Fold
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pengaduan yang selalu salah prediksi di banyak fold — kemungkinan ambigu atau mislabel.
                </p>
              </div>
              <KonsistenSalahPanel />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
