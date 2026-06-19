import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { TreeDeciduous, GitBranch, Shuffle, Target, Filter, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

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

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MODEL_CONFIG = {
  n_estimators: 20,
  max_depth: null,
  min_samples_split: 2,
  min_samples_leaf: 1,
  max_features: "sqrt",
  bootstrap: true,
  random_state: 42,
  total_training_data: 960,
  total_features: 1000,
  features_per_split: 31, // √1000 ≈ 31
};

// Bootstrap samples untuk setiap pohon
const BOOTSTRAP_DETAILS = Array.from({ length: 20 }, (_, i) => ({
  tree_id: i + 1,
  bootstrap_size: 960,
  unique_samples: 960 - Math.floor(960 * 0.368), // ~632 unique
  duplicate_samples: Math.floor(960 * 0.368), // ~328 duplicates
  oob_samples: Math.floor(960 * 0.368), // ~328 OOB
  samples_per_class: {
    INFRASTRUKTUR: 235 + Math.floor(Math.random() * 10),
    KEAMANAN: 235 + Math.floor(Math.random() * 10),
    LINGKUNGAN: 235 + Math.floor(Math.random() * 10),
    PELAYANAN: 235 + Math.floor(Math.random() * 10),
  },
  max_depth_reached: 16 + Math.floor(Math.random() * 5),
  total_nodes: 130 + Math.floor(Math.random() * 30),
  leaf_nodes: 65 + Math.floor(Math.random() * 15),
}));

// Contoh detail splitting untuk Node Root dari Tree #1
const SPLIT_EXAMPLE = {
  tree_id: 1,
  node_info: {
    node_id: 0,
    depth: 0,
    samples: 960,
    samples_per_class: { INFRASTRUKTUR: 238, KEAMANAN: 241, LINGKUNGAN: 242, PELAYANAN: 239 },
  },
  impurity_before: {
    gini: 0.75,
    entropy: 1.3863,
    calculation: "Gini = 1 - Σ(pi²) = 1 - (0.248² + 0.251² + 0.252² + 0.249²) = 0.7500",
  },
  feature_selection: {
    total_features: 1000,
    random_subset: 31, // √1000
    candidate_features: ["sampah", "penuh sampah", "bau", "buang", "layan", "urus", "lampu jalan"],
  },
  best_split: {
    feature: "sampah",
    threshold: 0.015,
    gini_left: 0.7012,
    gini_right: 0.4287,
    gini_decrease: 0.0832,
    information_gain: 0.0832,
  },
  competing_splits: [
    { feature: "penuh sampah", threshold: 0.012, gini_decrease: 0.0754 },
    { feature: "bau", threshold: 0.008, gini_decrease: 0.0621 },
    { feature: "buang", threshold: 0.009, gini_decrease: 0.0589 },
  ],
  left_child: {
    node_id: 1,
    samples: 672,
    samples_per_class: { INFRASTRUKTUR: 195, KEAMANAN: 218, LINGKUNGAN: 61, PELAYANAN: 198 },
    gini: 0.7012,
    dominant_class: "KEAMANAN",
    is_leaf: false,
  },
  right_child: {
    node_id: 2,
    samples: 288,
    samples_per_class: { INFRASTRUKTUR: 43, KEAMANAN: 23, LINGKUNGAN: 181, PELAYANAN: 41 },
    gini: 0.4287,
    dominant_class: "LINGKUNGAN",
    is_leaf: false,
  },
};

// Prediksi sampel dengan detail setiap pohon
const SAMPLE_PREDICTION = {
  input: "Lampu jalan di gang Mawar sudah mati seminggu, gelap sekali malam hari.",
  processed: "lampu jalan gang mawar mati minggu gelap malam hari",
  tfidf_vector: {
    "lampu jalan": 0.2891,
    jalan: 0.1823,
    lampu: 0.1645,
    mati: 0.1432,
    gelap: 0.1289,
    malam: 0.1156,
    hari: 0.0876,
    gang: 0.0654,
  },
  tree_predictions: [
    { tree: 1, prediction: "INFRASTRUKTUR", leaf_purity: 0.89, path_length: 12, samples_in_leaf: 45 },
    { tree: 2, prediction: "INFRASTRUKTUR", leaf_purity: 0.92, path_length: 10, samples_in_leaf: 52 },
    { tree: 3, prediction: "INFRASTRUKTUR", leaf_purity: 0.87, path_length: 11, samples_in_leaf: 38 },
    { tree: 4, prediction: "INFRASTRUKTUR", leaf_purity: 0.91, path_length: 9, samples_in_leaf: 47 },
    { tree: 5, prediction: "KEAMANAN", leaf_purity: 0.65, path_length: 14, samples_in_leaf: 23 },
    { tree: 6, prediction: "INFRASTRUKTUR", leaf_purity: 0.88, path_length: 10, samples_in_leaf: 41 },
    { tree: 7, prediction: "INFRASTRUKTUR", leaf_purity: 0.93, path_length: 11, samples_in_leaf: 49 },
    { tree: 8, prediction: "INFRASTRUKTUR", leaf_purity: 0.9, path_length: 12, samples_in_leaf: 44 },
    { tree: 9, prediction: "INFRASTRUKTUR", leaf_purity: 0.86, path_length: 13, samples_in_leaf: 37 },
    { tree: 10, prediction: "INFRASTRUKTUR", leaf_purity: 0.94, path_length: 9, samples_in_leaf: 51 },
    { tree: 11, prediction: "INFRASTRUKTUR", leaf_purity: 0.89, path_length: 11, samples_in_leaf: 43 },
    { tree: 12, prediction: "KEAMANAN", leaf_purity: 0.62, path_length: 15, samples_in_leaf: 21 },
    { tree: 13, prediction: "INFRASTRUKTUR", leaf_purity: 0.91, path_length: 10, samples_in_leaf: 46 },
    { tree: 14, prediction: "INFRASTRUKTUR", leaf_purity: 0.88, path_length: 12, samples_in_leaf: 42 },
    { tree: 15, prediction: "INFRASTRUKTUR", leaf_purity: 0.92, path_length: 10, samples_in_leaf: 48 },
    { tree: 16, prediction: "INFRASTRUKTUR", leaf_purity: 0.87, path_length: 11, samples_in_leaf: 39 },
    { tree: 17, prediction: "INFRASTRUKTUR", leaf_purity: 0.9, path_length: 11, samples_in_leaf: 45 },
    { tree: 18, prediction: "LINGKUNGAN", leaf_purity: 0.58, path_length: 14, samples_in_leaf: 26 },
    { tree: 19, prediction: "INFRASTRUKTUR", leaf_purity: 0.89, path_length: 12, samples_in_leaf: 44 },
    { tree: 20, prediction: "INFRASTRUKTUR", leaf_purity: 0.93, path_length: 9, samples_in_leaf: 50 },
  ],
  final_votes: { INFRASTRUKTUR: 17, KEAMANAN: 2, LINGKUNGAN: 1, PELAYANAN: 0 },
};

export default function RandomForestDetail({ onLogout }) {
  const [expandedTree, setExpandedTree] = useState(null);
  const [showSplitDetail, setShowSplitDetail] = useState(false);

  const categoryColors = {
    INFRASTRUKTUR: "#2E7D32",
    KEAMANAN: "#1976D2",
    LINGKUNGAN: "#388E3C",
    PELAYANAN: "#F57C00",
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 ml-64">
        <Header />

        <main className="p-8 space-y-8">
          {/* ── Judul ── */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Detail Proses Random Forest Classifier</h1>
            <p className="text-sm text-gray-500 mt-1">
              Analisis mendalam proses training dan prediksi menggunakan {MODEL_CONFIG.n_estimators} pohon keputusan
            </p>
          </div>

          {/* ── Konfigurasi Model ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Jumlah Pohon (Estimator)"
              value={MODEL_CONFIG.n_estimators}
              sub="Decision trees dalam ensemble"
              accent="#2E7D32"
              icon={TreeDeciduous}
            />
            <StatCard
              label="Data Training"
              value={MODEL_CONFIG.total_training_data}
              sub="Sampel untuk melatih model"
              accent="#4CAF50"
              icon={Shuffle}
            />
            <StatCard
              label="Total Fitur TF-IDF"
              value={MODEL_CONFIG.total_features}
              sub="Dari proses SelectKBest"
              accent="#81C784"
              icon={Filter}
            />
            <StatCard
              label="Fitur per Split"
              value={MODEL_CONFIG.features_per_split}
              sub={`√${MODEL_CONFIG.total_features} fitur random`}
              accent="#A5D6A7"
              icon={GitBranch}
            />
          </div>

          {/* ── Step 1: Bootstrap Sampling ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-green-700" />
              Step 1: Bootstrap Sampling — Membuat {MODEL_CONFIG.n_estimators} Dataset Berbeda
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Setiap pohon dilatih dengan <strong>random sample dengan replacement</strong> dari{" "}
                  {MODEL_CONFIG.total_training_data} data training. Rata-rata ~63.2% data unique, ~36.8% duplikat. Sisanya
                  (~36.8%) menjadi <strong>Out-of-Bag (OOB)</strong> samples untuk validasi.
                </span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-100 text-green-900">
                  <tr>
                    <th className="p-3 text-left font-semibold">Tree ID</th>
                    <th className="p-3 text-center font-semibold">Bootstrap Size</th>
                    <th className="p-3 text-center font-semibold">Unique Samples</th>
                    <th className="p-3 text-center font-semibold">Duplicate Samples</th>
                    <th className="p-3 text-center font-semibold">OOB Samples</th>
                    <th className="p-3 text-center font-semibold">Nodes Built</th>
                    <th className="p-3 text-center font-semibold">Max Depth</th>
                    <th className="p-3 text-center font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {BOOTSTRAP_DETAILS.map((tree) => (
                    <tr key={tree.tree_id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                          <TreeDeciduous className="w-4 h-4 text-green-600" />
                          Tree #{tree.tree_id}
                        </div>
                      </td>
                      <td className="p-3 text-center text-gray-700">{tree.bootstrap_size}</td>
                      <td className="p-3 text-center">
                        <Badge className="bg-green-600 text-white">{tree.unique_samples}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-gray-600">
                          {tree.duplicate_samples}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className="bg-blue-600 text-white">{tree.oob_samples}</Badge>
                      </td>
                      <td className="p-3 text-center text-gray-700">{tree.total_nodes}</td>
                      <td className="p-3 text-center text-gray-700">{tree.max_depth_reached}</td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedTree(expandedTree === tree.tree_id ? null : tree.tree_id)}
                        >
                          {expandedTree === tree.tree_id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {expandedTree && (
              <div className="mt-4 p-4 bg-gray-50 border rounded-xl">
                <h3 className="font-bold text-gray-800 mb-3">Detail Bootstrap Tree #{expandedTree}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {Object.entries(BOOTSTRAP_DETAILS[expandedTree - 1].samples_per_class).map(([cls, count]) => (
                    <div key={cls} className="p-3 bg-white rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">{cls}</p>
                      <p className="text-lg font-bold" style={{ color: categoryColors[cls] }}>
                        {count} sampel
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Step 2: Node Splitting & Impurity ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-green-700" />
                Step 2: Node Splitting & Impurity Calculation (Gini Index)
              </h2>
              <Button
                size="sm"
                variant={showSplitDetail ? "default" : "outline"}
                onClick={() => setShowSplitDetail(!showSplitDetail)}
                className={showSplitDetail ? "bg-green-700" : ""}
              >
                {showSplitDetail ? "Sembunyikan Detail" : "Tampilkan Detail Splitting"}
              </Button>
            </div>

            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Setiap node memilih{" "}
                  <strong>
                    √{MODEL_CONFIG.total_features} = {MODEL_CONFIG.features_per_split} fitur random
                  </strong>{" "}
                  dari {MODEL_CONFIG.total_features} fitur total. Fitur terbaik dipilih berdasarkan{" "}
                  <strong>Gini Impurity Decrease</strong> terbesar untuk split node tersebut.
                </span>
              </p>
            </div>

            {showSplitDetail && (
              <div className="space-y-4">
                {/* Node Information */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-600 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-3">Contoh: Tree #1 - Root Node (Depth 0)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Samples</p>
                      <p className="text-lg font-bold text-gray-800">{SPLIT_EXAMPLE.node_info.samples}</p>
                    </div>
                    {Object.entries(SPLIT_EXAMPLE.node_info.samples_per_class).map(([cls, count]) => (
                      <div key={cls}>
                        <p className="text-xs text-gray-500">{cls}</p>
                        <p className="text-lg font-bold" style={{ color: categoryColors[cls] }}>
                          {count}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500 mb-2">📊 Gini Impurity (Sebelum Split)</p>
                    <p className="text-2xl font-bold text-red-600">{SPLIT_EXAMPLE.impurity_before.gini.toFixed(4)}</p>
                    <p className="text-xs text-gray-600 mt-2 font-mono">{SPLIT_EXAMPLE.impurity_before.calculation}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Semakin tinggi Gini, semakin tidak pure node tersebut (campuran kelas). Target: split untuk menurunkan Gini.
                    </p>
                  </div>
                </div>

                {/* Feature Selection */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-bold text-blue-800 mb-3">Random Feature Subset Selection</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Dari {SPLIT_EXAMPLE.feature_selection.total_features} fitur, hanya{" "}
                    <strong>{SPLIT_EXAMPLE.feature_selection.random_subset} fitur random</strong> yang dipertimbangkan:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SPLIT_EXAMPLE.feature_selection.candidate_features.map((feat, idx) => (
                      <Badge key={idx} className={idx === 0 ? "bg-green-600 text-white" : "bg-blue-600 text-white"}>
                        {feat} {idx === 0 && "✓"}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Best Split */}
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                  <h3 className="font-bold text-green-800 mb-3">✓ Best Split Selected</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Split Feature:</strong>{" "}
                        <span className="font-mono text-green-700">{SPLIT_EXAMPLE.best_split.feature}</span>
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Threshold:</strong>{" "}
                        <span className="font-mono">{SPLIT_EXAMPLE.best_split.threshold.toFixed(4)}</span>
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Gini Decrease:</strong>{" "}
                        <span className="font-bold text-green-700">{SPLIT_EXAMPLE.best_split.gini_decrease.toFixed(4)}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500">Competing Features (runner-up):</p>
                      {SPLIT_EXAMPLE.competing_splits.map((split, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600">{idx + 2}.</span>
                          <span className="font-mono text-gray-700">{split.feature}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div
                              className="h-1 rounded-full bg-gray-400"
                              style={{ width: `${(split.gini_decrease / SPLIT_EXAMPLE.best_split.gini_decrease) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{split.gini_decrease.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Split Result */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Child */}
                  <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-xl">
                    <h4 className="font-bold text-orange-800 mb-3">← Left Child (sampah ≤ 0.0150)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Samples:</span>
                        <span className="font-bold">{SPLIT_EXAMPLE.left_child.samples}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gini:</span>
                        <span className="font-bold text-orange-600">{SPLIT_EXAMPLE.left_child.gini.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dominant:</span>
                        <Badge className="bg-orange-600 text-white">{SPLIT_EXAMPLE.left_child.dominant_class}</Badge>
                      </div>
                      <div className="mt-3 space-y-1">
                        {Object.entries(SPLIT_EXAMPLE.left_child.samples_per_class).map(([cls, count]) => (
                          <div key={cls} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-32">{cls}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${(count / SPLIT_EXAMPLE.left_child.samples) * 100}%`,
                                  backgroundColor: categoryColors[cls],
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold w-8 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Child */}
                  <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded-xl">
                    <h4 className="font-bold text-green-800 mb-3">→ Right Child (sampah &gt; 0.0150)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Samples:</span>
                        <span className="font-bold">{SPLIT_EXAMPLE.right_child.samples}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gini:</span>
                        <span className="font-bold text-green-600">{SPLIT_EXAMPLE.right_child.gini.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dominant:</span>
                        <Badge className="bg-green-600 text-white">{SPLIT_EXAMPLE.right_child.dominant_class}</Badge>
                      </div>
                      <div className="mt-3 space-y-1">
                        {Object.entries(SPLIT_EXAMPLE.right_child.samples_per_class).map(([cls, count]) => (
                          <div key={cls} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-32">{cls}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${(count / SPLIT_EXAMPLE.right_child.samples) * 100}%`,
                                  backgroundColor: categoryColors[cls],
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold w-8 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
                  <strong>Hasil Split:</strong> Gini menurun dari 0.7500 → Left: 0.7012, Right: 0.4287. Right child lebih pure
                  (didominasi LINGKUNGAN 62.8%). Proses ini berulang untuk setiap child node hingga mencapai stopping criteria.
                </div>
              </div>
            )}
          </div>

          {/* ── Step 3: Prediction & Voting ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-700" />
              Step 3: Prediksi Sampel Baru dengan {MODEL_CONFIG.n_estimators} Pohon
            </h2>

            {/* Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 border rounded-xl">
                <p className="text-xs font-semibold text-gray-500 mb-2">① Teks Input Asli</p>
                <p className="text-sm text-gray-800 leading-relaxed">{SAMPLE_PREDICTION.input}</p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs font-semibold text-green-700 mb-2">② Hasil Preprocessing</p>
                <p className="text-sm text-gray-700 font-mono leading-relaxed">{SAMPLE_PREDICTION.processed}</p>
              </div>
            </div>

            {/* TF-IDF Vector */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
              <p className="text-xs font-semibold text-blue-700 mb-3">③ Vektor TF-IDF (Nilai Fitur)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(SAMPLE_PREDICTION.tfidf_vector).map(([term, value]) => (
                  <div key={term} className="p-2 bg-white rounded border text-xs">
                    <p className="font-mono font-semibold text-gray-700 truncate">{term}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                        <div className="h-1 rounded-full bg-blue-500" style={{ width: `${value * 100}%` }} />
                      </div>
                      <span className="font-bold text-blue-700">{value.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voting dari setiap pohon */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl mb-6">
              <p className="text-xs font-semibold text-purple-700 mb-3">
                ④ Voting dari {MODEL_CONFIG.n_estimators} Pohon Keputusan
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-purple-100 text-purple-900">
                    <tr>
                      <th className="p-2 text-left">Tree</th>
                      <th className="p-2 text-left">Prediksi</th>
                      <th className="p-2 text-center">Leaf Purity</th>
                      <th className="p-2 text-center">Path Length</th>
                      <th className="p-2 text-center">Samples in Leaf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_PREDICTION.tree_predictions.map((pred) => (
                      <tr key={pred.tree} className="border-t hover:bg-white transition-colors">
                        <td className="p-2">
                          <TreeDeciduous className="w-3 h-3 inline mr-1 text-purple-600" />#{pred.tree}
                        </td>
                        <td className="p-2">
                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: categoryColors[pred.prediction],
                              color: "white",
                            }}
                          >
                            {pred.prediction}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-12 bg-gray-200 rounded-full h-1">
                              <div className="h-1 rounded-full bg-purple-500" style={{ width: `${pred.leaf_purity * 100}%` }} />
                            </div>
                            <span className="font-bold text-purple-700">{(pred.leaf_purity * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="p-2 text-center text-gray-700">{pred.path_length} nodes</td>
                        <td className="p-2 text-center text-gray-700">{pred.samples_in_leaf}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hasil Final Voting */}
            <div className="p-5 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl">
              <p className="text-xs font-semibold text-green-700 mb-3">⑤ HASIL AKHIR — Majority Voting</p>
              <div className="space-y-3 mb-4">
                {Object.entries(SAMPLE_PREDICTION.final_votes)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cls, votes], idx) => (
                    <div key={cls}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">{cls}</span>
                        </div>
                        <span className="font-bold text-gray-800">
                          {votes} / {MODEL_CONFIG.n_estimators} pohon ({((votes / MODEL_CONFIG.n_estimators) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              idx === 0 ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gray-400"
                            }`}
                            style={{ width: `${(votes / MODEL_CONFIG.n_estimators) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="p-4 bg-white rounded-lg border-2 border-green-500">
                <p className="text-sm text-gray-600 mb-1">Prediksi Final:</p>
                <p className="text-3xl font-bold text-green-800">
                  {Object.entries(SAMPLE_PREDICTION.final_votes).sort(([, a], [, b]) => b - a)[0][0]}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Dipilih oleh{" "}
                  <strong>{Object.entries(SAMPLE_PREDICTION.final_votes).sort(([, a], [, b]) => b - a)[0][1]}</strong> dari{" "}
                  {MODEL_CONFIG.n_estimators} pohon keputusan
                </p>
              </div>
            </div>
          </div>

          {/* ── Penjelasan Konsep ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-800 mb-4">Konsep Penting dalam Random Forest</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Bootstrap Sampling",
                  desc: `Random sampling dengan replacement dari ${MODEL_CONFIG.total_training_data} data. Setiap pohon melihat subset data berbeda, menciptakan diversity. Data yang tidak terpilih (~36.8%) menjadi OOB samples untuk validasi internal.`,
                  color: "#2E7D32",
                },
                {
                  title: "Random Feature Selection",
                  desc: `Setiap node split hanya mempertimbangkan √${MODEL_CONFIG.total_features} = ${MODEL_CONFIG.features_per_split} fitur random. Ini mencegah pohon menjadi terlalu mirip (decorrelation) dan mengurangi overfitting.`,
                  color: "#4CAF50",
                },
                {
                  title: "Gini Impurity",
                  desc: `Metrik untuk mengukur ketidakmurnian node. Gini = 0 (pure, satu kelas), Gini = 0.75 (sangat campur). Split dipilih untuk memaksimalkan penurunan Gini. Formula: Gini = 1 - Σ(pi²)`,
                  color: "#81C784",
                },
                {
                  title: "Majority Voting",
                  desc: `Setiap pohon memberikan 1 vote untuk kelas prediksinya. Kelas dengan vote terbanyak menang. Ensemble voting ini lebih robust daripada prediksi single tree dan mengurangi variance.`,
                  color: "#A5D6A7",
                },
                {
                  title: "Out-of-Bag (OOB) Validation",
                  desc: `Sampel yang tidak masuk bootstrap (~36.8%) digunakan untuk validasi tree tersebut. OOB score adalah akurasi agregat dari semua OOB predictions, tanpa perlu data validation terpisah.`,
                  color: "#1976D2",
                },
                {
                  title: "Leaf Purity",
                  desc: `Persentase kelas dominan di leaf node. Leaf dengan purity 90% berarti 90% sampel training di leaf tersebut adalah satu kelas. Semakin tinggi purity, semakin confident prediksi.`,
                  color: "#F57C00",
                },
              ].map((concept, idx) => (
                <div key={idx} className="p-4 rounded-xl border-l-4 bg-gray-50" style={{ borderColor: concept.color }}>
                  <h3 className="font-semibold text-gray-800 mb-2">{concept.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{concept.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Catatan Evaluasi ── */}
          <div className="p-5 bg-yellow-50 border border-yellow-300 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-800 mb-2">Catatan: Evaluasi Model</h3>
                <p className="text-sm text-yellow-800 leading-relaxed">
                  Halaman ini fokus pada <strong>proses training dan prediksi</strong> Random Forest secara detail. Untuk metrik
                  evaluasi model seperti{" "}
                  <strong>Accuracy, Precision, Recall, F1-Score, Confusion Matrix, Cross-Validation, dan OOB Score</strong>,
                  silakan lihat di halaman <strong>Statistik</strong> atau dashboard evaluasi model (akan ditambahkan).
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
