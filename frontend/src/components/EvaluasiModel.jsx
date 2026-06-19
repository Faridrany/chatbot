import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Activity, Target, TrendingUp, CheckCircle2, XCircle, AlertCircle, BarChart3 } from "lucide-react";
import { Badge } from "./ui/badge";

// ─── Stat Card ───────────────────────────────────────────────────────────────
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

// ─── MOCK DATA EVALUASI ──────────────────────────────────────────────────────
const MODEL_INFO = {
  name: "Random Forest Classifier",
  n_estimators: 20,
  training_date: "2024-12-15",
  version: "1.0.0",
  total_training_data: 1200,
  train_split: 960,
  test_split: 240,
};

const EVALUATION_RESULTS = {
  test_accuracy: 0.9167,
  train_accuracy: 0.9875,
  cv_scores: [0.85, 0.9083, 0.875, 0.8917, 0.85],
  cv_mean: 0.875,
  cv_std: 0.0237,
  oob_score: 0.8833,
};

const CONFUSION_MATRIX = {
  classes: ["INFRASTRUKTUR", "KEAMANAN", "LINGKUNGAN", "PELAYANAN"],
  matrix: [
    [56, 2, 1, 1], // INFRASTRUKTUR
    [1, 59, 0, 0], // KEAMANAN
    [2, 0, 58, 0], // LINGKUNGAN
    [1, 0, 0, 59], // PELAYANAN
  ],
};

const CLASSIFICATION_REPORT = {
  INFRASTRUKTUR: {
    precision: 0.9333,
    recall: 0.9333,
    f1_score: 0.9333,
    support: 60,
  },
  KEAMANAN: {
    precision: 0.9672,
    recall: 0.9833,
    f1_score: 0.9752,
    support: 60,
  },
  LINGKUNGAN: {
    precision: 0.9831,
    recall: 0.9667,
    f1_score: 0.9748,
    support: 60,
  },
  PELAYANAN: {
    precision: 0.9833,
    recall: 0.9833,
    f1_score: 0.9833,
    support: 60,
  },
  weighted_avg: {
    precision: 0.9667,
    recall: 0.9667,
    f1_score: 0.9667,
  },
};

// Misclassified examples
const MISCLASSIFIED_EXAMPLES = [
  {
    id: "#TKN-20241215-143522-087",
    true_label: "INFRASTRUKTUR",
    predicted: "KEAMANAN",
    text: "Lampu jalan mati, rawan pencurian motor",
    reason: "Kata 'pencurian' dan 'rawan' sangat kuat untuk KEAMANAN",
  },
  {
    id: "#TKN-20241215-153011-112",
    true_label: "INFRASTRUKTUR",
    predicted: "KEAMANAN",
    text: "Jembatan rusak, berbahaya buat pejalan kaki",
    reason: "Kata 'berbahaya' memicu prediksi KEAMANAN",
  },
  {
    id: "#TKN-20241215-161840-156",
    true_label: "KEAMANAN",
    predicted: "INFRASTRUKTUR",
    reason: "Teks mengandung 'jalan rusak' yang dominan untuk INFRASTRUKTUR",
  },
  {
    id: "#TKN-20241215-165233-189",
    true_label: "LINGKUNGAN",
    predicted: "INFRASTRUKTUR",
    text: "Selokan tersumbat sampah, banjir kalau hujan",
    reason: "Kata 'selokan' dan 'banjir' overlap dengan infrastruktur drainase",
  },
  {
    id: "#TKN-20241215-172901-203",
    true_label: "LINGKUNGAN",
    predicted: "INFRASTRUKTUR",
    text: "Parit kotor penuh lumpur, air tidak mengalir",
    reason: "'Parit' lebih sering muncul di konteks infrastruktur",
  },
  {
    id: "#TKN-20241215-180445-221",
    true_label: "INFRASTRUKTUR",
    predicted: "LINGKUNGAN",
    text: "Jalan berlubang, genangan air kotor dimana-mana",
    reason: "'Air kotor' dan 'genangan' kuat untuk LINGKUNGAN",
  },
  {
    id: "#TKN-20241215-184122-238",
    true_label: "PELAYANAN",
    predicted: "INFRASTRUKTUR",
    text: "Lampu kantor kelurahan rusak, gelap untuk mengurus surat",
    reason: "'Lampu rusak' sangat dominan untuk INFRASTRUKTUR",
  },
];

export default function EvaluasiModel({ onLogout }) {
  const [selectedClass, setSelectedClass] = useState(null);

  const categoryColors = {
    INFRASTRUKTUR: "#2E7D32",
    KEAMANAN: "#1976D2",
    LINGKUNGAN: "#388E3C",
    PELAYANAN: "#F57C00",
  };

  // Calculate total correct and incorrect
  const totalCorrect = CONFUSION_MATRIX.matrix.reduce((sum, row, i) => sum + row[i], 0);
  const totalSamples = MODEL_INFO.test_split;
  const totalIncorrect = totalSamples - totalCorrect;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 ml-64">
        <Header />

        <main className="p-8 space-y-8">
          {/* ── Judul ── */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Evaluasi Model Random Forest</h1>
            <p className="text-sm text-gray-500 mt-1">Metrik performa dan analisis kesalahan klasifikasi pengaduan masyarakat</p>
          </div>

          {/* ── Info Model ── */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-600 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-green-800 text-lg">{MODEL_INFO.name}</h2>
                <p className="text-sm text-green-700 mt-1">
                  {MODEL_INFO.n_estimators} Estimators · Trained: {MODEL_INFO.training_date} · Version {MODEL_INFO.version}
                </p>
              </div>
              <Badge className="bg-green-600 text-white text-sm px-3 py-1">Production</Badge>
            </div>
          </div>

          {/* ── Metrik Utama ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Test Accuracy"
              value={`${(EVALUATION_RESULTS.test_accuracy * 100).toFixed(2)}%`}
              sub={`${totalCorrect} dari ${totalSamples} benar`}
              accent="#2E7D32"
              icon={Target}
            />
            <StatCard
              label="Train Accuracy"
              value={`${(EVALUATION_RESULTS.train_accuracy * 100).toFixed(2)}%`}
              sub={`${Math.round(MODEL_INFO.train_split * EVALUATION_RESULTS.train_accuracy)} dari ${MODEL_INFO.train_split} benar`}
              accent="#4CAF50"
              icon={CheckCircle2}
            />
            <StatCard
              label="Cross Validation (5-Fold)"
              value={`${(EVALUATION_RESULTS.cv_mean * 100).toFixed(2)}%`}
              sub={`± ${(EVALUATION_RESULTS.cv_std * 100).toFixed(2)}%`}
              accent="#81C784"
              icon={TrendingUp}
            />
            <StatCard
              label="OOB Score"
              value={`${(EVALUATION_RESULTS.oob_score * 100).toFixed(2)}%`}
              sub="Out-of-bag validation"
              accent="#A5D6A7"
              icon={Activity}
            />
          </div>

          {/* ── Cross Validation Detail ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-700" />
              Cross Validation (5-Fold) Scores
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Model divalidasi dengan 5-fold cross validation. Dataset dibagi 5 bagian, setiap fold digunakan sebagai test set
              satu kali.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {EVALUATION_RESULTS.cv_scores.map((score, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-2">Fold {idx + 1}</p>
                  <p className="text-2xl font-bold text-green-700">{(score * 100).toFixed(2)}%</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-green-600" style={{ width: `${score * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="text-blue-800">
                <strong>Mean:</strong> {(EVALUATION_RESULTS.cv_mean * 100).toFixed(2)}% ·
                <strong className="ml-2">Std Dev:</strong> {(EVALUATION_RESULTS.cv_std * 100).toFixed(2)}% ·
                <strong className="ml-2">Min:</strong> {(Math.min(...EVALUATION_RESULTS.cv_scores) * 100).toFixed(2)}% ·
                <strong className="ml-2">Max:</strong> {(Math.max(...EVALUATION_RESULTS.cv_scores) * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* ── Confusion Matrix ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Confusion Matrix (Test Set)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Matriks ini menunjukkan prediksi model vs label sebenarnya. Diagonal (hijau) = prediksi benar, off-diagonal (merah)
              = salah klasifikasi.
            </p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border bg-gray-100 text-gray-700 font-semibold">Actual \ Predicted</th>
                    {CONFUSION_MATRIX.classes.map((cls) => (
                      <th
                        key={cls}
                        className="p-3 border text-center font-semibold"
                        style={{ backgroundColor: `${categoryColors[cls]}20`, color: categoryColors[cls] }}
                      >
                        {cls}
                      </th>
                    ))}
                    <th className="p-3 border bg-gray-100 text-gray-700 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {CONFUSION_MATRIX.matrix.map((row, i) => {
                    const rowSum = row.reduce((a, b) => a + b, 0);
                    return (
                      <tr key={i}>
                        <td
                          className="p-3 border font-semibold"
                          style={{
                            backgroundColor: `${categoryColors[CONFUSION_MATRIX.classes[i]]}20`,
                            color: categoryColors[CONFUSION_MATRIX.classes[i]],
                          }}
                        >
                          {CONFUSION_MATRIX.classes[i]}
                        </td>
                        {row.map((val, j) => {
                          const isCorrect = i === j;
                          return (
                            <td
                              key={j}
                              className={`p-3 border text-center font-bold text-lg ${
                                isCorrect
                                  ? "bg-green-100 text-green-800"
                                  : val > 0
                                    ? "bg-red-50 text-red-600"
                                    : "bg-gray-50 text-gray-300"
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                        <td className="p-3 border text-center font-bold bg-gray-50">{rowSum}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Prediksi Benar</span>
                </div>
                <p className="text-3xl font-bold text-green-700">{totalCorrect}</p>
                <p className="text-sm text-gray-600 mt-1">{((totalCorrect / totalSamples) * 100).toFixed(2)}% dari total</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">Salah Klasifikasi</span>
                </div>
                <p className="text-3xl font-bold text-red-700">{totalIncorrect}</p>
                <p className="text-sm text-gray-600 mt-1">{((totalIncorrect / totalSamples) * 100).toFixed(2)}% dari total</p>
              </div>
            </div>
          </div>

          {/* ── Classification Report ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Classification Report — Metrik per Kelas</h2>
            <p className="text-sm text-gray-500 mb-5">
              Precision: Dari yang diprediksi X, berapa yang benar. Recall: Dari yang sebenarnya X, berapa yang terdeteksi.
              F1-Score: Harmonik mean dari keduanya.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(CLASSIFICATION_REPORT)
                .filter(([key]) => key !== "weighted_avg")
                .map(([className, metrics]) => (
                  <div
                    key={className}
                    className="p-5 rounded-xl border-l-4 cursor-pointer transition-all hover:shadow-lg"
                    style={{ borderColor: categoryColors[className] }}
                    onClick={() => setSelectedClass(selectedClass === className ? null : className)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-800">{className}</h3>
                      <Badge className="text-xs" style={{ backgroundColor: categoryColors[className], color: "white" }}>
                        {metrics.support} sampel
                      </Badge>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600">Precision</span>
                          <span className="font-bold text-gray-800">{(metrics.precision * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${metrics.precision * 100}%`, backgroundColor: categoryColors[className] }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600">Recall</span>
                          <span className="font-bold text-gray-800">{(metrics.recall * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${metrics.recall * 100}%`, backgroundColor: categoryColors[className] }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600">F1-Score</span>
                          <span className="font-bold text-gray-800">{(metrics.f1_score * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${metrics.f1_score * 100}%`, backgroundColor: categoryColors[className] }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Weighted Average */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-600 rounded-xl">
              <h3 className="font-bold text-gray-800 mb-3">Weighted Average (Overall Performance)</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Precision</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(CLASSIFICATION_REPORT.weighted_avg.precision * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Recall</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(CLASSIFICATION_REPORT.weighted_avg.recall * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">F1-Score</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(CLASSIFICATION_REPORT.weighted_avg.f1_score * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Analisis Kesalahan ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Analisis Kesalahan Klasifikasi
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Berikut adalah contoh data yang salah diklasifikasi oleh model. Analisis ini membantu memahami kelemahan model dan
              area yang perlu ditingkatkan.
            </p>

            <div className="space-y-4">
              {MISCLASSIFIED_EXAMPLES.map((example, idx) => (
                <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs text-gray-600">
                        {example.id}
                      </Badge>
                      <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs" style={{ backgroundColor: categoryColors[example.true_label], color: "white" }}>
                        True: {example.true_label}
                      </Badge>
                      <span className="text-gray-400">→</span>
                      <Badge className="text-xs" style={{ backgroundColor: categoryColors[example.predicted], color: "white" }}>
                        Predicted: {example.predicted}
                      </Badge>
                    </div>
                  </div>
                  {example.text && <p className="text-sm text-gray-700 mb-2 italic">"{example.text}"</p>}
                  <p className="text-xs text-red-700">
                    <strong>Alasan:</strong> {example.reason}
                  </p>
                </div>
              ))}
            </div>

            {/* Insight */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">💡 Insight & Rekomendasi</h3>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>
                  Kata seperti "berbahaya", "rawan", "pencurian" sangat kuat untuk KEAMANAN, meski konteks sebenarnya
                  INFRASTRUKTUR
                </li>
                <li>Overlap antara LINGKUNGAN dan INFRASTRUKTUR pada kata "selokan", "parit", "drainase"</li>
                <li>Pertimbangkan menambah data training dengan kasus-kasus edge case ini</li>
                <li>Feature engineering tambahan: bigram/trigram yang lebih spesifik per kategori</li>
              </ul>
            </div>
          </div>

          {/* ── Interpretasi Metrik ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Interpretasi Metrik Evaluasi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  metric: "Accuracy",
                  desc: "Persentase prediksi yang benar dari total prediksi. Model kita: 91.67% (220 dari 240 benar). Metrik ini baik karena dataset balanced (60 sampel per kelas).",
                  color: "#2E7D32",
                },
                {
                  metric: "Precision",
                  desc: "Dari semua yang diprediksi sebagai kelas X, berapa persen yang benar? Precision tinggi = sedikit false positive. Penting untuk menghindari salah alarm.",
                  color: "#4CAF50",
                },
                {
                  metric: "Recall (Sensitivity)",
                  desc: "Dari semua yang sebenarnya kelas X, berapa persen yang terdeteksi? Recall tinggi = sedikit false negative. Penting untuk menangkap semua kasus.",
                  color: "#81C784",
                },
                {
                  metric: "F1-Score",
                  desc: "Harmonik mean dari Precision dan Recall. Balance antara keduanya. F1 = 2 × (Precision × Recall) / (Precision + Recall). Ideal untuk dataset balanced.",
                  color: "#A5D6A7",
                },
                {
                  metric: "Cross Validation",
                  desc: "5-Fold CV memberikan estimasi performa yang lebih robust. Mean 87.50% dengan std 2.37% menunjukkan model stabil dan tidak overfitting pada satu split tertentu.",
                  color: "#1976D2",
                },
                {
                  metric: "OOB Score",
                  desc: "Out-of-Bag score dari Random Forest. Setiap pohon divalidasi dengan ~36.8% data yang tidak masuk bootstrap-nya. OOB 88.33% menunjukkan generalisasi baik tanpa perlu validation set terpisah.",
                  color: "#F57C00",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border-l-4 bg-gray-50" style={{ borderColor: item.color }}>
                  <h3 className="font-semibold text-gray-800 mb-2">{item.metric}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Overfitting Check ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Overfitting Check
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Perbandingan Train vs Test accuracy untuk mendeteksi overfitting. Gap besar menunjukkan model terlalu hafal training
              data.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Train Accuracy</p>
                <p className="text-3xl font-bold text-green-700">{(EVALUATION_RESULTS.train_accuracy * 100).toFixed(2)}%</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: `${EVALUATION_RESULTS.train_accuracy * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Test Accuracy</p>
                <p className="text-3xl font-bold text-blue-700">{(EVALUATION_RESULTS.test_accuracy * 100).toFixed(2)}%</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${EVALUATION_RESULTS.test_accuracy * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
              <p className="text-purple-800">
                <strong>Gap:</strong> {((EVALUATION_RESULTS.train_accuracy - EVALUATION_RESULTS.test_accuracy) * 100).toFixed(2)}%
                ·<strong className="ml-2">Status:</strong>{" "}
                {EVALUATION_RESULTS.train_accuracy - EVALUATION_RESULTS.test_accuracy < 0.05
                  ? "✅ Good fit (gap < 5%)"
                  : EVALUATION_RESULTS.train_accuracy - EVALUATION_RESULTS.test_accuracy < 0.1
                    ? "⚠️ Slight overfitting (gap 5-10%)"
                    : "❌ Overfitting detected (gap > 10%)"}
              </p>
              <p className="text-xs text-purple-700 mt-2">
                Gap 7.08% menunjukkan sedikit overfitting, namun masih acceptable. Random Forest sudah memiliki regularisasi
                built-in (bootstrap, random features).
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
