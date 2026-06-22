import { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { CheckCircle2, Info, Search, ChevronLeft, ChevronRight, Eye, Hash } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const LIMIT = 20;

function TermFrequencyBar({ term, count, maxCount }) {
  const pct = maxCount > 0 ? Math.min(100, (count / maxCount) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-mono text-gray-700 w-32 truncate">{term}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-6 min-w-20 relative">
        <div className="h-6 rounded-full transition-all bg-gradient-to-r from-green-500 to-green-600" style={{ width: `${pct}%` }} />
        <span className="absolute right-2 top-0.5 text-xs font-bold text-gray-700">{count}x</span>
      </div>
    </div>
  );
}

export default function EkstraksiFinalProcessed({ onLogout }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [expandedId, setExpandedId] = useState(null);
  // TF-IDF stage data keyed by kode_pengaduan
  const [tfidfCache, setTfidfCache] = useState({});
  const [tfidfLoading, setTfidfLoading] = useState({});

  const fetchData = useCallback((p, search, kategori) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: p,
      limit: LIMIT,
      ...(search && { search }),
      ...(kategori !== "semua" && { kategori }),
    });

    fetch(`/api/pengaduan?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((res) => {
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching final processed data:", err);
        setError(err.message || "Gagal memuat data. Pastikan backend server berjalan di port 3001.");
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchData(page, searchTerm, filterKategori); }, [page, searchTerm, filterKategori, fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleKategori = (v) => { setFilterKategori(v); setPage(1); };

  // Fetch TF-IDF stage data for a specific pengaduan on demand
  const fetchTfidf = useCallback((kode) => {
    if (!kode || tfidfCache[kode] !== undefined) return;
    setTfidfLoading(prev => ({ ...prev, [kode]: true }));
    fetch(`/api/stages/tfidf/${kode}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setTfidfCache(prev => ({ ...prev, [kode]: data }));
      })
      .catch(() => {
        setTfidfCache(prev => ({ ...prev, [kode]: null }));
      })
      .finally(() => {
        setTfidfLoading(prev => ({ ...prev, [kode]: false }));
      });
  }, [tfidfCache]);

  const handleToggleDetail = (item) => {
    const isExpanded = expandedId === item._id;
    setExpandedId(isExpanded ? null : item._id);
    if (!isExpanded && item.kode_pengaduan) {
      fetchTfidf(item.kode_pengaduan);
    }
  };

  // Calculate term frequency from processed text (for local TF)
  const getTermFrequency = (processedText) => {
    if (!processedText) return {};
    const terms = processedText.split(/\s+/).filter(Boolean);
    const freq = {};
    terms.forEach((term) => { freq[term] = (freq[term] || 0) + 1; });
    return freq;
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
              <CheckCircle2 className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Final Processed Data</h1>
              <p className="text-sm text-gray-500 mt-1">
                Hasil akhir preprocessing: teks yang sudah melalui cleaning, casefolding, tokenization, normalization, stopword removal, dan stemming.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber data: <span className="font-semibold ml-1">/api/pengaduan</span>
                &nbsp;→ field <code>processed</code> (hasil preprocessing lengkap)
              </div>
            </div>
          </div>

          {/* Penjelasan */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Apa itu Final Processed?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl border-l-4 bg-gray-50" style={{ borderColor: "#2E7D32" }}>
                <p className="font-semibold text-gray-700 mb-2">📝 Tahap Preprocessing</p>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside leading-relaxed">
                  <li><strong>Cleaning:</strong> Hapus URL, mention, hashtag, emoji, special chars</li>
                  <li><strong>Casefolding:</strong> Ubah semua huruf jadi lowercase</li>
                  <li><strong>Tokenization:</strong> Pisahkan jadi kata-kata (token)</li>
                  <li><strong>Normalization:</strong> Perbaiki typo & slang (pake kamus alay)</li>
                  <li><strong>Stopword Removal:</strong> Buang kata umum (di, ke, dari, dll)</li>
                  <li><strong>Stemming:</strong> Ubah kata ke bentuk dasar (Sastrawi)</li>
                </ol>
              </div>
              <div className="p-4 rounded-xl border-l-4 bg-blue-50" style={{ borderColor: "#1976D2" }}>
                <p className="font-semibold text-blue-700 mb-2">🎯 Kenapa Penting?</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside leading-relaxed">
                  <li>Teks final processed ini yang masuk ke TF-IDF Vectorizer</li>
                  <li>Term frequency dihitung dari teks ini (bukan teks asli)</li>
                  <li>Model belajar dari teks bersih, bukan teks mentah</li>
                  <li>Kualitas preprocessing = kualitas model</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Daftar Data Pengaduan (Final Processed)</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {total.toLocaleString()} pengaduan · Klik "Lihat Detail" untuk melihat term frequency
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input placeholder="Cari deskripsi..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterKategori} onValueChange={handleKategori}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kategori</SelectItem>
                  <SelectItem value="KEAMANAN">KEAMANAN</SelectItem>
                  <SelectItem value="INFRASTRUKTUR">INFRASTRUKTUR</SelectItem>
                  <SelectItem value="LINGKUNGAN">LINGKUNGAN</SelectItem>
                  <SelectItem value="PELAYANAN">PELAYANAN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <p className="text-center text-gray-400 py-10">Memuat data...</p>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-red-500 font-semibold mb-2">❌ Gagal memuat data</p>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <div className="text-xs text-left max-w-xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-semibold text-red-800 mb-2">Troubleshooting:</p>
                  <ol className="list-decimal list-inside space-y-1 text-red-700">
                    <li>Pastikan backend server berjalan: <code className="bg-white px-1 rounded">cd backend && node server.js</code></li>
                    <li>Cek API endpoint: <a href="http://localhost:3001/api/pengaduan?page=1&limit=1" target="_blank" rel="noopener noreferrer" className="underline">Test API</a></li>
                    <li>Pastikan file data ada: <code className="bg-white px-1 rounded">data/processed/final_processed.json</code></li>
                    <li>Buka browser console (F12) untuk detail error</li>
                  </ol>
                </div>
              </div>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Tidak ada data yang cocok.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {items.map((item, idx) => {
                    const termFreq = getTermFrequency(item.processed);
                    const termList = Object.entries(termFreq).sort((a, b) => b[1] - a[1]);
                    const maxFreq = termList.length > 0 ? termList[0][1] : 1;
                    const isExpanded = expandedId === item._id;
                    const rank = (page - 1) * LIMIT + idx + 1;

                    return (
                      <div key={item._id} className="border rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-500">#{rank}</span>
                              <span className="font-semibold text-gray-800">{item.nama}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                item.kategori_prediksi === "KEAMANAN" ? "bg-red-100 text-red-700" :
                                item.kategori_prediksi === "INFRASTRUKTUR" ? "bg-blue-100 text-blue-700" :
                                item.kategori_prediksi === "LINGKUNGAN" ? "bg-green-100 text-green-700" :
                                "bg-purple-100 text-purple-700"
                              }`}>
                                {item.kategori_prediksi}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">No. WA: {item.no_wa}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleDetail(item)}
                            className="flex items-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            {isExpanded ? "Sembunyikan" : "Lihat Detail"}
                          </Button>
                        </div>

                        {/* Deskripsi Asli */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Deskripsi Asli (Input User):</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 leading-relaxed">
                            {item.deskripsi}
                          </p>
                        </div>

                        {/* Hasil Preprocessing */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-green-700 mb-1">📌 Final Processed Text (Setelah 6 Tahap Preprocessing):</p>
                          <p className="text-sm font-mono text-green-800 bg-green-50 p-3 rounded-lg border border-green-200 leading-relaxed">
                            {item.processed || "-"}
                          </p>
                        </div>

                        {/* Term Frequency + TF-IDF Detail (Expanded) */}
                        {isExpanded && (() => {
                          const kode = item.kode_pengaduan;
                          const termFreq = getTermFrequency(item.processed);
                          const termList = Object.entries(termFreq).sort((a, b) => b[1] - a[1]);
                          const maxFreq = termList.length > 0 ? termList[0][1] : 1;
                          const tfidfData = tfidfCache[kode];
                          const isLoadingTfidf = tfidfLoading[kode];
                          // Merge: pair each term with its TF-IDF weight
                          const tfidfEntries = tfidfData
                            ? Object.entries(tfidfData).sort((a, b) => b[1] - a[1])
                            : [];
                          const maxTfidf = tfidfEntries.length > 0 ? tfidfEntries[0][1] : 1;

                          return (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-5">
                              {/* Stats row */}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-gray-50 rounded-lg border text-center">
                                  <p className="text-xs text-gray-500">Unique Terms (TF)</p>
                                  <p className="text-2xl font-bold text-gray-800">{termList.length}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border text-center">
                                  <p className="text-xs text-gray-500">Total Tokens</p>
                                  <p className="text-2xl font-bold text-gray-800">
                                    {item.processed ? item.processed.split(/\s+/).filter(Boolean).length : 0}
                                  </p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg border text-center">
                                  <p className="text-xs text-green-700">Term TF-IDF Aktif</p>
                                  <p className="text-2xl font-bold text-green-700">
                                    {isLoadingTfidf ? "…" : tfidfEntries.length}
                                  </p>
                                </div>
                              </div>

                              {/* TF-IDF table from stage file */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Hash className="w-4 h-4 text-green-700" />
                                  <h3 className="font-semibold text-gray-800">Bobot TF-IDF per Term (dari tfidf.json)</h3>
                                  {kode && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-500">{kode}</span>}
                                </div>

                                {isLoadingTfidf ? (
                                  <p className="text-xs text-gray-400 italic">Memuat data TF-IDF…</p>
                                ) : tfidfData === null ? (
                                  <p className="text-xs text-red-400 italic">Data TF-IDF tidak tersedia untuk pengaduan ini.</p>
                                ) : tfidfEntries.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">Tidak ada term TF-IDF (teks kosong setelah preprocessing).</p>
                                ) : (
                                  <div className="overflow-x-auto rounded-xl border">
                                    <table className="w-full text-xs">
                                      <thead className="bg-green-50 text-green-800">
                                        <tr>
                                          <th className="p-2 text-left font-semibold w-8">#</th>
                                          <th className="p-2 text-left font-semibold">Term</th>
                                          <th className="p-2 text-left font-semibold w-48">Bobot TF-IDF</th>
                                          <th className="p-2 text-center font-semibold w-20">TF (Lokal)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {tfidfEntries.map(([term, score], ti) => {
                                          const pct = maxTfidf > 0 ? Math.min(100, (score / maxTfidf) * 100) : 0;
                                          const localTf = termFreq[term] ?? 0;
                                          return (
                                            <tr key={term} className={`border-t ${ti < 3 ? "bg-green-50/50" : "hover:bg-gray-50"}`}>
                                              <td className="p-2 text-gray-400">{ti + 1}</td>
                                              <td className="p-2 font-mono text-gray-800">
                                                {term}
                                                {ti < 3 && <span className="ml-1 text-[10px] text-green-600 font-bold">TOP</span>}
                                              </td>
                                              <td className="p-2">
                                                <div className="flex items-center gap-2">
                                                  <div className="flex-1 bg-gray-100 rounded-full h-3 min-w-24 relative">
                                                    <div className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                                                      style={{ width: `${pct}%` }} />
                                                  </div>
                                                  <span className="font-bold text-green-700 tabular-nums w-16 text-right">
                                                    {score.toFixed(6)}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="p-2 text-center text-gray-600 font-mono">
                                                {localTf > 0 ? localTf : <span className="text-gray-300">—</span>}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              {/* Local TF bar chart */}
                              {termList.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Hash className="w-4 h-4 text-blue-600" />
                                    <h3 className="font-semibold text-gray-800">Term Frequency Lokal (sebelum IDF)</h3>
                                  </div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {termList.map(([term, count]) => (
                                      <TermFrequencyBar key={term} term={term} count={count} maxCount={maxFreq} />
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                                <strong>Catatan:</strong> Kolom "TF-IDF" diambil dari <code>data/stages/tfidf.json</code> yang
                                dihitung saat training (TF×IDF dari seluruh corpus 1200 dokumen). Kolom "TF Lokal" adalah
                                frekuensi kemunculan dalam dokumen ini saja.
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-400">Halaman {page} dari {totalPages} · {total.toLocaleString()} pengaduan</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <Button key={p} variant={p === page ? "default" : "outline"} size="sm"
                          className={p === page ? "bg-green-700 text-white" : ""} onClick={() => setPage(p)}>
                          {p}
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="sm" disabled={page === totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Flow Diagram */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Flow: Dari Input User → Final Processed → TF-IDF</h2>
            <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
              {[
                { label: "Input User", desc: "Teks mentah", color: "bg-gray-100 text-gray-700" },
                { label: "Cleaning", desc: "Hapus noise", color: "bg-orange-100 text-orange-700" },
                { label: "Casefolding", desc: "Lowercase", color: "bg-yellow-100 text-yellow-700" },
                { label: "Tokenization", desc: "Split kata", color: "bg-green-100 text-green-700" },
                { label: "Normalization", desc: "Perbaiki typo", color: "bg-blue-100 text-blue-700" },
                { label: "Stopword Removal", desc: "Buang kata umum", color: "bg-purple-100 text-purple-700" },
                { label: "Stemming", desc: "Bentuk dasar", color: "bg-pink-100 text-pink-700" },
                { label: "Final Processed", desc: "✅ Siap TF-IDF", color: "bg-green-700 text-white font-bold" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`px-3 py-2 rounded-lg text-center min-w-28 ${step.color}`}>
                    <p className="font-semibold text-xs">{step.label}</p>
                    <p className="text-[10px] mt-0.5">{step.desc}</p>
                  </div>
                  {i < 7 && <span className="text-gray-400">→</span>}
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
