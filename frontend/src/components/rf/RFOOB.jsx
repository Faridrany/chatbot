import { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import {
  ShieldCheck, Info, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, TreeDeciduous,
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
        <p className="font-semibold text-amber-800 mb-1">Data OOB aktual belum tersedia</p>
        <p className="text-sm text-amber-700 mb-3">
          File <code className="bg-amber-100 px-1 rounded">data/stages/oob.json</code> belum ada.
        </p>
        <code className="text-xs bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg block font-mono">
          python backend/main.py --train
        </code>
      </div>
    </div>
  );
}

// ── Bagian 1: Tabel ringkasan per pohon ──────────────────────────────────────
function SummaryTable({ perPohon, selected, onSelect }) {
  const rows = Object.entries(perPohon)
    .map(([k, v]) => ({ tree_id: parseInt(k.replace("tree_", "")), ...v }))
    .sort((a, b) => a.tree_id - b.tree_id);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-green-100 text-green-900">
          <tr>
            <th className="p-3 text-left font-semibold">Pohon</th>
            <th className="p-3 text-center font-semibold">Jumlah OOB</th>
            <th className="p-3 text-center font-semibold">Benar</th>
            <th className="p-3 text-center font-semibold">Salah</th>
            <th className="p-3 text-center font-semibold">OOB Accuracy</th>
            <th className="p-3 text-center font-semibold w-24">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isSelected = selected === row.tree_id;
            const accColor = row.oob_accuracy >= 0.9 ? "#2E7D32" : row.oob_accuracy >= 0.8 ? "#F57C00" : "#D32F2F";
            return (
              <tr key={row.tree_id} className={`border-t transition-colors ${isSelected ? "bg-green-50 ring-2 ring-inset ring-green-400" : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-green-50"}`}>
                <td className="p-3 font-semibold text-gray-800">
                  <div className="flex items-center gap-2"><TreeDeciduous className="w-4 h-4 text-green-600" />Tree #{row.tree_id}</div>
                </td>
                <td className="p-3 text-center font-mono text-gray-700">{row.oob_count}</td>
                <td className="p-3 text-center">
                  <span className="flex items-center justify-center gap-1 text-green-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />{row.benar}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className="flex items-center justify-center gap-1 text-red-600 font-semibold">
                    <XCircle className="w-3.5 h-3.5" />{row.salah}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className="font-bold" style={{ color: accColor }}>
                    {(row.oob_accuracy * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onSelect(isSelected ? null : row.tree_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isSelected ? "bg-green-700 text-white border-green-700" : "border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-700"}`}
                  >
                    {isSelected ? <span className="flex items-center gap-1"><ChevronUp className="w-3 h-3" />Tutup</span>
                                : <span className="flex items-center gap-1"><ChevronDown className="w-3 h-3" />Lihat</span>}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Bagian 2: Detail data OOB per pohon (on-demand) ──────────────────────────
function TreeOobDetail({ treeId, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [search, setSearch] = useState("");
  const [filterBenar, setFilterBenar] = useState("semua");
  const [filterKat, setFilterKat]     = useState("SEMUA");
  const [page, setPage]     = useState(1);
  const PAGE = 25;

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/oob/${treeId}`)
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.error); }))
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
    setSearch(""); setFilterBenar("semua"); setFilterKat("SEMUA"); setPage(1);
  }, [treeId]);

  const filtered = (data?.oob_data ?? []).filter((d) => {
    const ms = !search || d.kode_pengaduan.toLowerCase().includes(search.toLowerCase()) || d.nama.toLowerCase().includes(search.toLowerCase()) || d.deskripsi.toLowerCase().includes(search.toLowerCase());
    const mb = filterBenar === "semua" || (filterBenar === "benar" && d.benar) || (filterBenar === "salah" && !d.benar);
    const mk = filterKat === "SEMUA" || d.label_asli === filterKat;
    return ms && mb && mk;
  });
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-green-700 text-white">
        <div className="flex items-center gap-3">
          <TreeDeciduous className="w-5 h-5" />
          <span className="font-bold">OOB Detail — Tree #{treeId}</span>
          {data && <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">{data.oob_count} data · {(data.oob_accuracy * 100).toFixed(1)}% acc</span>}
        </div>
        <button onClick={onClose} className="hover:bg-green-600 rounded-lg p-1 transition-colors"><ChevronUp className="w-5 h-5" /></button>
      </div>

      {loading && <div className="flex items-center justify-center py-12 text-gray-400"><RefreshCw className="w-4 h-4 animate-spin mr-2" />Memuat...</div>}
      {error   && <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}

      {data && (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder="Cari kode, nama, deskripsi..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
            <span className="text-xs text-gray-400 self-center">{total} entri</span>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-green-50 text-green-900">
                <tr>
                  <th className="p-3 text-left font-semibold">Kode</th>
                  <th className="p-3 text-left font-semibold">Nama</th>
                  <th className="p-3 text-left font-semibold">Cuplikan Deskripsi</th>
                  <th className="p-3 text-center font-semibold">Label Asli</th>
                  <th className="p-3 text-center font-semibold">Prediksi OOB</th>
                  <th className="p-3 text-center font-semibold">Hasil</th>
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">Tidak ada data yang cocok</td></tr>
                ) : slice.map((d, i) => (
                  <tr key={`${d.kode_pengaduan}-${i}`} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50 transition-colors`}>
                    <td className="p-3 font-mono text-xs text-gray-600 whitespace-nowrap">{d.kode_pengaduan}</td>
                    <td className="p-3 text-xs text-gray-700 whitespace-nowrap">{d.nama}</td>
                    <td className="p-3 text-xs text-gray-600 max-w-xs"><span title={d.deskripsi}>{d.deskripsi?.substring(0, 70)}{d.deskripsi?.length > 70 ? "…" : ""}</span></td>
                    <td className="p-3 text-center"><CatBadge val={d.label_asli} /></td>
                    <td className="p-3 text-center"><CatBadge val={d.prediksi_oob} /></td>
                    <td className="p-3 text-center">{d.benar
                      ? <span className="flex items-center justify-center gap-1 text-green-700 font-semibold text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Benar</span>
                      : <span className="flex items-center justify-center gap-1 text-red-600 font-semibold text-xs"><XCircle className="w-3.5 h-3.5" />Salah</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Halaman {page} dari {pages} · {total} total</span>
              <div className="flex gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹ Prev</button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next ›</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bagian 3: Akumulasi OOB lintas pohon ─────────────────────────────────────
function AkumulasiPanel() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterK, setFilterK] = useState("semua");
  const [page, setPage]     = useState(1);
  const PAGE = 30;

  useEffect(() => {
    fetch(`/api/oob/akumulasi?page=1&limit=200`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = (data?.items ?? []).filter((d) => {
    const ms = !search || d.kode_pengaduan.toLowerCase().includes(search.toLowerCase()) || d.nama.toLowerCase().includes(search.toLowerCase());
    const mk = filterK === "semua" || (filterK === "konsisten" && d.konsisten) || (filterK === "tidak" && !d.konsisten);
    return ms && mk;
  });
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
      <div>
        <h2 className="font-bold text-gray-800">Akumulasi OOB — Rekap per Pengaduan</h2>
        <p className="text-xs text-gray-400 mt-0.5">Tiap pengaduan bisa jadi OOB di beberapa pohon. Di bawah ini rekap prediksi OOB lintas pohon.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input type="text" placeholder="Cari kode atau nama..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-green-300" />
        <select value={filterK} onChange={(e) => { setFilterK(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
          <option value="semua">Semua</option>
          <option value="konsisten">✅ Konsisten</option>
          <option value="tidak">⚠️ Tidak Konsisten</option>
        </select>
        <span className="text-xs text-gray-400 self-center">{total} pengaduan</span>
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-400"><RefreshCw className="w-4 h-4 animate-spin inline mr-2" />Memuat...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 text-blue-900">
                <tr>
                  <th className="p-3 text-left font-semibold">Kode</th>
                  <th className="p-3 text-left font-semibold">Nama</th>
                  <th className="p-3 text-center font-semibold">Label Asli</th>
                  <th className="p-3 text-center font-semibold">Prediksi Final OOB</th>
                  <th className="p-3 text-center font-semibold">Jadi OOB di Pohon</th>
                  <th className="p-3 text-center font-semibold">Konsisten?</th>
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">Tidak ada data yang cocok</td></tr>
                ) : slice.map((d, i) => (
                  <tr key={d.kode_pengaduan} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
                    <td className="p-3 font-mono text-xs text-gray-600 whitespace-nowrap">{d.kode_pengaduan}</td>
                    <td className="p-3 text-xs text-gray-700 whitespace-nowrap">{d.nama}</td>
                    <td className="p-3 text-center"><CatBadge val={d.label_asli} /></td>
                    <td className="p-3 text-center"><CatBadge val={d.prediksi_final_oob} /></td>
                    <td className="p-3 text-center text-xs text-gray-600 max-w-xs">
                      {d.muncul_di_pohon.join(", ")}
                      <span className="ml-1 text-gray-400">({d.muncul_di_pohon.length}x)</span>
                    </td>
                    <td className="p-3 text-center">
                      {d.konsisten
                        ? <span className="flex items-center justify-center gap-1 text-green-700 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Konsisten</span>
                        : <span className="text-amber-600 text-xs font-semibold">⚠️ Tidak</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Halaman {page} dari {pages} · {total} total</span>
              <div className="flex gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹ Prev</button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next ›</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function RFOOB({ onLogout }) {
  const [summary, setSummary]         = useState(null);
  const [training, setTraining]       = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [selectedTree, setSelectedTree] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/oob").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/evaluasi").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([oobData, trainData]) => {
      setSummary(oobData);
      setTraining(trainData);
      setLoadingPage(false);
    });
  }, []);

  const handleSelectTree = useCallback((treeId) => {
    setSelectedTree(treeId);
    if (treeId) setTimeout(() => document.getElementById("oob-detail-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, []);

  const avgAcc = summary
    ? Object.values(summary.per_pohon).reduce((s, v) => s + v.oob_accuracy, 0) / Object.keys(summary.per_pohon).length
    : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">

          {/* Judul */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">OOB Score &amp; Validasi</h1>
              <p className="text-sm text-gray-500 mt-1">
                Data pengaduan yang tidak masuk bootstrap sample di tiap pohon — digunakan sebagai validasi internal Random Forest.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber: <code className="font-semibold mx-1">data/stages/oob.json</code>
                — data aktual dari <code className="font-semibold">estimators_samples_</code> sklearn
              </div>
            </div>
          </div>

          {loadingPage && <div className="flex items-center gap-2 text-gray-400 py-12 justify-center"><RefreshCw className="w-5 h-5 animate-spin" />Memuat...</div>}
          {!loadingPage && !summary && <FallbackNotice />}

          {/* Kartu ringkasan */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "OOB Score Global",     value: `${((summary.oob_score_global ?? 0) * 100).toFixed(2)}%`, sub: "Validasi internal sklearn",          color: "#2E7D32" },
                { label: "Pohon Ditampilkan",    value: summary.jumlah_pohon ?? 20,                               sub: "dari total estimators",              color: "#1976D2" },
                { label: "Rata-rata OOB/Pohon",  value: Object.values(summary.per_pohon)[0]?.oob_count ?? "-",    sub: "data nganggur per pohon (~36.8%)",   color: "#F57C00" },
                { label: "Avg OOB Accuracy",     value: `${(avgAcc * 100).toFixed(1)}%`,                          sub: "rata-rata akurasi prediksi OOB",     color: "#388E3C" },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl shadow p-5 border-l-4" style={{ borderColor: c.color }}>
                  <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bagian 1: Tabel ringkasan */}
          {summary && (
            <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
              <div>
                <h2 className="font-bold text-gray-800">Ringkasan OOB per Pohon</h2>
                <p className="text-xs text-gray-400 mt-0.5">Klik <strong>Lihat</strong> untuk membuka daftar pengaduan yang jadi OOB di pohon tersebut.</p>
              </div>
              <SummaryTable perPohon={summary.per_pohon} selected={selectedTree} onSelect={handleSelectTree} />
            </div>
          )}

          {/* Bagian 2: Detail per pohon */}
          {selectedTree && (
            <div id="oob-detail-panel">
              <TreeOobDetail treeId={selectedTree} onClose={() => setSelectedTree(null)} />
            </div>
          )}

          {/* Bagian 3: Akumulasi */}
          {summary && <AkumulasiPanel />}

        </main>
      </div>
    </div>
  );
}
