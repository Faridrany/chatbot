import { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import {
  SlidersHorizontal, Info, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  RefreshCw, AlertCircle, Search, ArrowUpDown,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
function pct(part, total) {
  if (!total) return "0.0";
  return ((part / total) * 100).toFixed(1);
}

function AlasanBadge({ alasan }) {
  if (!alasan) return null;
  const isLow = alasan.includes("< Min");
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
      isLow ? "bg-orange-100 text-orange-700 border border-orange-300"
             : "bg-blue-100 text-blue-700 border border-blue-300"
    }`}>
      {alasan}
    </span>
  );
}

function TermBadge({ term, highlight }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono mr-1 mb-1 ${
      highlight === "kena"
        ? "bg-red-100 text-red-700 line-through"
        : highlight === "ok"
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-600"
    }`}>
      {term}
    </span>
  );
}

// ── Bagian 1: Header konfigurasi filter ──────────────────────────────────────
function KonfigFilter({ konfigurasi, stats }) {
  const { min_df = 2, max_df_ratio = 0.95, max_df_abs = 0, total_dok = 0 } = konfigurasi;
  const { total_sebelum_filter = 0, total_terbuang = 0, total_lolos = 0 } = stats;

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      <h2 className="font-bold text-gray-800">Konfigurasi Filter yang Dipakai</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border-l-4 border-orange-500 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-orange-800">Min DF = {min_df}</span>
          </div>
          <p className="text-sm text-orange-700">
            Term yang muncul di <strong>kurang dari {min_df} dokumen</strong> akan dibuang.
            Terlalu jarang → tidak representatif, kemungkinan typo atau nama khusus.
          </p>
        </div>
        <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-800">Max DF = {(max_df_ratio * 100).toFixed(0)}% ({max_df_abs} dok)</span>
          </div>
          <p className="text-sm text-blue-700">
            Term yang muncul di <strong>lebih dari {max_df_abs} dari {total_dok} dokumen</strong> akan dibuang.
            Terlalu umum → tidak punya daya diskriminasi antar kategori.
          </p>
        </div>
      </div>

      {/* Progress bar statistik */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Total vocabulary sebelum filter: <strong>{total_sebelum_filter.toLocaleString()} term</strong></span>
          <span>
            <span className="text-red-600 font-semibold">{total_terbuang.toLocaleString()} dibuang ({pct(total_terbuang, total_sebelum_filter)}%)</span>
            {" · "}
            <span className="text-green-600 font-semibold">{total_lolos.toLocaleString()} lolos ({pct(total_lolos, total_sebelum_filter)}%)</span>
          </span>
        </div>
        <div className="flex h-5 rounded-xl overflow-hidden border border-gray-200">
          <div
            className="bg-red-400 flex items-center justify-center text-white text-xs font-semibold transition-all"
            style={{ width: `${pct(total_terbuang, total_sebelum_filter)}%` }}
          >
            {pct(total_terbuang, total_sebelum_filter)}%
          </div>
          <div
            className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold transition-all"
            style={{ width: `${pct(total_lolos, total_sebelum_filter)}%` }}
          >
            {pct(total_lolos, total_sebelum_filter)}%
          </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-400 mt-1.5">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" />Dibuang (kena filter)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Lolos filter</span>
        </div>
      </div>
    </div>
  );
}

// ── Bagian 2 & 3: Tabel term (terbuang & lolos) ──────────────────────────────
function TermTable({ stats }) {
  const [tab, setTab]       = useState("terbuang");
  const [search, setSearch] = useState("");
  const [sort, setSort]     = useState("df_asc");
  const [page, setPage]     = useState(1);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const LIMIT = 50;

  const fetchData = useCallback(() => {
    setLoading(true);
    const jenis = tab === "terbuang" ? "terbuang" : "lolos";
    const url = `/api/filtering/summary?page=${page}&limit=${LIMIT}&jenis=${jenis}&search=${encodeURIComponent(search)}&sort=${sort}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab, search, sort, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [tab, search, sort]);

  const totalTab = tab === "terbuang" ? stats.total_terbuang : stats.total_lolos;

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      {/* Tab header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("terbuang")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              tab === "terbuang"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              Term Dibuang
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "terbuang" ? "bg-red-500" : "bg-red-100 text-red-700"}`}>
                {stats.total_terbuang.toLocaleString()}
              </span>
            </span>
          </button>
          <button
            onClick={() => setTab("lolos")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              tab === "lolos"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Term Lolos
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "lolos" ? "bg-green-500" : "bg-green-100 text-green-700"}`}>
                {stats.total_lolos.toLocaleString()}
              </span>
            </span>
          </button>
        </div>
        <p className="text-xs text-gray-400">
          {tab === "terbuang"
            ? `${stats.total_terbuang.toLocaleString()} term dibuang (${pct(stats.total_terbuang, stats.total_sebelum_filter)}%)`
            : `${stats.total_lolos.toLocaleString()} term lolos (${pct(stats.total_lolos, stats.total_sebelum_filter)}%)`}
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari term..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        >
          <option value="df_asc">DF: Rendah → Tinggi</option>
          <option value="df_desc">DF: Tinggi → Rendah</option>
          <option value="term_asc">A–Z</option>
        </select>
        <button onClick={fetchData} className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className={tab === "terbuang" ? "bg-red-50 text-red-900" : "bg-green-50 text-green-900"}>
            <tr>
              <th className="p-3 text-left font-semibold">Term</th>
              <th className="p-3 text-center font-semibold cursor-pointer select-none" onClick={() => setSort(sort === "df_asc" ? "df_desc" : "df_asc")}>
                <span className="flex items-center justify-center gap-1">DF <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              {tab === "terbuang" && <th className="p-3 text-center font-semibold">Alasan Dibuang</th>}
              {tab === "lolos"    && <th className="p-3 text-center font-semibold">Status</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="p-8 text-center text-gray-400"><RefreshCw className="w-4 h-4 animate-spin inline mr-2" />Memuat...</td></tr>
            ) : !data?.items?.length ? (
              <tr><td colSpan={3} className="p-8 text-center text-gray-400">Tidak ada term yang cocok</td></tr>
            ) : data.items.map((t, i) => (
              <tr key={`${t.term}-${i}`} className={`border-t ${i % 2 === 0 ? "bg-white" : tab === "terbuang" ? "bg-red-50/30" : "bg-green-50/30"} hover:bg-gray-50`}>
                <td className="p-3 font-mono text-xs text-gray-800">{t.term}</td>
                <td className="p-3 text-center">
                  <span className={`font-mono text-sm font-semibold ${
                    t.alasan?.includes("< Min") ? "text-orange-600" :
                    t.alasan?.includes("> Max") ? "text-blue-600" : "text-green-700"
                  }`}>{t.df}</span>
                </td>
                {tab === "terbuang" && (
                  <td className="p-3 text-center"><AlasanBadge alasan={t.alasan} /></td>
                )}
                {tab === "lolos" && (
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Lolos</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginasi */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Halaman {data.page} dari {data.totalPages} · {data.total.toLocaleString()} term{search ? ` (filter: "${search}")` : ""}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹ Prev</button>
            {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
              const p = Math.max(1, Math.min(data.totalPages - 4, page - 2)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2 py-1 rounded border ${p === page ? "bg-green-600 text-white border-green-600" : "hover:bg-gray-100"}`}>
                  {p}
                </button>
              );
            })}
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tambahan: Detail per pengaduan (on-demand) ───────────────────────────────
function PengaduanDetail({ kode, onClose }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/filtering/pengaduan/${kode}`)
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.error); }))
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [kode]);

  const kenaSet = new Set((data?.kena_filter ?? []).map((k) => k.term));

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-green-700 text-white">
        <div>
          <span className="font-bold">{kode}</span>
          {data && <span className="ml-3 text-sm text-green-200">{data.nama} — {data.deskripsi?.substring(0, 60)}…</span>}
        </div>
        <button onClick={onClose} className="hover:bg-green-600 rounded-lg p-1 transition-colors">
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>

      {loading && <div className="flex items-center justify-center py-10 text-gray-400"><RefreshCw className="w-4 h-4 animate-spin mr-2" />Memuat...</div>}
      {error   && <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}

      {data && (
        <div className="p-6 space-y-5">
          {/* Stats bar */}
          <div className="flex gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl border px-4 py-2">
              <p className="text-xs text-gray-400">Sebelum filter</p>
              <p className="font-bold text-gray-800">{data.sebelum.length} term</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 px-4 py-2">
              <p className="text-xs text-red-500">Kena filter</p>
              <p className="font-bold text-red-700">{data.terbuang_count} term</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 px-4 py-2">
              <p className="text-xs text-green-600">Tersisa</p>
              <p className="font-bold text-green-700">{data.lolos_count} term</p>
            </div>
          </div>

          {/* Sebelum filter — semua term dengan highlight */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Semua Term Sebelum Filter</p>
            <div className="flex flex-wrap p-3 bg-gray-50 rounded-xl border">
              {data.sebelum.length === 0
                ? <span className="text-xs text-gray-400">Tidak ada term</span>
                : data.sebelum.map((t, i) => (
                  <TermBadge key={i} term={t} highlight={kenaSet.has(t) ? "kena" : "ok"} />
                ))
              }
            </div>
            <p className="text-xs text-gray-400 mt-1.5 flex gap-4">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300" /> Dibuang (dicoret)</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300" /> Lolos</span>
            </p>
          </div>

          {/* Term yang kena filter */}
          {data.kena_filter.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wide">Term yang Kena Filter ({data.kena_filter.length})</p>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-xs">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="p-2 text-left font-semibold text-red-800">Term</th>
                      <th className="p-2 text-center font-semibold text-red-800">DF</th>
                      <th className="p-2 text-center font-semibold text-red-800">Alasan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.kena_filter.map((k, i) => (
                      <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-red-50/30"}`}>
                        <td className="p-2 font-mono text-red-700 line-through">{k.term}</td>
                        <td className="p-2 text-center font-mono text-gray-600">{k.df}</td>
                        <td className="p-2 text-center"><AlasanBadge alasan={k.alasan} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Term tersisa */}
          <div>
            <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Term Tersisa setelah Filter ({data.tersisa.length})</p>
            <div className="flex flex-wrap p-3 bg-green-50 rounded-xl border border-green-200">
              {data.tersisa.length === 0
                ? <span className="text-xs text-gray-400">Semua term kena filter</span>
                : data.tersisa.map((t, i) => <TermBadge key={i} term={t} highlight="ok" />)
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Picker pengaduan untuk buka detail per-doc ────────────────────────────────
function PengaduanPicker({ selectedKode, onSelect }) {
  const [search, setSearch] = useState("");
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pengaduan?page=1&limit=100")
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = items.filter((it) =>
    !search || it.kode_pengaduan?.toLowerCase().includes(search.toLowerCase()) ||
    it.nama?.toLowerCase().includes(search.toLowerCase()) ||
    it.deskripsi?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-3">
      <div>
        <h2 className="font-bold text-gray-800">Detail per Pengaduan</h2>
        <p className="text-xs text-gray-400 mt-0.5">Pilih pengaduan untuk melihat term mana yang kena filter dan mana yang tersisa.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari kode, nama, deskripsi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      </div>
      {loading ? (
        <div className="text-center text-gray-400 text-sm py-4"><RefreshCw className="w-4 h-4 animate-spin inline mr-1" />Memuat...</div>
      ) : (
        <div className="max-h-56 overflow-y-auto rounded-xl border divide-y">
          {filtered.slice(0, 50).map((it) => (
            <button
              key={it.kode_pengaduan}
              onClick={() => onSelect(selectedKode === it.kode_pengaduan ? null : it.kode_pengaduan)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-green-50 transition-colors text-sm ${
                selectedKode === it.kode_pengaduan ? "bg-green-100 font-semibold" : ""
              }`}
            >
              <span className="font-mono text-xs text-gray-500 w-24 flex-shrink-0">{it.kode_pengaduan}</span>
              <span className="text-gray-700 truncate flex-1">{it.nama} — {it.deskripsi?.substring(0, 60)}</span>
              {selectedKode === it.kode_pengaduan
                ? <ChevronUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>
          ))}
          {filtered.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">Tidak ada pengaduan ditemukan</p>}
        </div>
      )}
    </div>
  );
}

// ── Komponen utama ─────────────────────────────────────────────────────────
export default function EkstraksiFiltering({ onLogout }) {
  const [summary, setSummary]       = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError]           = useState(null);
  const [selectedKode, setSelectedKode] = useState(null);

  useEffect(() => {
    fetch("/api/filtering/summary?page=1&limit=1&jenis=semua")
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.error); }))
      .then((d) => { setSummary(d); setLoadingPage(false); })
      .catch((e) => { setError(e.message); setLoadingPage(false); });
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
              <SlidersHorizontal className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Filtering — Min DF &amp; Max DF</h1>
              <p className="text-sm text-gray-500 mt-1">
                Transparansi penuh — term mana yang kena filter dan kenapa, lengkap dengan nilai DF masing-masing.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber: <code className="font-semibold mx-1">data/stages/filtering.json</code>
                → endpoint <code className="font-semibold">/api/filtering/summary</code>
              </div>
            </div>
          </div>

          {loadingPage && (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" /> Memuat data filtering...
            </div>
          )}

          {error && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Data filtering belum tersedia</p>
                <p className="text-sm text-amber-700 mb-3">{error}</p>
                <code className="text-xs bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg block font-mono">
                  python backend/main.py --train
                </code>
              </div>
            </div>
          )}

          {/* Bagian 1: Konfigurasi */}
          {summary && (
            <KonfigFilter konfigurasi={summary.konfigurasi} stats={summary.stats} />
          )}

          {/* Bagian 2 & 3: Tabel term */}
          {summary && (
            <TermTable stats={summary.stats} />
          )}

          {/* Detail per pengaduan */}
          {summary && (
            <>
              <PengaduanPicker
                selectedKode={selectedKode}
                onSelect={setSelectedKode}
              />
              {selectedKode && (
                <PengaduanDetail
                  kode={selectedKode}
                  onClose={() => setSelectedKode(null)}
                />
              )}
            </>
          )}

          {/* Penjelasan pentingnya filtering */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Mengapa Filtering Penting?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {[
                {
                  icon: <XCircle className="w-5 h-5 text-red-500" />,
                  title: "Tanpa Min DF",
                  desc: "Ribuan kata typo, nama khusus, atau sekali muncul menjadi fitur. Model overfit dan matriks TF-IDF membengkak.",
                },
                {
                  icon: <XCircle className="w-5 h-5 text-blue-500" />,
                  title: "Tanpa Max DF",
                  desc: "Kata sangat umum yang lolos stopword mendominasi vektor tanpa memberi daya diskriminasi antar kategori.",
                },
                {
                  icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
                  title: "Dengan Keduanya",
                  desc: `Vocabulary bersih. Hanya term yang benar-benar bermakna dan representatif yang lanjut ke TF-IDF dan Seleksi Fitur.`,
                },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-50 border">
                  <div className="flex items-center gap-2 mb-2">{item.icon}<span className="font-semibold text-gray-700">{item.title}</span></div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
