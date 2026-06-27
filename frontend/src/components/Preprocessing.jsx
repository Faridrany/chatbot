import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PreprocessingDetailCard from "./PreprocessingDetailCard";
import {
  Cpu, Info, Search, ChevronLeft, ChevronRight,
  FlaskConical, BookOpen, ArrowRight,
} from "lucide-react";

// Kamus normalisasi (sama dengan backend)
const NORM_DICT = {
  gk: "tidak", nggak: "tidak", tdk: "tidak",
  rt: "rukun tetangga", rw: "rukun warga",
  pju: "penerangan jalan umum",
};

// Aturan cleaning (karakter yang dibuang)
const CLEANING_RULES = [
  { rule: "URL", contoh: "https://...", desc: "Link web dihapus" },
  { rule: "Karakter non-alfabet", contoh: "@#$%0-9!?,.", desc: "Simbol & angka dihapus" },
  { rule: "Spasi berlebih", contoh: "jalan  rusak", desc: "Spasi ganda dipadatkan" },
];

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

const LIMIT = 20;

export default function Preprocessing({ onLogout }) {
  const location = useLocation();
  const highlightKode = new URLSearchParams(location.search).get("highlight") ?? null;
  const rowRefs = useRef({});  // kode_pengaduan → DOM ref

  const [items, setItems]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterKat, setFilterKat] = useState("SEMUA");
  const [selectedKode, setSelectedKode] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({
      page, limit: LIMIT,
      ...(search   && { search }),
      ...(filterKat !== "SEMUA" && { kategori: filterKat }),
    });
    fetch(`/api/pengaduan?${p}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) { setItems(d.items ?? []); setTotal(d.total ?? 0); setTotalPages(d.totalPages ?? 1); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search, filterKat]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Scroll & buka detail saat halaman dibuka via ?highlight=
  useEffect(() => {
    if (!highlightKode || loading || !items.length) return;
    const found = items.find((it) => it.kode_pengaduan === highlightKode);
    if (found) {
      // Otomatis buka detail panel
      setSelectedKode(highlightKode);
      // Scroll ke baris setelah render
      setTimeout(() => {
        const el = rowRefs.current[highlightKode];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, [highlightKode, items, loading]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSelect = (kode) => {
    setSelectedKode(selectedKode === kode ? null : kode);
    if (kode !== selectedKode) {
      setTimeout(() => document.getElementById("detail-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">

          {/* Judul */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Preprocessing Teks</h1>
              <p className="text-sm text-gray-500 mt-1">
                Lacak transformasi teks pengaduan melalui 6 tahap preprocessing — dari teks mentah hingga siap diproses model.
              </p>
            </div>
          </div>

          {/* Bagian atas: Ringkasan Aturan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pipeline Steps */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow p-5">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-green-700" />6 Tahap Pipeline
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { n:"1", label:"Cleaning",         color:"#E53935", desc:"Hapus URL, simbol, angka" },
                  { n:"2", label:"Case Folding",      color:"#FB8C00", desc:"Semua huruf kecil" },
                  { n:"3", label:"Tokenizing",        color:"#FDD835", desc:"Pecah jadi token kata" },
                  { n:"4", label:"Normalization",     color:"#43A047", desc:"Perbaiki singkatan" },
                  { n:"5", label:"Stopword Removal",  color:"#1E88E5", desc:"Hapus kata umum" },
                  { n:"6", label:"Stemming",          color:"#8E24AA", desc:"Kata dasar (Sastrawi)" },
                ].map((s, i) => (
                  <div key={s.n} className="flex items-center gap-1.5">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: `${s.color}40`, backgroundColor: `${s.color}10` }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>{s.n}</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{s.label}</p>
                        <p className="text-[10px] text-gray-500">{s.desc}</p>
                      </div>
                    </div>
                    {i < 5 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Kamus Normalisasi */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-700" />Kamus Normalisasi
              </h2>
              <div className="space-y-1.5">
                {Object.entries(NORM_DICT).map(([from, to]) => (
                  <div key={from} className="flex items-center gap-2 text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                    <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 rounded">{from}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="font-mono font-semibold text-green-700">{to}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aturan Cleaning */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-red-600" />Aturan Cleaning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CLEANING_RULES.map((r) => (
                <div key={r.rule} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-red-800">{r.rule}</p>
                    <p className="font-mono text-red-500 mt-0.5">contoh: <span className="line-through">{r.contoh}</span></p>
                    <p className="text-gray-500 mt-0.5">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabel pengaduan */}
          <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-4">
            <div>
              <h2 className="font-bold text-gray-800">Daftar Pengaduan</h2>
              <p className="text-xs text-gray-400 mt-0.5">Klik <strong>Lihat Detail Proses</strong> untuk melihat transformasi kata per kata tiap tahap.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Cari nama atau deskripsi..." value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              </div>
              <select value={filterKat} onChange={(e) => { setFilterKat(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
                <option value="SEMUA">Semua Kategori</option>
                {["INFRASTRUKTUR","KEAMANAN","LINGKUNGAN","PELAYANAN"].map((c) => <option key={c}>{c}</option>)}
              </select>
              {loading && <span className="text-xs text-gray-400 self-center">Memuat...</span>}
              {!loading && <span className="text-xs text-gray-400 self-center">{total.toLocaleString()} pengaduan</span>}
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-green-50 text-green-900">
                  <tr>
                    <th className="p-3 text-left font-semibold">Kode</th>
                    <th className="p-3 text-left font-semibold">Nama</th>
                    <th className="p-3 text-left font-semibold">Teks Awal (Cuplikan)</th>
                    <th className="p-3 text-center font-semibold">Kategori</th>
                    <th className="p-3 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!items.length ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">{loading ? "Memuat..." : "Tidak ada data"}</td></tr>
                  ) : items.map((item, i) => {
                    const isSelected  = selectedKode === item.kode_pengaduan;
                    const isHighlight = highlightKode === item.kode_pengaduan;
                    return (
                      <tr
                        key={item.kode_pengaduan}
                        ref={(el) => { if (el) rowRefs.current[item.kode_pengaduan] = el; }}
                        className={`border-t transition-colors ${
                          isHighlight ? "bg-yellow-50 ring-2 ring-inset ring-yellow-400" :
                          isSelected  ? "bg-green-50 ring-2 ring-inset ring-green-400" :
                          i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-green-50"
                        }`}>
                        <td className="p-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                          {item.kode_pengaduan}
                          {isHighlight && <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold">↩ Dari Detail</span>}
                        </td>
                        <td className="p-3 text-xs text-gray-700 whitespace-nowrap">{item.nama}</td>
                        <td className="p-3 text-xs text-gray-600 max-w-xs">
                          <span title={item.deskripsi}>{item.deskripsi?.substring(0, 70)}{item.deskripsi?.length > 70 ? "…" : ""}</span>
                        </td>
                        <td className="p-3 text-center">
                          {item.kategori_prediksi !== "-" ? <CatBadge val={item.kategori_prediksi} /> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleSelect(item.kode_pengaduan)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isSelected ? "bg-green-700 text-white" : "bg-white border border-green-600 text-green-700 hover:bg-green-50"}`}>
                            {isSelected ? "Tutup" : "Lihat Detail Proses"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Halaman {page} dari {totalPages} · {total.toLocaleString()} total</span>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="flex items-center gap-1 px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">
                    <ChevronLeft className="w-3 h-3" />Prev
                  </button>
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
                    className="flex items-center gap-1 px-2 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">
                    Next<ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel detail */}
          {selectedKode && (
            <div id="detail-panel">
              <PreprocessingDetailCard kode={selectedKode} onClose={() => setSelectedKode(null)} />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
