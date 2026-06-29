import { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { Star, Info, ChevronLeft, ChevronRight, Search, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const LIMIT = 50;

function MiniBar({ value, max, color = "#2E7D32" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-16">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-600 tabular-nums w-16 text-right">{value.toFixed(4)}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-6 rounded-full bg-[#2E7D32]" />
      <h2 className="text-base font-bold text-gray-800">{children}</h2>
    </div>
  );
}

export default function EkstraksiSeleksiFitur({ onLogout }) {
  const [summary, setSummary]     = useState(null);
  const [items, setItems]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm]   = useState("");
  const [maxChi2, setMaxChi2]     = useState(1);

  // Hanya tampilkan fitur yang TERPILIH di halaman ini
  const fetchData = useCallback((p, search) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: p,
      limit: LIMIT,
      status: "terpilih",
      sort: "df_desc",   // urutkan dari chi2 tertinggi agar halaman 1 = nilai max
      ...(search && { search }),
    });
    fetch(`/api/tfidf?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.summary) setSummary(res.summary);
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
        // Ambil max chi2 dari halaman 1 (sudah diurutkan descending)
        if (p === 1 && !search) {
          const chi2Max = Math.max(...(res.items ?? []).map((t) => t.chi2_score), 1);
          setMaxChi2(chi2Max);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(page, searchTerm); }, [page, searchTerm, fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">
          {/* Judul */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Seleksi Fitur &amp; Metode</h1>
              <p className="text-sm text-gray-500 mt-1">
                Output SelectPercentile dengan metode Chi-squared (χ²) — hanya menampilkan fitur yang terpilih masuk ke model Random Forest.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber data: <span className="font-semibold ml-1">/api/tfidf?status=terpilih</span>
                &nbsp;→ <code>items[].chi2_score</code>
              </div>
            </div>
          </div>

          {/* Penjelasan Metode */}
          <div className="bg-white rounded-2xl shadow p-6">
            <SectionLabel>Metode Seleksi: SelectPercentile + Chi-squared (χ²)</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <p className="text-gray-600 leading-relaxed">
                  <strong>SelectPercentile</strong> dari scikit-learn memilih persentase fitur terbaik berdasarkan skor statistik terhadap label kelas (dalam sistem ini dipilih 80% fitur terbaik).
                  Metode scoring yang digunakan adalah <strong>chi-squared (χ²)</strong>.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Skor χ² mengukur ketergantungan statistik antara kemunculan suatu term dengan label kategori pengaduan.
                  Term dengan skor χ² tinggi berarti kemunculannya berkorelasi kuat dengan kategori tertentu.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Rumus: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">χ² = Σ (O − E)² / E</code>&nbsp;
                  di mana O = frekuensi observasi, E = frekuensi harapan.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Library",              value: "sklearn.feature_selection.SelectPercentile" },
                  { label: "Fungsi Scoring",       value: "chi2 (chi-squared)" },
                  { label: "Persentil",            value: "80%" },
                  { label: "Jumlah Fitur Terpilih", value: (summary?.fitur_selected ?? "–").toLocaleString() },
                  { label: "Total Kandidat (n)",   value: (summary?.fitur_tfidf    ?? "–").toLocaleString() },
                  { label: "Data Fit",             value: `${summary?.data_train ?? "–"} sampel (train set)` },
                  { label: "Output",               value: "Matriks X berukuran (n_docs × fitur terpilih)" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b last:border-0">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-semibold text-gray-800 text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ringkasan output */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Fitur Kandidat",        value: (summary.fitur_tfidf    ?? 0).toLocaleString(), color: "#9E9E9E" },
                { label: "Fitur Terpilih (k)",    value: (summary.fitur_selected ?? 0).toLocaleString(), color: "#2E7D32" },
                { label: "Fitur Tereliminasi",    value: ((summary.fitur_tfidf ?? 0) - (summary.fitur_selected ?? 0)).toLocaleString(), color: "#E53935" },
                { label: "Persentase Terpilih",   value: `${(((summary.fitur_selected ?? 0) / (summary.fitur_tfidf || 1)) * 100).toFixed(1)}%`, color: "#1565C0" },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-2xl shadow p-5 border-l-4" style={{ borderColor: card.color }}>
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabel Fitur Terpilih */}
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Fitur Terpilih beserta Skor χ²</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {items.length} dari {total.toLocaleString()} fitur terpilih · diurutkan skor χ² tertinggi
                </p>
              </div>
            </div>

            <div className="flex gap-3 my-5">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input placeholder="Cari term..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
              </div>
            </div>

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
                        <th className="p-3 text-left font-semibold">Skor χ² (Chi-squared)</th>
                        <th className="p-3 text-left font-semibold">Bobot TF-IDF Rata-rata</th>
                        <th className="p-3 text-center font-semibold w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((term, idx) => (
                        <tr key={`${term.term}-${idx}`} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-400 tabular-nums">{(page - 1) * LIMIT + idx + 1}</td>
                          <td className="p-3 font-mono text-gray-800 font-medium">{term.term}</td>
                          <td className="p-3 min-w-52">
                            <MiniBar value={term.chi2_score} max={maxChi2} color="#2E7D32" />
                          </td>
                          <td className="p-3 min-w-48">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-[#4CAF50]" style={{ width: `${Math.min(100, term.tfidf_mean * 1000)}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 tabular-nums w-14 text-right">{term.tfidf_mean.toFixed(5)}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Terpilih
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-400">Halaman {page} dari {totalPages} · {total.toLocaleString()} fitur</p>
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

          {/* Catatan tentang input ke Random Forest */}
          <div className="bg-white rounded-2xl shadow p-6">
            <SectionLabel>Output Seleksi → Input Random Forest</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {[
                { step: "A", title: "Sebelum Seleksi", desc: `Matriks TF-IDF berukuran (n_docs × ${(summary?.fitur_tfidf ?? "–").toLocaleString()}) fitur`, color: "#9E9E9E" },
                { step: "B", title: "Setelah SelectPercentile", desc: `Matriks diciutkan menjadi (n_docs × ${(summary?.fitur_selected ?? "–").toLocaleString()}) fitur terpilih`, color: "#2E7D32" },
                { step: "C", title: "Input Random Forest", desc: `Vektor ${(summary?.fitur_selected ?? "–").toLocaleString()}-dimensi menjadi X_train / X_test untuk 500 pohon keputusan`, color: "#1565C0" },
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-xl border-l-4 bg-gray-50" style={{ borderColor: item.color }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: item.color }}>
                      {item.step}
                    </span>
                    <span className="font-semibold text-gray-700">{item.title}</span>
                  </div>
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
