import { useEffect, useState, useCallback } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { Hash, GitBranch, Search, ChevronLeft, ChevronRight, Info, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";

const LIMIT = 50;

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

export default function EkstraksiTermTokenisasi({ onLogout }) {
  const [items, setItems]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm]   = useState("");
  const [filterNgram, setFilterNgram] = useState("semua");
  const [maxTfidf, setMaxTfidf]   = useState(1);

  const fetchData = useCallback((p, search, ngram) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: p,
      limit: LIMIT,
      ...(search && { search }),
      ...(ngram !== "semua" && { ngram }),
    });
    fetch(`/api/tfidf?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
        const tMax = Math.max(...(res.items ?? []).map((t) => t.tfidf_mean), 0.001);
        setMaxTfidf(tMax);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
              <Hash className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Term &amp; Tokenisasi</h1>
              <p className="text-sm text-gray-500 mt-1">
                Daftar seluruh term hasil tokenisasi TF-IDF beserta tipe n-gram dan bobot TF-IDF rata-rata.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber data: <span className="font-semibold ml-1">/api/tfidf</span>
                &nbsp;→ field <code>items[]</code>
              </div>
            </div>
          </div>

          {/* Penjelasan singkat tokenisasi */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-3">Proses Tokenisasi dalam TF-IDF</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {[
                { step: "1", title: "Teks Masuk", desc: "Teks sudah melalui preprocessing (cleaning, casefolding, normalisasi, stopword removal, stemming).", color: "#2E7D32" },
                { step: "2", title: "Tokenisasi", desc: "Sklearn TfidfVectorizer memecah teks menjadi token 1-kata (unigram) dan 2-kata (bigram) sesuai n-gram range (1,2).", color: "#4CAF50" },
                { step: "3", title: "Pembobotan", desc: "Setiap token diberi bobot TF-IDF. TF = frekuensi dalam dokumen, IDF = log(N/df+1). Nilai akhir = TF × IDF.", color: "#81C784" },
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

          {/* Tabel Term */}
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Daftar Term &amp; Bobot TF-IDF</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {items.length} dari {total.toLocaleString()} term
                  {filterNgram !== "semua" ? ` · filter: ${filterNgram}` : ""}
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
                        <th className="p-3 text-center font-semibold w-28">Tipe N-gram</th>
                        <th className="p-3 text-left font-semibold">Bobot TF-IDF Rata-rata</th>
                        <th className="p-3 text-center font-semibold w-32">Status Seleksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((term, idx) => (
                        <tr key={`${term.term}-${idx}`} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-400 tabular-nums">{(page - 1) * LIMIT + idx + 1}</td>
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
                          <td className="p-3 min-w-48">
                            <MiniBar value={term.tfidf_mean} max={maxTfidf} color="#4CAF50" />
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

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-400">Halaman {page} dari {totalPages} · {total.toLocaleString()} term</p>
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
        </main>
      </div>
    </div>
  );
}
