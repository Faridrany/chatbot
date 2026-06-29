import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { TreeDeciduous, GitBranch, Shuffle, Target, Filter, Info, ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border-l-4" style={{ borderColor: accent || "#2E7D32" }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
            <Icon className="w-6 h-6" style={{ color: accent }} />
          </div>
        )}
      </div>
    </div>
  );
}

const CATEGORY_COLORS = {
  INFRASTRUKTUR: "#2E7D32",
  KEAMANAN: "#1976D2",
  LINGKUNGAN: "#388E3C",
  PELAYANAN: "#F57C00",
};

const PAGE_SIZE = 10;

export default function RandomForestDetail({ onLogout }) {
  const [training, setTraining] = useState(null);
  const [pengaduanList, setPengaduanList] = useState([]);
  const [totalPengaduan, setTotalPengaduan] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [expandedKode, setExpandedKode] = useState(null);
  const [rfCache, setRfCache] = useState({});       // keyed by kode_pengaduan
  const [rfLoading, setRfLoading] = useState({});
  const [showSplitDetail, setShowSplitDetail] = useState(false);

  // Load training metadata once
  useEffect(() => {
    fetch("/api/evaluasi")
      .then(r => r.ok ? r.json() : {})
      .then(setTraining)
      .catch(() => {});
  }, []);

  // Load pengaduan list (paginated)
  const fetchList = useCallback((p, search) => {
    setLoadingList(true);
    const params = new URLSearchParams({ page: p, limit: PAGE_SIZE, ...(search && { search }) });
    fetch(`/api/pengaduan?${params}`)
      .then(r => r.json())
      .then(res => {
        setPengaduanList(res.items ?? []);
        setTotalPengaduan(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
        setLoadingList(false);
      })
      .catch(() => setLoadingList(false));
  }, []);

  useEffect(() => { fetchList(page, searchTerm); }, [page, searchTerm, fetchList]);

  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Lazy-load RF stage data for one pengaduan
  const fetchRF = useCallback((kode) => {
    if (!kode || rfCache[kode] !== undefined) return;
    setRfLoading(prev => ({ ...prev, [kode]: true }));
    fetch(`/api/stages/random_forest/${kode}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setRfCache(prev => ({ ...prev, [kode]: data })))
      .catch(() => setRfCache(prev => ({ ...prev, [kode]: null })))
      .finally(() => setRfLoading(prev => ({ ...prev, [kode]: false })));
  }, [rfCache]);

  const handleToggle = (item) => {
    const kode = item.kode_pengaduan;
    const isOpen = expandedKode === kode;
    setExpandedKode(isOpen ? null : kode);
    if (!isOpen) fetchRF(kode);
  };

  const nEstimators = training?.estimators ?? 500;
  const totalFeatures = training?.fitur_selected ?? 1000;
  const featuresPerSplit = Math.round(Math.sqrt(totalFeatures));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">

          {/* Judul */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Detail Proses Random Forest Classifier</h1>
            <p className="text-sm text-gray-500 mt-1">
              Analisis mendalam proses training dan prediksi menggunakan {nEstimators} pohon keputusan
            </p>
          </div>

          {/* Konfigurasi Model */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Jumlah Pohon (Estimator)" value={nEstimators}
              sub="Decision trees dalam ensemble" accent="#2E7D32" icon={TreeDeciduous} />
            <StatCard label="Data Training" value={(training?.data_train ?? 960).toLocaleString()}
              sub="Sampel untuk melatih model" accent="#4CAF50" icon={Shuffle} />
            <StatCard label="Total Fitur TF-IDF" value={(totalFeatures).toLocaleString()}
              sub="Dari proses SelectPercentile" accent="#81C784" icon={Filter} />
            <StatCard label="Fitur per Split" value={featuresPerSplit}
              sub={`√${totalFeatures} fitur random`} accent="#A5D6A7" icon={GitBranch} />
          </div>

          {/* Step 1: Bootstrap Sampling (Konseptual) */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-green-700" />
              Step 1: Bootstrap Sampling
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Setiap pohon dilatih dengan <strong>random sample dengan replacement</strong> dari{" "}
                {training?.data_train ?? 960} data training. Rata-rata ~63.2% data unique, ~36.8% duplikat.
                Sisanya (~36.8%) menjadi <strong>Out-of-Bag (OOB)</strong> samples.
                OOB Score hasil training: <strong>{training ? `${(training.oob_score * 100).toFixed(2)}%` : "—"}</strong>.
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              {[
                { label: "Total Data Training", value: (training?.data_train ?? 960).toLocaleString(), color: "#2E7D32" },
                { label: "Rata-rata Unique/Bootstrap", value: `~${Math.round((training?.data_train ?? 960) * 0.632).toLocaleString()}`, color: "#4CAF50" },
                { label: "Rata-rata OOB/Pohon", value: `~${Math.round((training?.data_train ?? 960) * 0.368).toLocaleString()}`, color: "#1976D2" },
                { label: "OOB Score Keseluruhan", value: training ? `${(training.oob_score * 100).toFixed(2)}%` : "—", color: "#F57C00" },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-4 bg-gray-50 rounded-xl border-l-4" style={{ borderLeftColor: color }}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Gini Impurity (Konseptual) */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-green-700" />
                Step 2: Node Splitting & Gini Impurity
              </h2>
              <Button size="sm" variant={showSplitDetail ? "default" : "outline"}
                onClick={() => setShowSplitDetail(v => !v)}
                className={showSplitDetail ? "bg-green-700" : ""}>
                {showSplitDetail ? "Sembunyikan" : "Tampilkan Contoh Splitting"}
              </Button>
            </div>
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Setiap node memilih <strong>√{totalFeatures} = {featuresPerSplit} fitur random</strong> dari {totalFeatures} fitur total.
                Fitur terbaik dipilih berdasarkan <strong>Gini Impurity Decrease</strong> terbesar.
                Formula: <code className="bg-white px-1 rounded">Gini = 1 - Σ(pᵢ²)</code>
              </span>
            </div>
            {showSplitDetail && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border-l-4 border-gray-500 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-3">Contoh: Root Node (Depth 0) — 4 kelas seimbang</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <p className="text-xs text-gray-500">Total Samples</p>
                      <p className="text-xl font-bold text-gray-800">{training?.data_train ?? 960}</p>
                    </div>
                    {["INFRASTRUKTUR","KEAMANAN","LINGKUNGAN","PELAYANAN"].map(cls => (
                      <div key={cls} className="p-3 bg-white rounded-lg border text-center">
                        <p className="text-xs text-gray-500">{cls}</p>
                        <p className="text-xl font-bold" style={{ color: CATEGORY_COLORS[cls] }}>
                          ~{Math.round((training?.data_train ?? 960) / 4)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Gini Impurity (Sebelum Split) — 4 kelas seimbang</p>
                    <p className="text-2xl font-bold text-red-600">0.7500</p>
                    <p className="text-xs font-mono text-gray-600 mt-2">
                      Gini = 1 - (0.25² + 0.25² + 0.25² + 0.25²) = 1 - 0.25 = 0.7500
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Gini = 0.75 → node sangat tidak pure (campur 4 kelas). Tujuan split: turunkan Gini anak-node.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
                  <strong>Catatan:</strong> Detail split per node tidak disimpan (terlalu besar untuk 500 pohon × ribuan node).
                  Yang tersimpan adalah <strong>feature importance</strong> sebagai agregat kontribusi setiap fitur di semua pohon.
                  Lihat detail per pengaduan di tabel bawah.
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Prediksi & Voting per Pengaduan (DATA REAL) */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-700" />
              Step 3: Prediksi & Majority Voting — Data Real
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Klik "Lihat Detail RF" pada baris pengaduan untuk melihat TF-IDF vektor, voting {nEstimators} pohon,
              probabilitas per kelas, dan kontribusi fitur terpenting.
            </p>

            {/* Search */}
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input placeholder="Cari deskripsi / nama…"
                value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-9" />
            </div>

            {loadingList ? (
              <p className="text-center text-gray-400 py-8">Memuat data…</p>
            ) : (
              <>
                <div className="space-y-4">
                  {pengaduanList.map((item, idx) => {
                    const kode = item.kode_pengaduan;
                    const isOpen = expandedKode === kode;
                    const rfData = rfCache[kode];
                    const isLoadingRF = rfLoading[kode];
                    const rank = (page - 1) * PAGE_SIZE + idx + 1;

                    return (
                      <div key={kode} className="border rounded-xl bg-white overflow-hidden">
                        {/* Row header */}
                        <div className="flex items-center justify-between p-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-mono text-gray-400">#{rank}</span>
                              <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">{kode}</span>
                              <span className="font-semibold text-gray-800 text-sm">{item.nama}</span>
                              <Badge className="text-xs" style={{
                                backgroundColor: CATEGORY_COLORS[item.kategori_prediksi] ?? "#888",
                                color: "white"
                              }}>
                                {item.kategori_prediksi}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                conf: {item.confidence != null ? `${(item.confidence * 100).toFixed(1)}%` : "—"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate max-w-xl">{item.deskripsi}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleToggle(item)}
                            className="ml-3 flex-shrink-0 flex items-center gap-1.5">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {isOpen ? "Tutup" : "Lihat Detail RF"}
                          </Button>
                        </div>

                        {/* Expanded RF detail */}
                        {isOpen && (
                          <div className="border-t bg-gray-50 p-5 space-y-5">
                            {isLoadingRF ? (
                              <p className="text-sm text-gray-400">Memuat data Random Forest…</p>
                            ) : !rfData ? (
                              <p className="text-sm text-red-400">Data RF tidak tersedia untuk pengaduan ini.</p>
                            ) : (() => {
                              const treeVotes = rfData.tree_votes_sample ?? {};
                              const probaAll = rfData.proba_all ?? {};
                              const fiImportance = rfData.feature_importance_kontribusi ?? {};
                              const voteCounts = Object.values(treeVotes).reduce((acc, v) => {
                                acc[v] = (acc[v] || 0) + 1; return acc;
                              }, {});
                              const totalVotesSample = Object.keys(treeVotes).length;
                              const fiEntries = Object.entries(fiImportance)
                                .sort((a, b) => (b[1].importance * b[1].tfidf) - (a[1].importance * a[1].tfidf));
                              const maxFI = fiEntries.length > 0
                                ? fiEntries[0][1].importance * fiEntries[0][1].tfidf : 1;

                              return (
                                <>
                                  {/* ① Deskripsi & Processed */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 bg-white border rounded-xl">
                                      <p className="text-xs font-semibold text-gray-500 mb-2">① Teks Asli</p>
                                      <p className="text-sm text-gray-800 leading-relaxed">{item.deskripsi}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                                      <p className="text-xs font-semibold text-green-700 mb-2">② Hasil Preprocessing</p>
                                      <p className="text-sm font-mono text-gray-700 leading-relaxed">{item.processed}</p>
                                    </div>
                                  </div>

                                  {/* ② Probabilitas per kelas */}
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <p className="text-xs font-semibold text-blue-700 mb-3">
                                      ③ Probabilitas per Kelas (dari {nEstimators} pohon)
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      {Object.entries(probaAll)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([cls, prob]) => {
                                          const isWinner = cls === rfData.prediction;
                                          return (
                                            <div key={cls} className={`p-3 rounded-lg border text-center ${
                                              isWinner ? "bg-white border-green-500 ring-2 ring-green-400" : "bg-white"}`}>
                                              <p className="text-xs font-semibold mb-1" style={{ color: CATEGORY_COLORS[cls] }}>{cls}</p>
                                              <p className="text-xl font-bold text-gray-800">{(prob * 100).toFixed(1)}%</p>
                                              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full"
                                                  style={{ width: `${prob * 100}%`, backgroundColor: CATEGORY_COLORS[cls] }} />
                                              </div>
                                              {isWinner && <p className="text-[10px] text-green-600 font-bold mt-1">✓ PREDIKSI</p>}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>

                                  {/* ③ Tree votes sample (10 pohon pertama) */}
                                  {totalVotesSample > 0 && (
                                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                                      <p className="text-xs font-semibold text-purple-700 mb-3">
                                        ④ Voting Sample ({totalVotesSample} dari {nEstimators} pohon)
                                      </p>
                                      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4">
                                        {Object.entries(treeVotes).map(([treeKey, vote]) => (
                                          <div key={treeKey} className="p-2 bg-white rounded-lg border text-center text-xs">
                                            <TreeDeciduous className="w-3 h-3 mx-auto mb-1"
                                              style={{ color: CATEGORY_COLORS[vote] }} />
                                            <p className="text-gray-400 text-[10px]">{treeKey.replace("tree_", "#")}</p>
                                            <p className="font-bold text-[10px] truncate"
                                              style={{ color: CATEGORY_COLORS[vote] }}>
                                              {vote.slice(0, 4)}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                      {/* Vote tally */}
                                      <div className="space-y-2">
                                        {Object.entries(voteCounts)
                                          .sort((a, b) => b[1] - a[1])
                                          .map(([cls, cnt]) => (
                                            <div key={cls} className="flex items-center gap-3">
                                              <span className="text-xs font-semibold w-28" style={{ color: CATEGORY_COLORS[cls] }}>
                                                {cls}
                                              </span>
                                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                <div className="h-3 rounded-full"
                                                  style={{
                                                    width: `${(cnt / totalVotesSample) * 100}%`,
                                                    backgroundColor: CATEGORY_COLORS[cls]
                                                  }} />
                                              </div>
                                              <span className="text-xs font-bold text-gray-700 w-16 text-right">
                                                {cnt}/{totalVotesSample} ({((cnt / totalVotesSample) * 100).toFixed(0)}%)
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                      <p className="text-xs text-gray-400 mt-2 italic">
                                        Menampilkan {totalVotesSample} pohon pertama dari {nEstimators} total. Probabilitas final
                                        dihitung dari semua {nEstimators} pohon.
                                      </p>
                                    </div>
                                  )}

                                  {/* ④ Feature importance kontribusi */}
                                  {fiEntries.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-700 mb-3">
                                        ⑤ Feature Importance × TF-IDF (Kontribusi Term untuk Dokumen Ini)
                                      </p>
                                      <div className="overflow-x-auto rounded-xl border">
                                        <table className="w-full text-xs">
                                          <thead className="bg-green-50 text-green-800">
                                            <tr>
                                              <th className="p-2 text-left w-8">#</th>
                                              <th className="p-2 text-left">Term</th>
                                              <th className="p-2 text-left w-44">Importance (Global)</th>
                                              <th className="p-2 text-left w-44">TF-IDF (Dokumen)</th>
                                              <th className="p-2 text-left w-44">Kontribusi (I×T)</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {fiEntries.slice(0, 20).map(([term, vals], ti) => {
                                              const contrib = vals.importance * vals.tfidf;
                                              const pct = maxFI > 0 ? Math.min(100, (contrib / maxFI) * 100) : 0;
                                              return (
                                                <tr key={term} className={`border-t ${ti < 3 ? "bg-green-50/40" : "hover:bg-gray-50"}`}>
                                                  <td className="p-2 text-gray-400">{ti + 1}</td>
                                                  <td className="p-2 font-mono text-gray-800">
                                                    {term}
                                                    {ti < 3 && <span className="ml-1 text-[10px] text-green-600 font-bold">TOP</span>}
                                                  </td>
                                                  <td className="p-2 tabular-nums text-gray-600">{vals.importance.toFixed(6)}</td>
                                                  <td className="p-2 tabular-nums text-gray-600">{vals.tfidf.toFixed(6)}</td>
                                                  <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                                                        <div className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                                                          style={{ width: `${pct}%` }} />
                                                      </div>
                                                      <span className="font-bold text-green-700 w-16 text-right">
                                                        {contrib.toFixed(6)}
                                                      </span>
                                                    </div>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-2 italic">
                                        Kontribusi = Feature Importance (global dari model) × TF-IDF (bobot term dalam dokumen ini).
                                        Menampilkan top 20 term.
                                      </p>
                                    </div>
                                  )}

                                  {/* Final result */}
                                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-500">Prediksi Final (Majority Voting)</p>
                                      <p className="text-2xl font-bold" style={{ color: CATEGORY_COLORS[rfData.prediction] }}>
                                        {rfData.prediction}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Confidence: <strong>{(rfData.confidence * 100).toFixed(2)}%</strong>
                                      </p>
                                    </div>
                                    {item.label_asli && item.label_asli !== "-" && (
                                      <div className="text-right">
                                        <p className="text-xs text-gray-500">Label Asli</p>
                                        <Badge className="text-sm" style={{
                                          backgroundColor: CATEGORY_COLORS[item.label_asli] ?? "#888",
                                          color: "white"
                                        }}>
                                          {item.label_asli}
                                        </Badge>
                                        <p className="text-xs mt-1 font-semibold">
                                          {rfData.prediction === item.label_asli
                                            ? <span className="text-green-600">✓ Benar</span>
                                            : <span className="text-red-500">✗ Salah</span>}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-400">
                    Halaman {page} dari {totalPages} · {totalPengaduan.toLocaleString()} pengaduan
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1 || loadingList}
                      onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <Button key={p} size="sm"
                          variant={p === page ? "default" : "outline"}
                          className={p === page ? "bg-green-700 text-white" : ""}
                          onClick={() => setPage(p)}>{p}</Button>
                      );
                    })}
                    <Button variant="outline" size="sm" disabled={page === totalPages || loadingList}
                      onClick={() => setPage(p => p + 1)}>
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Konsep Penting */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Konsep Penting dalam Random Forest</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Bootstrap Sampling", color: "#2E7D32",
                  desc: `Setiap pohon dilatih dari random sample with replacement (${training?.data_train ?? 960} data). ~63.2% unique, ~36.8% OOB untuk validasi internal.` },
                { title: "Random Feature Selection", color: "#4CAF50",
                  desc: `Setiap node split hanya mempertimbangkan √${totalFeatures} = ${featuresPerSplit} fitur random. Ini mencegah pohon terlalu mirip (decorrelation) dan mengurangi overfitting.` },
                { title: "Gini Impurity", color: "#81C784",
                  desc: `Gini = 0 (pure), Gini = 0.75 (4 kelas seimbang = sangat campur). Split dipilih untuk memaksimalkan penurunan Gini. Formula: Gini = 1 − Σ(pᵢ²)` },
                { title: "Majority Voting", color: "#A5D6A7",
                  desc: `Dari ${nEstimators} pohon, masing-masing memberi 1 vote. Kelas dengan vote terbanyak menang. Probabilitas = proporsi vote per kelas.` },
                { title: "OOB Score", color: "#1976D2",
                  desc: `OOB Score model ini: ${training ? (training.oob_score * 100).toFixed(2) + "%" : "—"}. Setiap pohon divalidasi dengan ~36.8% data yang tidak masuk bootstrap-nya.` },
                { title: "Feature Importance", color: "#F57C00",
                  desc: `Diukur dari total penurunan Gini yang dikontribusikan setiap fitur di semua pohon. Digabung dengan TF-IDF untuk menunjukkan kontribusi term per dokumen.` },
              ].map((c, i) => (
                <div key={i} className="p-4 rounded-xl border-l-4 bg-gray-50" style={{ borderColor: c.color }}>
                  <h3 className="font-semibold text-gray-800 mb-2">{c.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
