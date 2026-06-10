import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORY_COLORS = {
  INFRASTRUKTUR: "#2E7D32",
  LINGKUNGAN: "#4CAF50",
  KEAMANAN: "#A5D6A7",
  PELAYANAN: "#81C784",
};

const CAT_LABEL = {
  INFRASTRUKTUR: "Infrastruktur",
  LINGKUNGAN: "Lingkungan",
  KEAMANAN: "Keamanan",
  PELAYANAN: "Pelayanan",
};

function InfoCard({ label, value, sub, accent, small }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow border-l-4" style={{ borderColor: accent || "#2E7D32" }}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold text-gray-800 ${small ? "text-lg" : "text-3xl"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats")
        .then((r) => r.json())
        .catch(() => null),
      fetch("/api/evaluasi")
        .then((r) => r.json())
        .catch(() => null),
    ]).then(([s, t]) => {
      setStats(s);
      setTraining(t);
      setLoading(false);
    });
  }, []);

  const categoryData = stats
    ? Object.entries(stats.kategori).map(([name, value]) => ({
        name: CAT_LABEL[name] ?? name.charAt(0) + name.slice(1).toLowerCase(),
        value,
        color: CATEGORY_COLORS[name] || "#ccc",
      }))
    : [];

  const weeklyData = stats ? stats.weeklyData.map((jumlah, i) => ({ week: `Minggu ${i + 1}`, jumlah })) : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
        <Header />

        <main className="p-8 space-y-8">
          {loading ? (
            <p className="text-gray-500">Memuat data...</p>
          ) : (
            <>
              {/* ── Statistik Pengaduan ── */}
              <div>
                <h2 className="text-lg font-bold text-gray-700 mb-3">Ringkasan Pengaduan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoCard label="Total Pengaduan" value={stats?.total ?? "-"} sub="Semua data terdaftar" accent="#2E7D32" />
                  <InfoCard
                    label="Baru 3 Hari Terakhir"
                    value={stats?.baru3Hari ?? "-"}
                    sub="Berdasarkan timestamp"
                    accent="#4CAF50"
                  />
                  <InfoCard
                    label="Baru 7 Hari Terakhir"
                    value={stats?.baru7Hari ?? "-"}
                    sub="Berdasarkan timestamp"
                    accent="#81C784"
                  />
                  <InfoCard
                    label="Kategori Terbanyak"
                    value={stats?.kategoriTerbanyak ? (CAT_LABEL[stats.kategoriTerbanyak] ?? stats.kategoriTerbanyak) : "-"}
                    sub={stats?.kategoriTerbanyak ? `${stats.kategori[stats.kategoriTerbanyak] ?? 0} pengaduan` : ""}
                    accent="#A5D6A7"
                    small
                  />
                </div>
              </div>

              {/* ── Info Model ── */}
              {training && (
                <div>
                  <h2 className="text-lg font-bold text-gray-700 mb-3">Performa Model</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoCard
                      label="Akurasi Model"
                      value={`${((training.akurasi ?? 0) * 100).toFixed(1)}%`}
                      sub="Data test (80:20 split)"
                      accent="#2E7D32"
                    />
                    <InfoCard
                      label="F1-Score (Weighted)"
                      value={`${((training.f1_score ?? 0) * 100).toFixed(1)}%`}
                      sub="Harmonic mean P & R"
                      accent="#4CAF50"
                    />
                    <InfoCard
                      label="Cross Validation 5-Fold"
                      value={`${((training.cv_mean ?? 0) * 100).toFixed(1)}%`}
                      sub={`± ${((training.cv_std ?? 0) * 100).toFixed(1)}% std`}
                      accent="#81C784"
                    />
                    <InfoCard
                      label="OOB Score"
                      value={`${((training.oob_score ?? 0) * 100).toFixed(1)}%`}
                      sub="Out-of-bag estimate"
                      accent="#A5D6A7"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <InfoCard
                      label="Data Training / Test"
                      value={`${training.data_train ?? "-"} / ${training.data_test ?? "-"}`}
                      sub={`Total ${training.total_data ?? "-"} data`}
                      accent="#2E7D32"
                    />
                    <InfoCard
                      label="Fitur TF-IDF (Bigram)"
                      value={(training.fitur_tfidf ?? 0).toLocaleString()}
                      sub={`Dipilih: ${(training.fitur_selected ?? 0).toLocaleString()} fitur`}
                      accent="#4CAF50"
                    />
                    <InfoCard
                      label="Estimator (Pohon)"
                      value={training.estimators ?? 500}
                      sub="Random Forest n_estimators"
                      accent="#81C784"
                    />
                    <InfoCard
                      label="N-gram Range"
                      value={training.ngram_range ? `(${training.ngram_range.join(", ")})` : "(1, 2)"}
                      sub="Unigram + Bigram"
                      accent="#A5D6A7"
                    />
                  </div>

                  {/* Per-kelas ringkasan */}
                  {training.perClass && (
                    <div className="mt-4 bg-white rounded-2xl shadow p-5">
                      <h3 className="font-semibold text-gray-700 mb-3 text-sm">Akurasi per Kategori (dari data test)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(training.perClass).map(([cat, m]) => (
                          <div
                            key={cat}
                            className="rounded-xl border p-3 text-center"
                            style={{ borderColor: CATEGORY_COLORS[cat] ?? "#ccc" }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: CATEGORY_COLORS[cat] ?? "#555" }}>
                              {CAT_LABEL[cat] ?? cat}
                            </p>
                            <p className="text-xl font-bold text-gray-800">{((m.f1 ?? 0) * 100).toFixed(0)}%</p>
                            <p className="text-xs text-gray-400">F1-Score</p>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>P: {((m.precision ?? 0) * 100).toFixed(0)}%</span>
                              <span>R: {((m.recall ?? 0) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Charts ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="font-semibold mb-4 text-gray-800">Distribusi Kategori</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow">
                  <h3 className="font-semibold mb-4 text-gray-800">Pengaduan per Minggu (4 Minggu Terakhir)</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="jumlah" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
