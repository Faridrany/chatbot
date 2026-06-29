import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import {
  Grid3x3, Info, RefreshCw, AlertCircle, Search,
  Download, Filter, Eye, EyeOff,
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
    <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
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
        <p className="font-semibold text-amber-800 mb-1">Data matriks TF-IDF belum tersedia</p>
        <p className="text-sm text-amber-700 mb-3">
          File <code className="bg-amber-100 px-1 rounded">data/tfidf_matrix.json</code> belum ada.
        </p>
        <code className="text-xs bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg block font-mono">
          python backend/main.py --train
        </code>
      </div>
    </div>
  );
}

// ── Bagian 1: Info dimensi matriks ───────────────────────────────────────────
function DimensiInfo({ meta }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="font-bold text-gray-800">Dimensi Matriks TF-IDF</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Pengaduan (baris)", value: meta.total_pengaduan?.toLocaleString(), sub: "setelah preprocessing", color: "#2E7D32" },
          { label: "Total Term Terpilih (kolom)", value: meta.total_term?.toLocaleString(), sub: "hasil SelectPercentile", color: "#1976D2" },
          { label: "Metode Seleksi", value: "SelectPercentile", sub: "chi-squared scoring", color: "#F57C00" },
          { label: "Ukuran Matriks", value: `${meta.total_pengaduan} × ${meta.total_term}`, sub: "baris × kolom", color: "#388E3C" },
        ].map((c) => (
          <div key={c.label} className="bg-gray-50 rounded-xl border-l-4 p-4" style={{ borderColor: c.color }}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-xl font-bold text-gray-800">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 space-y-1">
        <p><strong>Apa itu matriks ini?</strong> Setiap baris = satu pengaduan, setiap kolom = satu term terpilih. Nilai di tiap sel = bobot TF-IDF term tersebut untuk pengaduan tersebut.</p>
        <p>Sel bernilai <strong>0.0000</strong> berarti term tidak muncul di pengaduan itu. Matriks ini adalah input <em>eksak</em> yang diterima Random Forest saat training.</p>
      </div>
    </div>
  );
}

// ── Export Excel via xlsx.js ──────────────────────────────────────────────────
async function exportToExcel(meta) {
  // Dynamic import xlsx untuk menghindari bundle besar
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs").catch(() => null);
  if (!XLSX) { alert("Gagal load library Excel. Pastikan ada koneksi internet."); return; }

  const resp = await fetch("/api/matriks-tfidf/export");
  if (!resp.ok) { alert("Gagal mengambil data export."); return; }
  const exportData = await resp.json();

  const terms = meta.terms ?? [];
  const wb    = XLSX.utils.book_new();

  // Sheet 1: Matriks TF-IDF
  const header = ["kode_pengaduan", "deskripsi", "label_asli", "kategori_prediksi", ...terms];
  const sheetRows = [header];
  for (const row of exportData.rows) {
    const r = [row.kode_pengaduan, row.deskripsi, row.label_asli, row.kategori_prediksi];
    for (const t of terms) r.push(row.values[t] ?? 0);
    sheetRows.push(r);
  }
  const ws1 = XLSX.utils.aoa_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(wb, ws1, "Matriks TF-IDF");

  // Sheet 2: Info Seleksi (chi2)
  const chi2Rows = [["term", "chi2_score", "ngram"]];
  for (const t of (meta.terms_chi2 ?? [])) chi2Rows.push([t.term, t.chi2_score, t.ngram]);
  const ws2 = XLSX.utils.aoa_to_sheet(chi2Rows);
  XLSX.utils.book_append_sheet(wb, ws2, "Info Seleksi Chi2");

  XLSX.writeFile(wb, "tfidf_matrix.xlsx");
}

// ── Bagian 2 & 3: Tabel matriks interaktif ───────────────────────────────────
function MatriksTable({ meta }) {
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [kategori, setKategori] = useState("SEMUA");
  const [hideZero, setHideZero] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null); // kode yang di-highlight
  const [exporting, setExporting] = useState(false);
  const LIMIT = 50;

  // Ambil top-N term untuk tampil di kolom (matriks sangat lebar, tampilkan 30 term pertama by chi2)
  const [visibleTerms, setVisibleTerms] = useState([]);
  const [showAllTerms, setShowAllTerms] = useState(false);
  const MAX_COLS = 30;

  useEffect(() => {
    if (meta?.terms) {
      setVisibleTerms(showAllTerms ? meta.terms.slice(0, 100) : meta.terms.slice(0, MAX_COLS));
    }
  }, [meta, showAllTerms]);

  const fetchRows = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: LIMIT, search, kategori });
    fetch(`/api/matriks-tfidf/rows?${p}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) { setRows(d.items); setTotal(d.total); setTotalPages(d.totalPages); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search, kategori]);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(1); }, [search, kategori]);

  const handleExport = async () => {
    setExporting(true);
    try { await exportToExcel(meta); }
    finally { setExporting(false); }
  };

  // Tentukan term yang ditampilkan (bisa filter hanya yang punya nilai > 0 di row yang dipilih)
  const activeTerms = hideZero && selectedRow
    ? visibleTerms.filter((t) => {
        const rowData = rows.find((r) => r.kode_pengaduan === selectedRow);
        return rowData && (rowData.values[t] ?? 0) > 0;
      })
    : visibleTerms;

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-gray-800">Tabel Matriks TF-IDF</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {total.toLocaleString()} pengaduan · {meta?.total_term?.toLocaleString()} term · menampilkan {activeTerms.length} kolom pertama
          </p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 transition-colors disabled:opacity-60">
          {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Mengekspor..." : "Export ke Excel (.xlsx)"}
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Cari kode atau deskripsi..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <select value={kategori} onChange={(e) => setKategori(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
          <option value="SEMUA">Semua Kategori</option>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className={`flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-sm cursor-pointer transition-colors ${hideZero ? "bg-blue-50 border-blue-400 text-blue-700" : "border-gray-200 hover:bg-gray-50"}`}>
          <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} className="rounded" />
          {hideZero ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          Sembunyikan kolom nol {selectedRow ? `(untuk ${selectedRow})` : "(pilih baris dulu)"}
        </label>
        <button onClick={() => setShowAllTerms(v => !v)}
          className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          {showAllTerms ? `Tampilkan ${MAX_COLS} term` : `Tampilkan 100 term`}
        </button>
        {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin self-center" />}
      </div>

      {/* Tabel dengan scroll horizontal + frozen column */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: "70vh" }}>
          <table className="text-xs border-collapse" style={{ minWidth: `${200 + activeTerms.length * 90}px` }}>
            <thead className="bg-green-100 text-green-900 sticky top-0 z-20">
              <tr>
                {/* Frozen columns */}
                <th className="p-2.5 text-left font-semibold sticky left-0 z-30 bg-green-100 border-r border-green-200 whitespace-nowrap min-w-[110px]">
                  Kode
                </th>
                <th className="p-2.5 text-left font-semibold sticky left-[110px] z-30 bg-green-100 border-r border-green-200 whitespace-nowrap min-w-[180px]">
                  Deskripsi
                </th>
                <th className="p-2.5 text-center font-semibold bg-green-100 border-r border-green-200 whitespace-nowrap min-w-[130px]">
                  Kategori
                </th>
                {/* Term columns */}
                {activeTerms.map((term) => (
                  <th key={term} className="p-2 text-center font-mono font-semibold bg-green-100 whitespace-nowrap min-w-[80px]"
                    title={term}>
                    {term.length > 10 ? term.substring(0, 9) + "…" : term}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!rows.length ? (
                <tr>
                  <td colSpan={3 + activeTerms.length} className="p-8 text-center text-gray-400">
                    {loading ? "Memuat..." : "Tidak ada data"}
                  </td>
                </tr>
              ) : rows.map((row, i) => {
                const isSelected = selectedRow === row.kode_pengaduan;
                const bg = isSelected ? "bg-blue-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50";
                return (
                  <tr key={row.kode_pengaduan}
                    onClick={() => setSelectedRow(isSelected ? null : row.kode_pengaduan)}
                    className={`${bg} hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100`}>
                    {/* Frozen kode */}
                    <td className={`p-2 sticky left-0 z-10 font-mono text-gray-600 border-r border-gray-200 whitespace-nowrap ${bg}`}>
                      {row.kode_pengaduan}
                    </td>
                    {/* Frozen deskripsi */}
                    <td className={`p-2 sticky left-[110px] z-10 text-gray-700 border-r border-gray-200 ${bg}`}>
                      <span title={row.deskripsi} className="block max-w-[176px] truncate">
                        {row.deskripsi?.substring(0, 45)}{row.deskripsi?.length > 45 ? "…" : ""}
                      </span>
                    </td>
                    {/* Kategori */}
                    <td className="p-2 text-center border-r border-gray-100">
                      {row.kategori_prediksi !== "-" ? <CatBadge val={row.kategori_prediksi} /> : <span className="text-gray-400">—</span>}
                    </td>
                    {/* TF-IDF values */}
                    {activeTerms.map((term) => {
                      const val = row.values[term] ?? 0;
                      const isZero = val === 0;
                      return (
                        <td key={term} className={`p-2 text-center font-mono tabular-nums ${isZero ? "text-gray-200" : "text-green-800 font-semibold"}`}
                          title={`${term}: ${val}`}>
                          {isZero ? "0" : val.toFixed(4)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="font-mono text-green-800 font-semibold">0.4521</span> = term muncul di pengaduan ini</span>
        <span className="flex items-center gap-1"><span className="font-mono text-gray-200">0</span> = term tidak muncul</span>
        <span>Klik baris untuk highlight & filter kolom nol</span>
      </div>

      {/* Paginasi */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <span>Halaman {page} dari {totalPages} · {total.toLocaleString()} total pengaduan · 50 baris/halaman</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹ Prev</button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2 py-1 rounded border ${p === page ? "bg-green-700 text-white border-green-700" : "hover:bg-gray-100"}`}>
                  {p}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function EkstraksiMatriksTFIDF({ onLogout }) {
  const [meta, setMeta]           = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    fetch("/api/matriks-tfidf/meta")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setMeta(d); setLoadingPage(false); })
      .catch(() => setLoadingPage(false));
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
              <Grid3x3 className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Output Matriks TF-IDF</h1>
              <p className="text-sm text-gray-500 mt-1">
                Matriks (n_pengaduan × k_term) yang menjadi input langsung Random Forest — identik dengan X yang digunakan saat training.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber: <code className="font-semibold mx-1">data/tfidf_matrix.json</code>
                → endpoint <code className="font-semibold">/api/matriks-tfidf</code>
              </div>
            </div>
          </div>

          {loadingPage && (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" />Memuat meta data...
            </div>
          )}

          {!loadingPage && !meta && <FallbackNotice />}

          {meta && <DimensiInfo meta={meta} />}

          {meta && <MatriksTable meta={meta} />}

          {/* Penjelasan teknis */}
          {meta && (
            <div className="bg-white rounded-2xl shadow p-6 text-sm space-y-3">
              <h2 className="font-bold text-gray-800">Catatan Teknis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                {[
                  { title: "Sumber kebenaran tunggal", desc: "Nilai dalam tabel ini identik dengan nilai X yang masuk ke proses training Random Forest. Tidak ada transformasi tambahan setelah SelectPercentile." },
                  { title: "Konsistensi dengan Seleksi Fitur", desc: `${meta.total_term} term yang ditampilkan di sini adalah term yang sama dengan yang tampil di halaman "Seleksi Fitur & Metode" dengan status 'Terpilih'.` },
                  { title: "Sparse Matrix", desc: "Sebagian besar sel bernilai 0 karena setiap pengaduan hanya menggunakan sebagian kecil dari total term. Ini disebut sparse matrix dan efisien untuk komputasi." },
                  { title: "Export Excel", desc: "File Excel berisi dua sheet: (1) Matriks lengkap dengan semua kolom term, (2) Daftar term dengan skor chi-squared masing-masing diurutkan dari tertinggi." },
                ].map((item) => (
                  <div key={item.title} className="p-3 bg-gray-50 rounded-xl border">
                    <p className="font-semibold text-gray-700 mb-1">{item.title}</p>
                    <p className="leading-relaxed text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
