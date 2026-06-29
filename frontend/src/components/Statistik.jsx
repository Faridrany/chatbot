import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

const CATEGORIES = ["KEAMANAN", "INFRASTRUKTUR", "LINGKUNGAN", "PELAYANAN"];

const CAT_COLOR = {
  KEAMANAN: "#2E7D32",
  INFRASTRUKTUR: "#4CAF50",
  LINGKUNGAN: "#81C784",
  PELAYANAN: "#A5D6A7",
};

const CAT_LABEL = {
  KEAMANAN: "Keamanan",
  INFRASTRUKTUR: "Infrastruktur",
  LINGKUNGAN: "Lingkungan",
  PELAYANAN: "Pelayanan",
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-5 border-l-4`} style={{ borderColor: accent || "#2E7D32" }}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// Confusion Matrix Cell
function CMCell({ value, isTP }) {
  const bg = isTP ? "bg-green-600 text-white font-bold" : value > 0 ? "bg-green-100 text-green-800" : "bg-gray-50 text-gray-300";
  return <td className={`text-center p-3 text-sm border ${bg}`}>{value}</td>;
}

export default function Statistik({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/evaluasi")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar onLogout={onLogout} />
        <div className="flex-1 ml-64">
          <Header />
          <main className="p-8 text-gray-500">Memuat statistik model...</main>
        </div>
      </div>
    );

  if (error || !data)
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar onLogout={onLogout} />
        <div className="flex-1 ml-64">
          <Header />
          <main className="p-8 text-red-500">Gagal memuat data: {error}</main>
        </div>
      </div>
    );

  const {
    akurasi,
    perClass,
    confusionMatrix,
    fitur_tfidf,
    fitur_selected,
    estimators,
    total_data,
    data_train,
    data_test,
    f1_score: f1Weighted,
    oob_score,
    cv_mean,
    cv_std,
    ngram_range,
  } = data;

  // Distribusi dari final_processed (prediksi 400 data)
  const distribusiCount = {};
  CATEGORIES.forEach((c) => (distribusiCount[c] = 0));

  // Data untuk bar chart per-class metrics
  const metricsChartData = CATEGORIES.map((cat) => ({
    name: CAT_LABEL[cat],
    Precision: parseFloat(((perClass?.[cat]?.precision || 0) * 100).toFixed(1)),
    Recall: parseFloat(((perClass?.[cat]?.recall || 0) * 100).toFixed(1)),
    "F1-Score": parseFloat(((perClass?.[cat]?.f1 || 0) * 100).toFixed(1)),
    color: CAT_COLOR[cat],
  }));

  // Data untuk radar chart
  const radarData = CATEGORIES.map((cat) => ({
    subject: CAT_LABEL[cat],
    Precision: parseFloat(((perClass?.[cat]?.precision || 0) * 100).toFixed(1)),
    Recall: parseFloat(((perClass?.[cat]?.recall || 0) * 100).toFixed(1)),
    "F1-Score": parseFloat(((perClass?.[cat]?.f1 || 0) * 100).toFixed(1)),
  }));

  // Distribusi dari perClass support
  const distribusiData = CATEGORIES.map((cat) => ({
    name: CAT_LABEL[cat],
    jumlah: perClass?.[cat]?.support || 0,
    color: CAT_COLOR[cat],
  }));

  // Macro avg dari perClass yang sudah benar
  const macroPrec = CATEGORIES.reduce((s, c) => s + (perClass?.[c]?.precision || 0), 0) / CATEGORIES.length;
  const macroRec = CATEGORIES.reduce((s, c) => s + (perClass?.[c]?.recall || 0), 0) / CATEGORIES.length;
  const macroF1 = CATEGORIES.reduce((s, c) => s + (perClass?.[c]?.f1 || 0), 0) / CATEGORIES.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 ml-64">
        <Header />

        <main className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Statistik Model</h1>
            <p className="text-sm text-gray-500 mt-1">Evaluasi performa model Random Forest dengan TF-IDF</p>
          </div>

          {/* ── Ringkasan Model ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Akurasi Model"
              value={`${(akurasi * 100).toFixed(1)}%`}
              sub="Data test (80:20 split)"
              accent="#2E7D32"
            />
            <StatCard
              label="F1-Score Weighted"
              value={`${((f1Weighted ?? 0) * 100).toFixed(1)}%`}
              sub="Harmonic mean P & R"
              accent="#4CAF50"
            />
            <StatCard
              label="CV 5-Fold Mean"
              value={`${((cv_mean ?? 0) * 100).toFixed(1)}%`}
              sub={`± ${((cv_std ?? 0) * 100).toFixed(1)}% std`}
              accent="#81C784"
            />
            <StatCard
              label="OOB Score"
              value={`${((oob_score ?? 0) * 100).toFixed(1)}%`}
              sub="Out-of-bag estimate"
              accent="#A5D6A7"
            />
          </div>

          {/* ── Macro Avg ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Macro Precision"
              value={`${(macroPrec * 100).toFixed(1)}%`}
              sub="Rata-rata semua kelas"
              accent="#2E7D32"
            />
            <StatCard
              label="Macro Recall"
              value={`${(macroRec * 100).toFixed(1)}%`}
              sub="Rata-rata semua kelas"
              accent="#4CAF50"
            />
            <StatCard
              label="Macro F1-Score"
              value={`${(macroF1 * 100).toFixed(1)}%`}
              sub="Rata-rata semua kelas"
              accent="#81C784"
            />
            <StatCard
              label="Data Train / Test"
              value={`${data_train ?? "-"} / ${data_test ?? "-"}`}
              sub={`Total ${total_data ?? "-"} data`}
              accent="#A5D6A7"
            />
          </div>

          {/* ── Info TF-IDF & Random Forest ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TF-IDF */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-gray-800 mb-4">TF-IDF Vectorizer</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-500">Jumlah Fitur (Sebelum Seleksi)</span>
                  <span className="font-semibold text-green-700">{(fitur_tfidf || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-500">Fitur Terpilih (SelectPercentile)</span>
                  <span className="font-semibold text-green-700">{(fitur_selected || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-500">N-gram Range</span>
                  <span className="font-semibold text-green-700">
                    {ngram_range ? `(${ngram_range.join(", ")})` : "(1, 1)"} — Unigram only
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-500">Total Data Training</span>
                  <span className="font-semibold text-green-700">{(total_data || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Data Train / Test</span>
                  <span className="font-semibold text-green-700">
                    {data_train} / {data_test}
                  </span>
                </div>
              </div>
            </div>

            {/* Random Forest */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-gray-800 mb-4">Random Forest Classifier</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-500">Jumlah Estimator (Pohon)</span>
                  <span className="font-semibold text-green-700">{estimators || 500}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-500">Jumlah Kelas</span>
                  <span className="font-semibold text-green-700">{CATEGORIES.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-500">Kelas Target</span>
                  <span className="font-semibold text-green-700 text-xs">{CATEGORIES.map((c) => CAT_LABEL[c]).join(", ")}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-500">Cross Validation (5-Fold)</span>
                  <span className="font-semibold text-green-700">
                    {((cv_mean ?? 0) * 100).toFixed(1)}% ± {((cv_std ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">OOB Score</span>
                  <span className="font-semibold text-green-700">{((oob_score ?? 0) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Confusion Matrix ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-1">Confusion Matrix</h2>
            <p className="text-xs text-gray-400 mb-4">
              Baris = Label Aktual &nbsp;|&nbsp; Kolom = Prediksi Model &nbsp;|&nbsp;
              <span className="text-green-700 font-semibold">Diagonal hijau = prediksi benar (TP)</span>
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-gray-500 border bg-gray-50">Aktual \ Prediksi</th>
                    {CATEGORIES.map((cat) => (
                      <th key={cat} className="p-3 text-center border bg-gray-50 font-semibold text-gray-700">
                        {CAT_LABEL[cat]}
                      </th>
                    ))}
                    <th className="p-3 text-center border bg-gray-50 text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((actual) => {
                    const rowTotal = CATEGORIES.reduce((s, p) => s + (confusionMatrix[actual]?.[p] || 0), 0);
                    return (
                      <tr key={actual}>
                        <td className="p-3 border font-semibold text-gray-700 bg-gray-50">{CAT_LABEL[actual]}</td>
                        {CATEGORIES.map((predicted) => (
                          <CMCell key={predicted} value={confusionMatrix[actual]?.[predicted] || 0} isTP={actual === predicted} />
                        ))}
                        <td className="p-3 text-center border text-gray-500 font-semibold bg-gray-50">{rowTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Per-Class Metrics Table ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Classification Report</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="p-3 text-left border text-gray-700">Kategori</th>
                    <th className="p-3 text-center border text-gray-700">Precision</th>
                    <th className="p-3 text-center border text-gray-700">Recall</th>
                    <th className="p-3 text-center border text-gray-700">F1-Score</th>
                    <th className="p-3 text-center border text-gray-700">Support</th>
                    <th className="p-3 text-center border text-gray-700">TP</th>
                    <th className="p-3 text-center border text-gray-700">FP</th>
                    <th className="p-3 text-center border text-gray-700">FN</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((cat) => {
                    const m = perClass[cat] || {};
                    return (
                      <tr key={cat} className="border-b hover:bg-gray-50">
                        <td className="p-3 border font-semibold" style={{ color: CAT_COLOR[cat] }}>
                          {CAT_LABEL[cat]}
                        </td>
                        <td className="p-3 text-center border">{((m.precision || 0) * 100).toFixed(1)}%</td>
                        <td className="p-3 text-center border">{((m.recall || 0) * 100).toFixed(1)}%</td>
                        <td className="p-3 text-center border font-semibold text-green-700">{((m.f1 || 0) * 100).toFixed(1)}%</td>
                        <td className="p-3 text-center border text-gray-500">{m.support || 0}</td>
                        <td className="p-3 text-center border text-green-600">{m.tp || 0}</td>
                        <td className="p-3 text-center border text-red-400">{m.fp || 0}</td>
                        <td className="p-3 text-center border text-orange-400">{m.fn || 0}</td>
                      </tr>
                    );
                  })}
                  {/* Macro avg row */}
                  <tr className="bg-green-50 font-semibold">
                    <td className="p-3 border text-gray-700">Macro Avg</td>
                    <td className="p-3 text-center border">{(macroPrec * 100).toFixed(1)}%</td>
                    <td className="p-3 text-center border">{(macroRec * 100).toFixed(1)}%</td>
                    <td className="p-3 text-center border text-green-700">{(macroF1 * 100).toFixed(1)}%</td>
                    <td className="p-3 text-center border text-gray-500" colSpan={4}>
                      —
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart per-class */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-gray-800 mb-4">Precision / Recall / F1 per Kategori</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={metricsChartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="Precision" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recall" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="F1-Score" fill="#A5D6A7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar chart */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-gray-800 mb-4">Radar Performa per Kategori</h2>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9 }} />
                  <Radar name="Precision" dataKey="Precision" stroke="#2E7D32" fill="#2E7D32" fillOpacity={0.2} />
                  <Radar name="Recall" dataKey="Recall" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.2} />
                  <Radar name="F1-Score" dataKey="F1-Score" stroke="#81C784" fill="#81C784" fillOpacity={0.2} />
                  <Legend />
                  <Tooltip formatter={(v) => `${v}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Distribusi Prediksi ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Distribusi Hasil Prediksi</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distribusiData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="jumlah" radius={[0, 4, 4, 0]}>
                  {distribusiData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </div>
  );
}
