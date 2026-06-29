import { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { PieChart, Database, Layers, Hash, GitBranch, Info } from "lucide-react";

function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div
      className="bg-white/80 backdrop-blur rounded-2xl shadow p-6 border-l-4 flex gap-4 items-start"
      style={{ borderColor: accent || "#2E7D32" }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-1 leading-tight">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
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

export default function EkstraksiStatistik({ onLogout }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil dari endpoint TF-IDF yang sudah ada (page 1, limit 1 — kita butuh summary saja)
    fetch("/api/tfidf?page=1&limit=1")
      .then((r) => r.json())
      .then((res) => {
        setSummary(res.summary ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pctSelected = summary
    ? (((summary.fitur_selected ?? 0) / (summary.fitur_tfidf || 1)) * 100).toFixed(1)
    : "0";
  const pctElim = summary
    ? ((((summary.fitur_tfidf ?? 0) - (summary.fitur_selected ?? 0)) / (summary.fitur_tfidf || 1)) * 100).toFixed(1)
    : "0";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">
          {/* Judul */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <PieChart className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Statistik Keseluruhan TF-IDF</h1>
              <p className="text-sm text-gray-500 mt-1">
                Ringkasan angka dari seluruh proses TF-IDF Vectorizer yang dijalankan pada data training.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber data: <span className="font-semibold ml-1">/api/tfidf</span>
                &nbsp;→ field <code>summary</code>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Memuat statistik...</div>
          ) : !summary ? (
            <div className="text-center py-20 text-red-400">Gagal memuat data. Pastikan backend berjalan.</div>
          ) : (
            <>
              {/* ── 4 kartu utama ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Fitur TF-IDF"
                  value={(summary.fitur_tfidf ?? 0).toLocaleString()}
                  sub="Sebelum seleksi fitur"
                  accent="#2E7D32"
                  icon={Layers}
                />
                <StatCard
                  label="Fitur Terpilih (SelectPercentile)"
                  value={(summary.fitur_selected ?? 0).toLocaleString()}
                  sub={`${pctSelected}% dari total fitur`}
                  accent="#4CAF50"
                  icon={Hash}
                />
                <StatCard
                  label="Unigram"
                  value={(summary.total_unigram ?? 0).toLocaleString()}
                  sub="1 kata"
                  accent="#81C784"
                  icon={Hash}
                />
                <StatCard
                  label="Bigram"
                  value={(summary.total_bigram ?? 0).toLocaleString()}
                  sub="2 kata"
                  accent="#388E3C"
                  icon={GitBranch}
                />
              </div>

              {/* ── Data split ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Total Data Training"
                  value={(summary.total_data ?? 0).toLocaleString()}
                  sub="Total dokumen"
                  accent="#1565C0"
                  icon={Database}
                />
                <StatCard
                  label="Data Train (80%)"
                  value={summary.data_train ?? "-"}
                  sub="Digunakan untuk fit TF-IDF"
                  accent="#1976D2"
                  icon={Database}
                />
                <StatCard
                  label="Data Test (20%)"
                  value={summary.data_test ?? "-"}
                  sub="Transformasi saja, tanpa fit"
                  accent="#42A5F5"
                  icon={Database}
                />
              </div>

              {/* ── Proporsi visual ── */}
              <div className="bg-white rounded-2xl shadow p-6">
                <SectionLabel>Proporsi Fitur: Terpilih vs Tereliminasi</SectionLabel>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#2E7D32] flex items-center justify-center text-white text-xs font-bold transition-all"
                      style={{ width: `${pctSelected}%` }}
                    >
                      {pctSelected}%
                    </div>
                    <div
                      className="h-full bg-red-300 flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${pctElim}%` }}
                    >
                      {pctElim}%
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#2E7D32]" />
                    <span className="text-gray-600">Terpilih — {(summary.fitur_selected ?? 0).toLocaleString()} term</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-300" />
                    <span className="text-gray-600">
                      Tereliminasi — {((summary.fitur_tfidf ?? 0) - (summary.fitur_selected ?? 0)).toLocaleString()} term
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Konfigurasi ringkas ── */}
              <div className="bg-white rounded-2xl shadow p-6">
                <SectionLabel>Parameter Konfigurasi Vektorizer</SectionLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {[
                    { label: "N-gram Range",     value: summary.ngram_range ? `(${summary.ngram_range.join(", ")})` : "(1, 2)" },
                    { label: "min_df",            value: "2 dokumen" },
                    { label: "max_df",            value: "0.95 (95%)" },
                    { label: "Metode Seleksi",    value: "Chi-squared (χ²)" },
                    { label: "Seleksi (SelectPercentile)", value: "80% (" + (summary.fitur_selected ?? 0).toLocaleString() + " fitur)" },
                    { label: "Analizer",          value: "word" },
                  ].map((row) => (
                    <div key={row.label} className="p-4 rounded-xl bg-gray-50 border">
                      <p className="text-xs text-gray-500 mb-1">{row.label}</p>
                      <p className="font-semibold text-gray-800">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
