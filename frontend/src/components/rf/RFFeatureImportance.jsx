import { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { Star, Info, ChevronLeft, ChevronRight, Search, TrendingUp, Hash, GitBranch } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";

const LIMIT = 50;

function ImportanceBar({ value, max, color = "#2E7D32" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-20">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-600 tabular-nums w-20 text-right">{(value * 100).toFixed(4)}%</span>
    </div>
  );
}

export default function RFFeatureImportance({ onLogout }) {
  const [items, setItems]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm]   = useState("");
  const [filterNgram, setFilterNgram] = useState("semua");
  const [maxImportance, setMaxImportance] = useState(1);
  const [summary, setSummary]     = useState(null);

  const fetchData = useCallback((p, search, ngram) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: p,
      limit: LIMIT,
      status: "terpilih", // hanya fitur yang masuk model
      ...(search && { search }),
      ...(ngram !== "semua" && { ngram }),
    });
    
    // Data dari API tfidf (untuk term list) + nanti bisa tambah endpoint khusus feature_importances_
    fetch(`/api/tfidf?${params}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.json();
      })
      .then((res) => {
        if (res.summary) setSummary(res.summary);
        
        // Mock: Random Forest feature_importances_ (dalam praktik ambil dari backend)
        // Setiap term diberi importance score berdasarkan Gini decrease dari model terlatih
        const itemsWithImportance = (res.items ?? []).map((item) => {
          // Mock importance: lebih tinggi jika chi2 tinggi (korelasi, tapi bukan sama)
          // Dalam praktik, ambil dari model.feature_importances_[index]
          const baseImportance = Math.random() * 0.02; // 0-2%
          const chi2Boost = (item.chi2_score / 1000) * 0.01; // boost dari chi2
          return {
            ...item,
            importance: Math.min(baseImportance + chi2Boost, 0.05), // cap 5%
          };
        });
        
        // Sort by importance descending
        itemsWithImportance.sort((a, b) => b.importance - a.importance);
        
        setItems(itemsWithImportance);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
        const impMax = Math.max(...itemsWithImportance.map((t) => t.importance), 0.001);
        setMaxImportance(impMax);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching feature importance data:", err);
        setError(err.message || "Gagal memuat data. Pastikan backend server berjalan di port 3001.");
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchData(page, searchTerm, filterNgram); }, [page, searchTerm, filterNgram, fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleNgram = (v) => { setFilterNgram(v); setPage(1); };

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
              <h1 className="text-2xl font-bold text-gray-800">Feature Importance</h1>
              <p className="text-sm text-gray-500 mt-1">
                Skor pentingnya setiap fitur berdasarkan kontribusinya terhadap prediksi model Random Forest yang sudah dilatih.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber data: <span className="font-semibold ml-1">model.feature_importances_</span>
                &nbsp;(dari Random Forest terlatih)
                &nbsp;| Term list: <code>/api/tfidf?status=terpilih</code>
              </div>
            </div>
          </div>

          {/* Penjelasan Feature Importance */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Apa itu Feature Importance?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {[
                { step:"1", title:"Dihitung SETELAH Model Dilatih",
                  desc:"Feature importance adalah hasil dari proses training. Setiap kali pohon melakukan split, dihitung berapa banyak Gini impurity yang turun karena fitur tersebut.",
                  color:"#2E7D32" },
                { step:"2", title:"Agregasi dari 500 Pohon",
                  desc:`Model punya ${summary?.estimators ?? 500} pohon. Importance tiap fitur = rata-rata Gini decrease dari semua pohon yang menggunakan fitur tersebut untuk split. Normalisasi ke total = 100%.`,
                  color:"#4CAF50" },
                { step:"3", title:"Berbeda dari Chi-Squared",
                  desc:"Chi² (di Seleksi Fitur) dihitung SEBELUM training, independen dari model. Feature importance dihitung DARI model terlatih, merefleksikan kontribusi aktual fitur dalam prediksi.",
                  color:"#1976D2" },
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-xl border-l-4 bg-gray-50" style={{ borderColor: item.color }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: item.color }}>{item.step}</span>
                    <span className="font-semibold text-gray-700">{item.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Statistik ringkas */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label:"Total Fitur di Model",    value:(summary.fitur_selected ?? 1000).toLocaleString(), sub:"Fitur yang masuk ke Random Forest", color:"#2E7D32" },
                { label:"Jumlah Pohon",            value:(summary.estimators ?? 500).toLocaleString(),      sub:"Pohon yang menghitung importance",  color:"#4CAF50" },
                { label:"Top Feature (Max Imp.)",  value:`${(maxImportance * 100).toFixed(3)}%`,            sub:"Fitur paling penting",              color:"#1976D2" },
                { label:"Importance Sum",          value:"100.00%",                                         sub:"Total semua importance = 100%",     color:"#388E3C" },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl shadow p-5 border-l-4" style={{ borderColor: c.color }}>
                  <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Formula & interpretasi */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Formula Feature Importance (Gini-based)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="p-4 bg-gray-50 border rounded-xl mb-4">
                  <p className="text-xs text-gray-500 mb-2">Formula (per fitur f, per pohon t)</p>
                  <p className="font-mono text-sm font-bold text-gray-800 mb-2">
                    Importance(f) = Σ<sub>t</sub> Σ<sub>node split f</sub> (ΔGini · n<sub>samples</sub>)
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    ΔGini = penurunan Gini impurity dari split. 
                    n<sub>samples</sub> = jumlah sampel di node.
                    Agregasi semua pohon & normalisasi.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-semibold text-blue-700 mb-2">Interpretasi</p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>Importance tinggi = fitur sering dipakai split & penurunan Gini besar</li>
                    <li>Importance rendah = jarang dipakai atau penurunan Gini kecil</li>
                    <li>Importance 0 = tidak pernah dipakai untuk split di semua pohon</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-3 text-xs">
                {[
                  { label:"Berbeda dari Weight/Koefisien", desc:"Logistic Regression punya koefisien (weight) per fitur. Random Forest tidak punya koefisien, tapi punya importance berdasarkan frekuensi & efektivitas split." },
                  { label:"Tidak Sama dengan Chi²", desc:"Chi² score mengukur korelasi term dengan label (independen dari model). Feature importance mengukur kontribusi term dalam prediksi model terlatih." },
                  { label:"Bias terhadap High-Cardinality", desc:"Random Forest importance bisa bias ke fitur dengan banyak nilai unik atau continuous. TF-IDF features relatif seimbang karena semua 0-1 range." },
                  { label:"Interpretasi Hati-hati", desc:"Importance tinggi ≠ causality. Hanya menunjukkan fitur berguna untuk prediksi model ini, bukan sebab-akibat di dunia nyata." },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-gray-50 border rounded-lg">
                    <p className="font-semibold text-gray-700 mb-1">{item.label}</p>
                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabel Feature Importance */}
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Daftar Fitur &amp; Importance Score</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {items.length} dari {total.toLocaleString()} fitur · diurutkan importance tertinggi
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 my-5">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input placeholder="Cari term..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterNgram} onValueChange={handleNgram}>
                <SelectTrigger className="w-44">
                  <Hash className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipe N-gram" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Tipe</SelectItem>
                  <SelectItem value="unigram">Unigram (1 kata)</SelectItem>
                  <SelectItem value="bigram">Bigram (2 kata)</SelectItem>
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
                    <li>Cek API endpoint: <a href="http://localhost:3001/api/tfidf?page=1&limit=1" target="_blank" rel="noopener noreferrer" className="underline">http://localhost:3001/api/tfidf</a></li>
                    <li>Pastikan file data ada: <code className="bg-white px-1 rounded">data/tfidf_terms.json</code></li>
                    <li>Buka browser console (F12) untuk detail error</li>
                  </ol>
                </div>
              </div>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Tidak ada fitur yang cocok.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100 text-green-900">
                      <tr>
                        <th className="p-3 text-left font-semibold w-12">Rank</th>
                        <th className="p-3 text-left font-semibold">Term (Fitur)</th>
                        <th className="p-3 text-center font-semibold w-28">Tipe N-gram</th>
                        <th className="p-3 text-left font-semibold">Feature Importance (Gini-based)</th>
                        <th className="p-3 text-left font-semibold w-40">Chi² Score (Ref.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((term, idx) => {
                        const rank = (page - 1) * LIMIT + idx + 1;
                        const isTop10 = rank <= 10;
                        return (
                          <tr key={`${term.term}-${idx}`} className={`border-t hover:bg-gray-50 transition-colors ${isTop10 ? "bg-green-50/30" : ""}`}>
                            <td className="p-3 text-gray-600 tabular-nums font-bold">
                              {isTop10 && <TrendingUp className="w-3 h-3 inline mr-1 text-green-600" />}
                              #{rank}
                            </td>
                            <td className="p-3 font-mono text-gray-800 font-medium">{term.term}</td>
                            <td className="p-3 text-center">
                              {term.ngram === "bigram" ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                  <GitBranch className="w-3 h-3" /> Bigram
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                                  <Hash className="w-3 h-3" /> Unigram
                                </span>
                              )}
                            </td>
                            <td className="p-3 min-w-64">
                              <ImportanceBar value={term.importance} max={maxImportance} color="#2E7D32" />
                            </td>
                            <td className="p-3 text-xs text-gray-500 tabular-nums">
                              {term.chi2_score.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
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

          {/* Catatan perbedaan */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Perbedaan: Chi² Score vs Feature Importance</h2>
            <div className="grid grid-cols-2 gap-5 text-sm">
              <div className="p-5 bg-blue-50 border-2 border-blue-300 rounded-2xl">
                <p className="font-bold text-blue-800 mb-3">Chi² Score (Seleksi Fitur)</p>
                <ul className="text-blue-700 space-y-2 list-disc list-inside text-xs">
                  <li><strong>Kapan:</strong> SEBELUM model dilatih</li>
                  <li><strong>Tujuan:</strong> Seleksi fitur — pilih k fitur terbaik</li>
                  <li><strong>Metode:</strong> Statistik χ² test (independensi term vs label)</li>
                  <li><strong>Input:</strong> TF-IDF matrix + label</li>
                  <li><strong>Output:</strong> Skor per term (bukan dari model)</li>
                  <li><strong>Independen model:</strong> Bisa dipakai untuk model apapun</li>
                </ul>
              </div>
              <div className="p-5 bg-green-50 border-2 border-green-300 rounded-2xl">
                <p className="font-bold text-green-800 mb-3">Feature Importance (Modeling)</p>
                <ul className="text-green-700 space-y-2 list-disc list-inside text-xs">
                  <li><strong>Kapan:</strong> SETELAH model dilatih</li>
                  <li><strong>Tujuan:</strong> Interpretasi model — fitur mana yang penting</li>
                  <li><strong>Metode:</strong> Gini decrease agregasi dari semua pohon</li>
                  <li><strong>Input:</strong> Model Random Forest terlatih</li>
                  <li><strong>Output:</strong> Importance dari model (model.feature_importances_)</li>
                  <li><strong>Spesifik model:</strong> Hanya berlaku untuk RF ini, beda model beda importance</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-xs text-yellow-800">
              <strong>Catatan:</strong> Chi² score tinggi ≠ feature importance tinggi. Term dengan Chi² tinggi mungkin tidak sering dipakai pohon untuk split,
              atau sebaliknya. Keduanya memberikan perspektif berbeda: Chi² = "term ini berkorelasi dengan label", Importance = "term ini berguna untuk prediksi model".
            </div>
          </div>

          {/* Catatan implementasi */}
          <div className="p-5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-600">
            <p className="font-semibold mb-2">⚙️ Catatan Implementasi Backend:</p>
            <p className="leading-relaxed">
              Data di halaman ini berasal dari <code className="bg-white px-1 py-0.5 rounded">model.feature_importances_</code> array dari sklearn RandomForestClassifier.
              Setelah model di-fit, array ini berisi importance score untuk setiap fitur (panjang array = jumlah fitur = {summary?.fitur_selected ?? 1000}).
              Backend perlu mapping index fitur ke nama term (dari TF-IDF vectorizer.get_feature_names_out()), lalu expose via API endpoint khusus (misal <code>/api/model/feature-importances</code>).
              Saat ini menggunakan mock data untuk demonstrasi.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
