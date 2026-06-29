import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import {
  Target, Info, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, TreeDeciduous,
  ChevronRight, Trophy, AlertTriangle, X,
} from "lucide-react";

const CATS = ["INFRASTRUKTUR", "KEAMANAN", "LINGKUNGAN", "PELAYANAN"];
const CAT_COLOR = {
  INFRASTRUKTUR: { bg: "#2E7D32", light: "#E8F5E9", text: "#1B5E20" },
  KEAMANAN:      { bg: "#1976D2", light: "#E3F2FD", text: "#0D47A1" },
  LINGKUNGAN:    { bg: "#388E3C", light: "#F1F8E9", text: "#1B5E20" },
  PELAYANAN:     { bg: "#F57C00", light: "#FFF3E0", text: "#E65100" },
};

function CatBadge({ val, size = "sm" }) {
  const c = CAT_COLOR[val] || { bg: "#757575", light: "#F5F5F5", text: "#424242" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${size === "sm" ? "text-xs" : "text-sm"}`}
      style={{ backgroundColor: c.light, color: c.text, border: `1px solid ${c.bg}40` }}>
      {val}
    </span>
  );
}

function FallbackNotice() {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 flex items-start gap-4">
      <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-800 mb-1">Data voting aktual belum tersedia</p>
        <p className="text-sm text-amber-700 mb-3">
          File <code className="bg-amber-100 px-1 rounded">data/stages/majority_voting.json</code> belum ada.
        </p>
        <code className="text-xs bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg block font-mono">
          python backend/main.py --train
        </code>
      </div>
    </div>
  );
}

// ── Tabel utama daftar pengaduan ──────────────────────────────────────────────
function PengaduanTable({ onOpenDetail, highlightKode }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBenar, setFilterBenar] = useState("semua");
  const [filterKat, setFilterKat]     = useState("SEMUA");
  const [page, setPage]     = useState(1);
  const LIMIT = 20;
  const rowRefs = useRef({});

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: LIMIT, search, benar: filterBenar, kategori: filterKat });
    fetch(`/api/voting?${p}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, search, filterBenar, filterKat]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, filterBenar, filterKat]);

  // Scroll + buka modal saat ?highlight= ada
  useEffect(() => {
    if (!highlightKode || loading || !data?.items?.length) return;
    const found = data.items.find((it) => it.kode_pengaduan === highlightKode);
    if (found) {
      setTimeout(() => {
        const el = rowRefs.current[highlightKode];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        onOpenDetail(highlightKode);
      }, 200);
    }
  }, [highlightKode, data, loading, onOpenDetail]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
      <div>
        <h2 className="font-bold text-gray-800">Daftar Pengaduan — Detail Vote per Pohon</h2>
        <p className="text-xs text-gray-400 mt-0.5">Klik <strong>Detail Vote</strong> untuk melihat proses voting 20 pohon secara transparan.</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <input type="text" placeholder="Cari kode, nama, deskripsi..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-green-300" />
        <select value={filterBenar} onChange={(e) => setFilterBenar(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
          <option value="semua">Semua</option>
          <option value="benar">✅ Benar</option>
          <option value="salah">❌ Salah</option>
        </select>
        <select value={filterKat} onChange={(e) => setFilterKat(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
          <option value="SEMUA">Semua Kategori</option>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin self-center" />}
        {data && <span className="text-xs text-gray-400 self-center">{data.total} pengaduan</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="p-3 text-left font-semibold">Kode</th>
              <th className="p-3 text-left font-semibold">Nama & Cuplikan</th>
              <th className="p-3 text-center font-semibold">Label Asli</th>
              <th className="p-3 text-center font-semibold">Prediksi Akhir</th>
              <th className="p-3 text-center font-semibold">Confidence</th>
              <th className="p-3 text-center font-semibold">Status</th>
              <th className="p-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!data?.items?.length ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">{loading ? "Memuat..." : "Tidak ada data yang cocok"}</td></tr>
            ) : data.items.map((d, i) => {
              const isHighlight = highlightKode === d.kode_pengaduan;
              return (
              <tr
                key={d.kode_pengaduan}
                ref={(el) => { if (el) rowRefs.current[d.kode_pengaduan] = el; }}
                className={`border-t transition-colors ${
                  isHighlight ? "bg-yellow-50 ring-2 ring-inset ring-yellow-400" :
                  i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-green-50"
                }`}>
                <td className="p-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                  {d.kode_pengaduan}
                  {isHighlight && <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold">↩ Dari Detail</span>}
                </td>
                <td className="p-3 max-w-xs">
                  <p className="text-xs font-semibold text-gray-700">{d.nama}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate" title={d.deskripsi}>{d.deskripsi?.substring(0, 60)}…</p>
                </td>
                <td className="p-3 text-center">{d.label_asli !== "-" ? <CatBadge val={d.label_asli} /> : <span className="text-gray-400 text-xs">—</span>}</td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <CatBadge val={d.majority_vote} />
                    {d.low_confidence && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded font-semibold">Low Conf</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div>
                    <span className={`font-bold text-sm ${d.confidence >= 0.8 ? "text-green-700" : d.confidence >= 0.6 ? "text-blue-700" : "text-orange-600"}`}>
                      {(d.confidence * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-400">{d.n_majority_votes}/{d.n_total_votes} pohon</p>
                  </div>
                </td>
                <td className="p-3 text-center">
                  {d.label_asli === "-"
                    ? <span className="text-gray-400 text-xs">—</span>
                    : d.benar
                    ? <span className="flex items-center justify-center gap-1 text-green-700 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Benar</span>
                    : <span className="flex items-center justify-center gap-1 text-red-600 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" />Salah</span>}
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => onOpenDetail(d.kode_pengaduan)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors flex items-center gap-1 mx-auto">
                    <TreeDeciduous className="w-3.5 h-3.5" />Detail Vote
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginasi */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Halaman {data.page} dari {data.totalPages} · {data.total} total</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹ Prev</button>
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal detail voting satu pengaduan ───────────────────────────────────────
function VoteDetailModal({ kode, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [filterMinority, setFilterMinority] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/voting/${kode}`)
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.error); }))
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [kode]);

  // Tutup saat klik backdrop
  const handleBackdrop = (e) => { if (e.target === modalRef.current) onClose(); };

  const voteEntries = Object.entries(data?.vote_per_pohon ?? {})
    .sort((a, b) => parseInt(a[0].replace("tree_", "")) - parseInt(b[0].replace("tree_", "")));

  const filteredVotes = filterMinority
    ? voteEntries.filter(([, v]) => v.vote !== data?.majority_vote)
    : voteEntries;

  const distSorted = Object.entries(data?.distribusi_vote ?? {}).sort((a, b) => b[1] - a[1]);
  const nTotal     = voteEntries.length;

  return (
    <div ref={modalRef} onClick={handleBackdrop}
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end overflow-y-auto">
      <div className="bg-white w-full max-w-3xl min-h-screen shadow-2xl flex flex-col">

        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-green-700 text-white shrink-0">
          <div>
            <p className="font-bold text-lg">Detail Voting — {kode}</p>
            {data && <p className="text-xs text-green-200 mt-0.5">{data.nama} · {data.deskripsi?.substring(0, 50)}…</p>}
          </div>
          <button onClick={onClose} className="hover:bg-green-600 rounded-lg p-2 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && <div className="flex items-center justify-center py-20 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mr-2" />Memuat...</div>}
          {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          {data && (
            <>
              {/* Bagian 1: Identitas */}
              <div className="bg-gray-50 rounded-xl border p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Identitas Pengaduan</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {[
                    ["Kode",        data.kode_pengaduan],
                    ["Nama",        data.nama],
                    ["Label Asli",  null],
                    ["Teks Processed", data.processed],
                  ].map(([k, v]) => (
                    <div key={k} className={k === "Teks Processed" ? "col-span-2" : ""}>
                      <span className="text-xs text-gray-400">{k}</span>
                      {k === "Label Asli"
                        ? <div className="mt-0.5">{data.label_asli !== "-" ? <CatBadge val={data.label_asli} size="md" /> : <span className="text-gray-400">—</span>}</div>
                        : <p className="font-semibold text-gray-700 text-xs mt-0.5 leading-relaxed">{v}</p>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">Deskripsi asli:</span>
                  <p className="text-xs text-gray-600 flex-1">{data.deskripsi}</p>
                </div>
              </div>

              {/* Bagian 2: Distribusi vote */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribusi Vote — {nTotal} Pohon</p>
                {distSorted.map(([cat, cnt], idx) => {
                  const pct    = nTotal ? ((cnt / nTotal) * 100).toFixed(1) : 0;
                  const c      = CAT_COLOR[cat] || { bg: "#757575", light: "#F5F5F5" };
                  const isWin  = idx === 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <CatBadge val={cat} />
                          {isWin && <Trophy className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{cnt} pohon ({pct}%)</span>
                      </div>
                      <div className="flex h-7 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <div className="flex items-center justify-center text-white text-xs font-bold transition-all"
                          style={{ width: `${pct}%`, backgroundColor: c.bg, minWidth: cnt > 0 ? "2rem" : 0 }}>
                          {pct}%
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="p-4 bg-green-50 border-2 border-green-400 rounded-xl flex items-center gap-4">
                  <div>
                    <p className="text-xs text-green-600 mb-0.5">Majority Vote → Prediksi Akhir</p>
                    <CatBadge val={data.majority_vote} size="md" />
                  </div>
                  <div className="ml-4">
                    <p className="text-xs text-gray-500">Confidence</p>
                    <p className="text-2xl font-bold text-green-700">{(data.confidence * 100).toFixed(2)}%</p>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs text-gray-500">Status</p>
                    {data.label_asli === "-"
                      ? <span className="text-gray-400 text-sm">—</span>
                      : data.benar
                      ? <span className="flex items-center gap-1 text-green-700 font-semibold text-sm"><CheckCircle2 className="w-4 h-4" />Benar</span>
                      : <span className="flex items-center gap-1 text-red-600 font-semibold text-sm"><XCircle className="w-4 h-4" />Salah</span>}
                  </div>
                  {data.low_confidence && (
                    <div className="ml-auto">
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />Low Confidence
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bagian 3: Tabel vote per pohon */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vote per Pohon ({nTotal} pohon)</p>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={filterMinority} onChange={(e) => setFilterMinority(e.target.checked)} className="rounded" />
                    Tampilkan hanya yang berbeda dari majority
                    {filterMinority && <span className="bg-orange-100 text-orange-700 px-1.5 rounded font-semibold">{filteredVotes.length}</span>}
                  </label>
                </div>
                {filteredVotes.length === 0 && filterMinority && (
                  <div className="text-center py-4 text-green-600 text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />Semua pohon setuju! Tidak ada minority vote.
                  </div>
                )}
                {filteredVotes.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-700">
                        <tr>
                          <th className="p-2.5 text-left font-semibold">Pohon</th>
                          <th className="p-2.5 text-center font-semibold">Vote</th>
                          <th className="p-2.5 text-center font-semibold">OOB?</th>
                          <th className="p-2.5 text-center font-semibold">Setuju dgn Majority?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVotes.map(([treeKey, v], i) => {
                          const tNum    = parseInt(treeKey.replace("tree_", ""));
                          const isAgree = v.vote === data.majority_vote;
                          return (
                            <tr key={treeKey} className={`border-t text-xs ${!isAgree ? "bg-orange-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                              <td className="p-2.5">
                                <div className="flex items-center gap-1.5">
                                  <TreeDeciduous className="w-3.5 h-3.5 text-green-600" />
                                  <span className="font-semibold text-gray-700">Tree #{tNum}</span>
                                </div>
                              </td>
                              <td className="p-2.5 text-center"><CatBadge val={v.vote} /></td>
                              <td className="p-2.5 text-center">
                                {v.is_oob
                                  ? <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-semibold">Ya (OOB)</span>
                                  : <span className="text-gray-400 text-xs">Tidak</span>}
                              </td>
                              <td className="p-2.5 text-center">
                                {isAgree
                                  ? <span className="flex items-center justify-center gap-1 text-green-700 text-xs font-semibold"><CheckCircle2 className="w-3 h-3" />Setuju</span>
                                  : <span className="flex items-center justify-center gap-1 text-orange-600 text-xs font-semibold"><XCircle className="w-3 h-3" />Beda</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bagian 4: Jejak pohon representatif */}
              {Object.keys(data.pohon_representatif ?? {}).length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jejak Pohon Representatif</p>
                  <p className="text-xs text-gray-400">Jalur keputusan dari root hingga leaf untuk beberapa pohon sampel.</p>
                  <div className="space-y-3">
                    {Object.entries(data.pohon_representatif).map(([treeKey, rep]) => {
                      const tNum   = parseInt(treeKey.replace("tree_", ""));
                      const isAlt  = rep.vote !== data.majority_vote;
                      const c      = CAT_COLOR[rep.vote] || { bg: "#757575", light: "#F5F5F5" };
                      return (
                        <div key={treeKey} className={`rounded-xl border p-4 ${isAlt ? "border-orange-300 bg-orange-50" : "border-green-200 bg-green-50"}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <TreeDeciduous className="w-4 h-4" style={{ color: c.bg }} />
                            <span className="font-bold text-sm text-gray-800">Tree #{tNum}</span>
                            <span className="ml-1">→ Vote: <CatBadge val={rep.vote} /></span>
                            {isAlt && <span className="bg-orange-200 text-orange-700 text-xs px-1.5 rounded font-semibold ml-1">⚠️ Minority</span>}
                            {rep.is_oob && <span className="bg-blue-100 text-blue-700 text-xs px-1.5 rounded font-semibold">OOB</span>}
                          </div>
                          <div className="space-y-1.5 overflow-x-auto max-w-full pb-2">
                            {(rep.jalur_node ?? []).map((node, ni) => (
                              <div key={ni} className="flex items-center gap-2 text-xs whitespace-nowrap shrink-0" style={{ paddingLeft: ni * 8 }}>
                                {ni > 0 && <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />}
                                {node.tipe === "leaf" ? (
                                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg font-semibold shrink-0"
                                    style={{ backgroundColor: c.light, color: c.bg, border: `1px solid ${c.bg}40` }}>
                                    🍃 Leaf → <strong>{node.prediksi}</strong>
                                    <span className="ml-1 text-gray-500 font-normal">Gini: {node.gini}</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-200 text-gray-700 shrink-0">
                                    <span className="font-mono font-semibold text-blue-700">{node.term}</span>
                                    <span className="text-gray-400">{">"} {node.threshold}</span>
                                    <span className="text-gray-500">→</span>
                                    <span className={`font-semibold ${node.arah === "kiri" ? "text-orange-600" : "text-green-600"}`}>{node.arah}</span>
                                    <span className="text-gray-400 ml-1">Gini: {node.gini}</span>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function RFVoting({ onLogout }) {
  const location = useLocation();
  const highlightKode = new URLSearchParams(location.search).get("highlight") ?? null;

  const [hasData, setHasData]       = useState(null);
  const [detailKode, setDetailKode] = useState(null);

  useEffect(() => {
    fetch("/api/voting?page=1&limit=1")
      .then((r) => { setHasData(r.ok); })
      .catch(() => setHasData(false));
  }, []);

  const handleOpenDetail  = useCallback((kode) => setDetailKode(kode), []);
  const handleCloseDetail = useCallback(() => setDetailKode(null), []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">

          {/* Judul */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Majority Voting &amp; Prediksi</h1>
              <p className="text-sm text-gray-500 mt-1">
                Transparansi penuh — lihat bagaimana 20 pohon voting untuk tiap pengaduan, beserta jalur keputusannya.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber: <code className="font-semibold mx-1">data/stages/majority_voting.json</code>
                → endpoint <code className="font-semibold">/api/voting</code>
              </div>
            </div>
          </div>

          {hasData === null && <div className="flex items-center gap-2 text-gray-400 py-12 justify-center"><RefreshCw className="w-5 h-5 animate-spin" />Memuat...</div>}
          {hasData === false && <FallbackNotice />}
          {hasData === true && <PengaduanTable onOpenDetail={handleOpenDetail} highlightKode={highlightKode} />}

          {/* Penjelasan konsep */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Konsep Majority Voting</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {[
                { step:"1", title:"500 Pohon → Masing-masing Beri 1 Vote",
                  desc:"Tiap pohon keputusan memprediksi 1 kelas. Tidak ada bobot — semua pohon setara. Detail voting ditampilkan dari sampel 20 pohon pertama.",
                  color:"#2E7D32" },
                { step:"2", title:"Kelas Terbanyak Menang",
                  desc:"Vote dari 500 pohon dihitung. Kelas dengan frekuensi tertinggi menjadi prediksi akhir. Confidence = proporsi vote majority.",
                  color:"#4CAF50" },
                { step:"3", title:"OOB vs In-Bag",
                  desc:"Pohon yang tidak melihat sampel ini saat training (OOB) memberikan vote yang lebih objektif — seperti test set internal per pohon.",
                  color:"#1976D2" },
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-xl border-l-4 bg-gray-50" style={{ borderColor: item.color }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: item.color }}>{item.step}</span>
                    <span className="font-semibold text-gray-700">{item.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* Modal detail vote (slide panel dari kanan) */}
      {detailKode && (
        <VoteDetailModal kode={detailKode} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
