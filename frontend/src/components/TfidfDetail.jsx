import { useEffect, useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Filter, Search, ChevronLeft, ChevronRight, Hash, GitBranch, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

// ─── Stat Card (sama persis dengan Statistik.jsx) ───────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border-l-4" style={{ borderColor: accent || "#2E7D32" }}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Bar inline untuk visualisasi bobot ─────────────────────────────────────
function MiniBar({ value, max, color = "#2E7D32" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-16">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-600 tabular-nums w-14 text-right">{value.toFixed(5)}</span>
    </div>
  );
}

const LIMIT = 50;

export default function TfidfDetail({ onLogout }) {
  // ── Summary ──────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const [samples, setSamples] = useState([]);

  // ── Table state ──────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterNgram, setFilterNgram] = useState("semua");

  // max chi2 untuk mini-bar
  const [maxChi2, setMaxChi2] = useState(1);
  const [maxTfidf, setMaxTfidf] = useState(1);

  // ── Fetch table data ─────────────────────────────────────────────────────
  const fetchData = useCallback((p, search, status, ngram) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: p,
      limit: LIMIT,
      ...(search && { search }),
      ...(status !== "semua" && { status }),
      ...(ngram !== "semua" && { ngram }),
    });
    fetch(`/api/tfidf?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.summary) setSummary(res.summary);
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
        // hitung max untuk bar normalisasi
        const chi2Max = Math.max(...(res.items ?? []).map((t) => t.chi2_score), 1);
        const tfidfMax = Math.max(...(res.items ?? []).map((t) => t.tfidf_mean), 0.001);
        setMaxChi2(chi2Max);
        setMaxTfidf(tfidfMax);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Fetch samples ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/tfidf/samples")
      .then((r) => r.json())
      .then(setSamples)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData(page, searchTerm, filterStatus, filterNgram);
  }, [page, searchTerm, filterStatus, filterNgram, fetchData]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatus = (v) => {
    setFilterStatus(v);
    setPage(1);
  };
  const handleNgram = (v) => {
    setFilterNgram(v);
    setPage(1);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 ml-64">
        <Header />

        <main className="p-8 space-y-8">
          {/* ── Judul ── */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Detail TF-IDF</h1>
            <p className="text-sm text-gray-500 mt-1">
              Analisis mendalam proses TF-IDF Vectorizer dan SelectPercentile yang digunakan pada model Random Forest
            </p>
          </div>

          {/* ── Ringkasan Cards ── */}
          {summary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Jumlah Fitur (Sebelum Seleksi)"
                  value={(summary.fitur_tfidf ?? 0).toLocaleString()}
                  sub="Semua term dari TF-IDF vectorizer"
                  accent="#2E7D32"
                />
                <StatCard
                  label="Fitur Terpilih (SelectPercentile)"
                  value={(summary.fitur_selected ?? 0).toLocaleString()}
                  sub={`${(((summary.fitur_selected ?? 0) / (summary.fitur_tfidf || 1)) * 100).toFixed(1)}% dari total fitur`}
                  accent="#4CAF50"
                />
                <StatCard
                  label="N-gram Range"
                  value={summary.ngram_range ? `(${summary.ngram_range.join(", ")})` : "(1, 1)"}
                  sub="Unigram only"
                  accent="#81C784"
                />
                <StatCard
                  label="Total Data Training"
                  value={(summary.total_data ?? 0).toLocaleString()}
                  sub={`Train: ${summary.data_train} · Test: ${summary.data_test}`}
                  accent="#A5D6A7"
                />
              </div>

              {/* ── Info Breakdown ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TF-IDF Config */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="font-bold text-gray-800 mb-4">Konfigurasi TF-IDF Vectorizer</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">Total Term Diekstrak</span>
                      <span className="font-semibold text-green-700">{(summary.fitur_tfidf ?? 0).toLocaleString()} term</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">Unigram (1 kata)</span>
                      <span className="font-semibold text-green-700">{(summary.total_unigram ?? 0).toLocaleString()} term</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">N-gram Range</span>
                      <span className="font-semibold text-green-700">
                        {summary.ngram_range ? `(${summary.ngram_range.join(", ")})` : "(1, 1)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">min_df</span>
                      <span className="font-semibold text-green-700">2 dokumen</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500">max_df</span>
                      <span className="font-semibold text-green-700">0.95 (95% dokumen)</span>
                    </div>
                  </div>
                </div>

                {/* SelectPercentile */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="font-bold text-gray-800 mb-4">Seleksi Fitur — SelectPercentile (chi²)</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">Metode Seleksi</span>
                      <span className="font-semibold text-green-700">SelectPercentile chi-squared (χ²)</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">Fitur Terpilih</span>
                      <span className="font-semibold text-green-700">{(summary.fitur_selected ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">Fitur Tereliminasi</span>
                      <span className="font-semibold text-red-500">
                        {((summary.fitur_tfidf ?? 0) - (summary.fitur_selected ?? 0)).toLocaleString()} term
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">Persentase Terpilih</span>
                      <span className="font-semibold text-green-700">
                        {(((summary.fitur_selected ?? 0) / (summary.fitur_tfidf || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-500">Data Train</span>
                      <span className="font-semibold text-green-700">{summary.data_train} sampel (80%)</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500">Data Test</span>
                      <span className="font-semibold text-green-700">{summary.data_test} sampel (20%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Penjelasan Cara Kerja ── */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-bold text-gray-800 mb-4">Cara Kerja TF-IDF + SelectPercentile</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  {[
                    {
                      step: "1",
                      title: "Preprocessing",
                      desc: "Teks deskripsi diproses: cleaning → casefolding → tokenizing → normalisasi → stopword removal → stemming",
                      color: "#2E7D32",
                    },
                    {
                      step: "2",
                      title: "TF-IDF Vectorizer",
                      desc: `Teks diubah ke vektor numerik. TF = frekuensi term dalam dokumen. IDF = log(N/df). Menghasilkan ${(summary.fitur_tfidf ?? 0).toLocaleString()} fitur unigram.`,
                      color: "#4CAF50",
                    },
                    {
                      step: "3",
                      title: "SelectPercentile χ²",
                      desc: `Skor chi-squared dihitung untuk setiap fitur. ${(summary.fitur_selected ?? 0).toLocaleString()} fitur persentil tertinggi dipilih sebagai input model.`,
                      color: "#81C784",
                    },
                    {
                      step: "4",
                      title: "Random Forest",
                      desc: `Vektor ${(summary.fitur_selected ?? 0).toLocaleString()}-dimensi menjadi input pohon keputusan. Voting mayoritas menentukan kategori pengaduan.`,
                      color: "#A5D6A7",
                    },
                  ].map((item) => (
                    <div key={item.step} className="p-4 rounded-xl border-l-4 bg-gray-50" style={{ borderColor: item.color }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.step}
                        </span>
                        <span className="font-semibold text-gray-700">{item.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Tabel Term & Bobot TF-IDF ── */}
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Tabel Term &amp; Bobot TF-IDF</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Menampilkan {items.length} dari {total.toLocaleString()} term
                  {filterStatus !== "semua" ? ` · filter: ${filterStatus}` : ""}
                  {filterNgram !== "semua" ? ` · ${filterNgram}` : ""}
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 my-5">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari term atau frasa..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={handleStatus}>
                <SelectTrigger className="w-44">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Status</SelectItem>
                  <SelectItem value="terpilih">Terpilih (SelectPercentile)</SelectItem>
                  <SelectItem value="eliminasi">Tereliminasi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterNgram} onValueChange={handleNgram}>
                <SelectTrigger className="w-40">
                  <Hash className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipe Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Tipe</SelectItem>
                  <SelectItem value="unigram">Unigram (1 kata)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <p className="text-center text-gray-400 py-10">Memuat data...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Tidak ada term yang cocok.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100 text-green-900">
                      <tr>
                        <th className="p-3 text-left font-semibold w-8">#</th>
                        <th className="p-3 text-left font-semibold">Term</th>
                        <th className="p-3 text-center font-semibold w-28">Tipe</th>
                        <th className="p-3 text-left font-semibold">Bobot TF-IDF Rata-rata</th>
                        <th className="p-3 text-left font-semibold">Skor SelectPercentile (χ²)</th>
                        <th className="p-3 text-center font-semibold w-36">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((term, idx) => (
                        <tr key={`${term.term}-${idx}`} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-400 tabular-nums">{(page - 1) * LIMIT + idx + 1}</td>
                          <td className="p-3 font-mono text-gray-800 font-medium">{term.term}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                              <Hash className="w-3 h-3" /> Unigram
                            </span>
                          </td>
                          <td className="p-3 min-w-48">
                            <MiniBar value={term.tfidf_mean} max={maxTfidf} color="#4CAF50" />
                          </td>
                          <td className="p-3 min-w-48">
                            <MiniBar value={term.chi2_score} max={maxChi2} color="#2E7D32" />
                          </td>
                          <td className="p-3 text-center">
                            {term.selected ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Terpilih
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 font-medium">
                                <XCircle className="w-3 h-3" /> Eliminasi
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-400">
                    Halaman {page} dari {totalPages} · {total.toLocaleString()} term
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    {/* Quick page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          className={p === page ? "bg-green-700 text-white" : ""}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages || loading}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Contoh Dokumen Ter-vektorisasi ── */}
          {samples.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Contoh Dokumen Ter-vektorisasi</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Menampilkan pasangan [Term : Nilai TF-IDF] yang dihasilkan dari dokumen sampel setelah preprocessing
                </p>
              </div>

              {samples.map((doc, di) => (
                <div key={di} className="bg-white rounded-2xl shadow p-6">
                  {/* Header dokumen */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400">DOKUMEN {di + 1}</span>
                        <Badge className="bg-[#2E7D32] text-white text-xs">{doc.kategori}</Badge>
                        {doc.label_asli && doc.label_asli !== "-" && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Label asli: {doc.label_asli}
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-gray-700">{doc.nama}</p>
                    </div>
                    <span className="text-xs text-gray-400">{doc.terms.length} term aktif</span>
                  </div>

                  {/* 3-step pipeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="p-3 bg-gray-50 border rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 mb-2">① Teks Asli (Deskripsi)</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{doc.deskripsi}</p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs font-semibold text-green-700 mb-2">② Hasil Preprocessing (Stemmed)</p>
                      <p className="text-sm text-gray-700 font-mono leading-relaxed">{doc.processed}</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs font-semibold text-blue-700 mb-2">③ Jumlah Term Aktif</p>
                      <p className="text-3xl font-bold text-blue-700">{doc.terms.length}</p>
                      <p className="text-xs text-gray-400 mt-1">dari {summary?.fitur_selected ?? 1000} fitur terpilih</p>
                    </div>
                  </div>

                  {/* Term : TF-IDF table */}
                  <p className="text-xs font-semibold text-gray-500 mb-3">
                    Pasangan Term : Nilai TF-IDF (top {doc.terms.length} term, urut bobot terbesar)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {doc.terms.map(([term, score], ti) => {
                      const isTop3 = ti < 3;
                      return (
                        <div
                          key={ti}
                          className={`p-2 rounded-lg border text-xs ${
                            isTop3 ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <p className={`font-mono font-semibold truncate ${isTop3 ? "text-green-800" : "text-gray-700"}`}>
                            {term}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-1 mr-2">
                              <div
                                className={`h-1 rounded-full ${isTop3 ? "bg-green-500" : "bg-gray-400"}`}
                                style={{
                                  width: `${Math.min(100, (score / (doc.terms[0]?.[1] || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className={`tabular-nums font-bold ${isTop3 ? "text-green-700" : "text-gray-500"}`}>
                              {score.toFixed(4)}
                            </span>
                          </div>
                          {ti < 3 && <span className="text-green-600 text-[10px] font-semibold">#{ti + 1} bobot tertinggi</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
