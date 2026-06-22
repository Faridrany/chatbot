import { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import {
  Shuffle, TreeDeciduous, Info, ChevronDown, ChevronUp,
  Users, AlertCircle, RefreshCw, Copy, Database,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const CATEGORY_COLORS = {
  INFRASTRUKTUR: { bg: "#2E7D32", light: "#E8F5E9", text: "#1B5E20" },
  KEAMANAN:      { bg: "#1976D2", light: "#E3F2FD", text: "#0D47A1" },
  LINGKUNGAN:    { bg: "#388E3C", light: "#F1F8E9", text: "#1B5E20" },
  PELAYANAN:     { bg: "#F57C00", light: "#FFF3E0", text: "#E65100" },
};

const CATS = ["INFRASTRUKTUR", "KEAMANAN", "LINGKUNGAN", "PELAYANAN"];

function CategoryBadge({ kategori }) {
  const c = CATEGORY_COLORS[kategori] || { bg: "#757575", light: "#F5F5F5", text: "#424242" };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: c.light, color: c.text, border: `1px solid ${c.bg}30` }}
    >
      {kategori}
    </span>
  );
}

function SummaryCards({ summary, training }) {
  const trees = Object.values(summary);
  const avgUnique = Math.round(trees.reduce((s, t) => s + t.unique_sampel, 0) / trees.length);
  const avgOob    = Math.round(trees.reduce((s, t) => s + t.oob_count, 0) / trees.length);
  const total     = trees[0]?.total_sampel ?? training?.data_train ?? 960;
  const pctUnique = ((avgUnique / total) * 100).toFixed(1);
  const pctOob    = ((avgOob / total) * 100).toFixed(1);
  const n         = training?.estimators ?? 500;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jumlah Pohon",            value: n,               sub: "n_estimators",             color: "#2E7D32" },
          { label: "Data Training",            value: total,           sub: "Bootstrap size per pohon", color: "#4CAF50" },
          { label: "Rata-rata Unique/Pohon",   value: `~${avgUnique}`, sub: `~${pctUnique}% dari data`, color: "#1976D2" },
          { label: "Rata-rata OOB/Pohon",      value: `~${avgOob}`,   sub: `~${pctOob}% data validasi`,color: "#F57C00" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow p-5 border-l-4" style={{ borderColor: c.color }}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-gray-800">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold text-gray-800 mb-4">Proporsi In-bag vs OOB</h2>
        <div className="max-w-lg space-y-3">
          <div className="flex h-9 rounded-xl overflow-hidden border border-gray-200">
            <div className="bg-[#2E7D32] flex items-center justify-center text-white text-xs font-bold" style={{ width: `${pctUnique}%` }}>
              In-bag {pctUnique}%
            </div>
            <div className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${pctOob}%` }}>
              OOB {pctOob}%
            </div>
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#2E7D32] inline-block" />In-bag (sampel unik)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block" />Duplikat dalam bootstrap</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />OOB (tidak terpilih)</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Level 2: Panel detail satu pohon ─────────────────────────────────────────
function TreeDetailPanel({ treeId, onClose }) {
  const [tab, setTab]       = useState("sampel");
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [sampelSearch, setSampelSearch] = useState("");
  const [oobSearch, setOobSearch]       = useState("");
  const [sampelKategori, setSampelKategori] = useState("SEMUA");
  const [oobKategori, setOobKategori]       = useState("SEMUA");
  const [sampelPage, setSampelPage] = useState(1);
  const [oobPage, setOobPage]       = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setSampelSearch(""); setOobSearch("");
    setSampelKategori("SEMUA"); setOobKategori("SEMUA");
    setSampelPage(1); setOobPage(1);
    fetch(`/api/bootstrap/${treeId}`)
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.error); }))
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [treeId]);

  const filteredSampel = (data?.sampel || []).filter((s) => {
    const matchSearch = sampelSearch
      ? s.kode_pengaduan.toLowerCase().includes(sampelSearch.toLowerCase()) ||
        s.nama.toLowerCase().includes(sampelSearch.toLowerCase()) ||
        s.deskripsi.toLowerCase().includes(sampelSearch.toLowerCase())
      : true;
    const matchKat = sampelKategori === "SEMUA" || s.kategori === sampelKategori;
    return matchSearch && matchKat;
  });

  const filteredOob = (data?.oob || []).filter((s) => {
    const matchSearch = oobSearch
      ? s.kode_pengaduan.toLowerCase().includes(oobSearch.toLowerCase()) ||
        s.nama.toLowerCase().includes(oobSearch.toLowerCase()) ||
        s.deskripsi.toLowerCase().includes(oobSearch.toLowerCase())
      : true;
    const matchKat = oobKategori === "SEMUA" || s.kategori === oobKategori;
    return matchSearch && matchKat;
  });

  const sampelTotal  = filteredSampel.length;
  const oobTotal     = filteredOob.length;
  const sampelSlice  = filteredSampel.slice((sampelPage - 1) * PAGE_SIZE, sampelPage * PAGE_SIZE);
  const oobSlice     = filteredOob.slice((oobPage - 1) * PAGE_SIZE, oobPage * PAGE_SIZE);
  const sampelPages  = Math.max(1, Math.ceil(sampelTotal / PAGE_SIZE));
  const oobPages     = Math.max(1, Math.ceil(oobTotal / PAGE_SIZE));

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden">
      {/* Header panel */}
      <div className="flex items-center justify-between px-6 py-4 bg-green-700 text-white">
        <div className="flex items-center gap-3">
          <TreeDeciduous className="w-5 h-5" />
          <span className="font-bold text-lg">Detail Bootstrap — Tree #{treeId}</span>
          {data && (
            <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">
              {data.total_sampel} sampel · {data.oob_count} OOB
            </span>
          )}
        </div>
        <button onClick={onClose} className="hover:bg-green-600 rounded-lg p-1 transition-colors">
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Memuat data pohon #{treeId}...
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 mx-6 my-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Gagal memuat data</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <div className="p-6 space-y-5">
          {/* Distribusi kelas ringkasan */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATS.map((cat) => {
              const c = CATEGORY_COLORS[cat] || { bg: "#757575", light: "#F5F5F5" };
              const inbag = data.class_distribution?.[cat] ?? 0;
              const oob   = data.oob_class_distribution?.[cat] ?? 0;
              return (
                <div key={cat} className="rounded-xl border p-3" style={{ borderColor: `${c.bg}40`, backgroundColor: c.light }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: c.bg }}>{cat}</p>
                  <p className="text-xl font-bold text-gray-800">{inbag}</p>
                  <p className="text-xs text-gray-500">In-bag · {oob} OOB</p>
                </div>
              );
            })}
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setTab("sampel")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                tab === "sampel"
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Sampel Training
                <span className="ml-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                  {data.unique_sampel} unik
                </span>
              </span>
            </button>
            <button
              onClick={() => setTab("oob")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                tab === "oob"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                OOB (Tidak Diambil)
                <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                  {data.oob_count}
                </span>
              </span>
            </button>
          </div>

          {/* Tab Sampel Training */}
          {tab === "sampel" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Cari kode, nama, deskripsi..."
                  value={sampelSearch}
                  onChange={(e) => { setSampelSearch(e.target.value); setSampelPage(1); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <select
                  value={sampelKategori}
                  onChange={(e) => { setSampelKategori(e.target.value); setSampelPage(1); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  <option value="SEMUA">Semua Kategori</option>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-xs text-gray-400 self-center">
                  {sampelTotal} pengaduan · {data.duplikat} duplikat bootstrap
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-green-50 text-green-900">
                    <tr>
                      <th className="p-3 text-left font-semibold">Kode</th>
                      <th className="p-3 text-left font-semibold">Nama</th>
                      <th className="p-3 text-left font-semibold">Cuplikan Deskripsi</th>
                      <th className="p-3 text-center font-semibold">Kategori</th>
                      <th className="p-3 text-center font-semibold">Diambil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampelSlice.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-gray-400 text-sm">Tidak ada data yang cocok</td></tr>
                    ) : sampelSlice.map((s, idx) => (
                      <tr key={`${s.kode_pengaduan}-${idx}`} className={`border-t ${idx % 2 === 0 ? "" : "bg-gray-50"} hover:bg-green-50 transition-colors`}>
                        <td className="p-3 font-mono text-xs text-gray-600 whitespace-nowrap">{s.kode_pengaduan}</td>
                        <td className="p-3 text-gray-700 text-xs whitespace-nowrap">{s.nama || "-"}</td>
                        <td className="p-3 text-gray-600 text-xs max-w-xs">
                          <span title={s.deskripsi}>
                            {s.deskripsi ? s.deskripsi.substring(0, 80) + (s.deskripsi.length > 80 ? "…" : "") : "-"}
                          </span>
                        </td>
                        <td className="p-3 text-center"><CategoryBadge kategori={s.kategori} /></td>
                        <td className="p-3 text-center">
                          {s.diambil > 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300">
                              <Copy className="w-3 h-3" />{s.diambil}x
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              1x
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sampelPages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Halaman {sampelPage} dari {sampelPages} · {sampelTotal} total</span>
                  <div className="flex gap-1">
                    <button disabled={sampelPage === 1} onClick={() => setSampelPage(p => p - 1)}
                      className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹ Prev</button>
                    <button disabled={sampelPage === sampelPages} onClick={() => setSampelPage(p => p + 1)}
                      className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next ›</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab OOB */}
          {tab === "oob" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Cari kode, nama, deskripsi..."
                  value={oobSearch}
                  onChange={(e) => { setOobSearch(e.target.value); setOobPage(1); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <select
                  value={oobKategori}
                  onChange={(e) => { setOobKategori(e.target.value); setOobPage(1); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="SEMUA">Semua Kategori</option>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-xs text-gray-400 self-center">
                  {oobTotal} pengaduan tidak terambil di pohon ini
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Pengaduan di bawah ini <strong>tidak masuk</strong> ke bootstrap sample pohon #{treeId}.
                  Karena pohon ini belum pernah melihat data ini saat training, data OOB ini dapat digunakan
                  sebagai <strong>set validasi internal</strong> yang jujur untuk pohon ini saja.
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50 text-blue-900">
                    <tr>
                      <th className="p-3 text-left font-semibold">Kode</th>
                      <th className="p-3 text-left font-semibold">Nama</th>
                      <th className="p-3 text-left font-semibold">Cuplikan Deskripsi</th>
                      <th className="p-3 text-center font-semibold">Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oobSlice.length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-gray-400 text-sm">Tidak ada data yang cocok</td></tr>
                    ) : oobSlice.map((s, idx) => (
                      <tr key={`${s.kode_pengaduan}-${idx}`} className={`border-t ${idx % 2 === 0 ? "" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 font-mono text-xs text-gray-600 whitespace-nowrap">{s.kode_pengaduan}</td>
                        <td className="p-3 text-gray-700 text-xs whitespace-nowrap">{s.nama || "-"}</td>
                        <td className="p-3 text-gray-600 text-xs max-w-xs">
                          <span title={s.deskripsi}>
                            {s.deskripsi ? s.deskripsi.substring(0, 80) + (s.deskripsi.length > 80 ? "…" : "") : "-"}
                          </span>
                        </td>
                        <td className="p-3 text-center"><CategoryBadge kategori={s.kategori} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {oobPages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Halaman {oobPage} dari {oobPages} · {oobTotal} total</span>
                  <div className="flex gap-1">
                    <button disabled={oobPage === 1} onClick={() => setOobPage(p => p - 1)}
                      className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">‹ Prev</button>
                    <button disabled={oobPage === oobPages} onClick={() => setOobPage(p => p + 1)}
                      className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next ›</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Level 1: Tabel ringkasan semua 20 pohon ──────────────────────────────────
function BootstrapTable({ summary, onSelectTree, selectedTree }) {
  const rows = Object.entries(summary).map(([key, val]) => ({
    tree_id: parseInt(key.replace("tree_", "")),
    ...val,
  })).sort((a, b) => a.tree_id - b.tree_id);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-green-100 text-green-900">
          <tr>
            <th className="p-3 text-left font-semibold">No. Pohon</th>
            <th className="p-3 text-center font-semibold">Total Sampel</th>
            <th className="p-3 text-center font-semibold">Unique</th>
            <th className="p-3 text-center font-semibold">Duplikat</th>
            {CATS.map((c) => (
              <th key={c} className="p-3 text-center font-semibold" style={{ color: CATEGORY_COLORS[c]?.bg }}>
                {c.substring(0, 5)}…
              </th>
            ))}
            <th className="p-3 text-center font-semibold text-blue-700">OOB</th>
            <th className="p-3 text-center font-semibold w-24">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isSelected = selectedTree === row.tree_id;
            return (
              <tr
                key={row.tree_id}
                className={`border-t transition-colors ${
                  isSelected
                    ? "bg-green-50 ring-2 ring-inset ring-green-400"
                    : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-green-50"
                }`}
              >
                <td className="p-3 font-semibold text-gray-800">
                  <div className="flex items-center gap-2">
                    <TreeDeciduous className="w-4 h-4 text-green-600" />
                    Tree #{row.tree_id}
                  </div>
                </td>
                <td className="p-3 text-center text-gray-700 font-mono">{row.total_sampel}</td>
                <td className="p-3 text-center">
                  <Badge className="bg-green-600 text-white font-mono">{row.unique_sampel}</Badge>
                </td>
                <td className="p-3 text-center">
                  <Badge variant="outline" className="text-orange-600 border-orange-300 font-mono">{row.duplikat}</Badge>
                </td>
                {CATS.map((cat) => (
                  <td key={cat} className="p-3 text-center">
                    <span className="font-semibold text-gray-700">{row.class_distribution?.[cat] ?? "-"}</span>
                  </td>
                ))}
                <td className="p-3 text-center">
                  <Badge className="bg-blue-600 text-white font-mono">{row.oob_count}</Badge>
                </td>
                <td className="p-3 text-center">
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={isSelected ? "bg-green-700 hover:bg-green-800 text-white" : ""}
                    onClick={() => onSelectTree(isSelected ? null : row.tree_id)}
                  >
                    {isSelected
                      ? <span className="flex items-center gap-1"><ChevronUp className="w-3.5 h-3.5" />Tutup</span>
                      : <span className="flex items-center gap-1"><ChevronDown className="w-3.5 h-3.5" />Lihat</span>
                    }
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Fallback: jika bootstrap.json belum ada (data simulasi) ─────────────────
function FallbackNotice({ training }) {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 flex items-start gap-4">
      <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-800 mb-1">Data bootstrap aktual belum tersedia</p>
        <p className="text-sm text-amber-700 mb-3">
          File <code className="bg-amber-100 px-1 rounded">data/stages/bootstrap.json</code> belum ada.
          Jalankan ulang training untuk menghasilkan data bootstrap nyata dari {training?.estimators ?? 500} pohon.
        </p>
        <code className="text-xs bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg block font-mono">
          python backend/main.py --train
        </code>
      </div>
    </div>
  );
}

// ─── Komponen utama ──────────────────────────────────────────────────────────
export default function RFBootstrap({ onLogout }) {
  const [training, setTraining]   = useState(null);
  const [summary, setSummary]     = useState(null);
  const [selectedTree, setSelectedTree] = useState(null);
  const [loadingPage, setLoadingPage]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/evaluasi").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/bootstrap").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([trainData, bootstrapData]) => {
      setTraining(trainData);
      setSummary(bootstrapData);
      setLoadingPage(false);
    });
  }, []);

  const handleSelectTree = useCallback((treeId) => {
    setSelectedTree(treeId);
    // scroll ke panel detail setelah render
    if (treeId) {
      setTimeout(() => {
        document.getElementById("tree-detail-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
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
              <Shuffle className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Bootstrap Sampling</h1>
              <p className="text-sm text-gray-500 mt-1">
                Transparansi penuh — pengaduan mana saja yang masuk ke tiap pohon, dan mana yang menjadi OOB.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber: <code className="font-semibold mx-1">data/stages/bootstrap.json</code>
                — data aktual dari <code className="font-semibold">estimators_samples_</code> sklearn
              </div>
            </div>
          </div>

          {loadingPage && (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" /> Memuat data bootstrap...
            </div>
          )}

          {!loadingPage && summary && training && (
            <SummaryCards summary={summary} training={training} />
          )}

          {!loadingPage && !summary && <FallbackNotice training={training} />}

          {/* Tabel Level 1 */}
          {!loadingPage && summary && (
            <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ringkasan Bootstrap per Pohon</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Klik tombol <strong>Lihat</strong> untuk membuka detail pengaduan yang masuk ke tiap pohon.
                  Data dimuat on-demand hanya saat diklik.
                </p>
              </div>
              <BootstrapTable
                summary={summary}
                selectedTree={selectedTree}
                onSelectTree={handleSelectTree}
              />
            </div>
          )}

          {/* Panel Level 2 — muncul di bawah tabel saat pohon diklik */}
          {selectedTree && (
            <div id="tree-detail-panel">
              <TreeDetailPanel
                treeId={selectedTree}
                onClose={() => setSelectedTree(null)}
              />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
