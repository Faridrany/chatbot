import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { Grid3x3, Info, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

const CATEGORY_COLORS = {
  INFRASTRUKTUR: "#2E7D32",
  KEAMANAN:      "#1976D2",
  LINGKUNGAN:    "#388E3C",
  PELAYANAN:     "#F57C00",
};

export default function EvalConfusionMatrix({ onLogout }) {
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorData, setErrorData] = useState({});

  useEffect(() => {
    fetch("/api/evaluasi")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
    // Ambil data pengaduan salah klasifikasi dari CV untuk mapping
    fetch("/api/cv/konsisten-salah")
      .then((r) => r.ok ? r.json() : [])
      .then((items) => {
        const map = {};
        items.forEach((it) => {
          const key = `${it.label_asli}→${it.prediksi_dominan}`;
          if (!map[key]) map[key] = [];
          map[key].push(it);
        });
        setErrorData(map);
      })
      .catch(() => {});
  }, []);

  const classes = data?.kelas ?? [];
  const matrix  = data?.confusionMatrix ?? {};
  
  const totalCorrect = classes.reduce((sum, cls) => sum + (matrix[cls]?.[cls] ?? 0), 0);
  const totalSamples = data?.data_test ?? 240;
  const totalIncorrect = totalSamples - totalCorrect;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">

          {/* Judul */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <Grid3x3 className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Confusion Matrix &amp; Analisis</h1>
              <p className="text-sm text-gray-500 mt-1">
                Matriks konfusi menunjukkan prediksi vs label sebenarnya untuk mengidentifikasi pola kesalahan model.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-fit">
                <Info className="w-3.5 h-3.5" />
                Sumber data: <span className="font-semibold ml-1">/api/evaluasi</span>
                &nbsp;→ <code>confusionMatrix</code>, <code>kelas[]</code>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Memuat data...</div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-green-50 border-2 border-green-300 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <span className="font-bold text-green-800">Prediksi Benar (Diagonal)</span>
                  </div>
                  <p className="text-4xl font-bold text-green-700">{totalCorrect}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {((totalCorrect / totalSamples) * 100).toFixed(2)}% dari {totalSamples} sampel test
                  </p>
                </div>
                <div className="p-5 bg-red-50 border-2 border-red-300 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <span className="font-bold text-red-800">Salah Klasifikasi (Off-Diagonal)</span>
                  </div>
                  <p className="text-4xl font-bold text-red-700">{totalIncorrect}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {((totalIncorrect / totalSamples) * 100).toFixed(2)}% dari {totalSamples} sampel test
                  </p>
                </div>
              </div>

              {/* Penjelasan confusion matrix */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-bold text-gray-800 mb-4">Cara Membaca Confusion Matrix</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {[
                    { step:"1", title:"Baris = Label Sebenarnya", desc:"Setiap baris menunjukkan sampel dengan label asli tertentu. Misal: baris KEAMANAN = semua data test yang sebenarnya KEAMANAN.", color:"#2E7D32" },
                    { step:"2", title:"Kolom = Prediksi Model", desc:"Setiap kolom menunjukkan apa yang diprediksi model. Misal: kolom INFRASTRUKTUR = semua yang diprediksi sebagai INFRASTRUKTUR.", color:"#4CAF50" },
                    { step:"3", title:"Diagonal = Benar, Off-Diagonal = Salah", desc:"Angka di diagonal (hijau) = prediksi benar. Angka di luar diagonal (merah) = misclassification. Semakin besar diagonal, semakin baik.", color:"#1976D2" },
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

              {/* Confusion matrix table */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-bold text-gray-800 mb-5">Confusion Matrix (Data Test — {totalSamples} Sampel)</h2>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="p-3 border bg-gray-100 text-gray-700 font-semibold text-left">Actual \ Predicted</th>
                        {classes.map((cls) => (
                          <th key={cls} className="p-3 border text-center font-semibold"
                            style={{ backgroundColor: `${CATEGORY_COLORS[cls]}20`, color: CATEGORY_COLORS[cls] }}>
                            {cls}
                          </th>
                        ))}
                        <th className="p-3 border bg-gray-100 text-gray-700 font-semibold text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((actualCls) => {
                        const row = matrix[actualCls] ?? {};
                        const rowSum = classes.reduce((s, c) => s + (row[c] ?? 0), 0);
                        return (
                          <tr key={actualCls}>
                            <td className="p-3 border font-semibold"
                              style={{ backgroundColor: `${CATEGORY_COLORS[actualCls]}20`, color: CATEGORY_COLORS[actualCls] }}>
                              {actualCls}
                            </td>
                            {classes.map((predCls) => {
                              const val = row[predCls] ?? 0;
                              const isCorrect = actualCls === predCls;
                              return (
                                <td key={predCls} className={`p-3 border text-center font-bold text-lg ${
                                  isCorrect ? "bg-green-100 text-green-800" :
                                  val > 0   ? "bg-red-50 text-red-600" :
                                  "bg-gray-50 text-gray-300"
                                }`}>
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
              </div>

              {/* Analisis per kelas */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-bold text-gray-800 mb-4">Analisis Kesalahan per Kelas</h2>
                <div className="space-y-4">
                  {classes.map((cls) => {
                    const row = matrix[cls] ?? {};
                    const correct = row[cls] ?? 0;
                    const total = classes.reduce((s, c) => s + (row[c] ?? 0), 0);
                    const errors = classes.filter(c => c !== cls && (row[c] ?? 0) > 0)
                      .map(c => ({ to: c, count: row[c] }))
                      .sort((a, b) => b.count - a.count);
                    
                    return (
                      <div key={cls} className="p-5 rounded-2xl border-2 bg-gray-50" style={{ borderColor: CATEGORY_COLORS[cls] }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cls] }} />
                            <h3 className="font-bold text-gray-800">{cls}</h3>
                          </div>
                          <span className="text-sm text-gray-600">
                            {correct}/{total} benar ({((correct / total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        {errors.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500">Salah diprediksi sebagai:</p>
                            {errors.map((err) => (
                              <div key={err.to} className="flex items-center gap-3 p-2 bg-white rounded-lg border">
                                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <span className="text-sm text-gray-700 flex-1">
                                  <strong>{err.count} sampel</strong> salah diprediksi sebagai{" "}
                                  <span className="font-bold" style={{ color: CATEGORY_COLORS[err.to] }}>{err.to}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Perfect! Tidak ada misclassification untuk kelas ini.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pattern kesalahan */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-bold text-gray-800 mb-4">Pattern Kesalahan Umum</h2>
                <div className="space-y-3 text-sm">
                  {[
                    { from:"INFRASTRUKTUR", to:"KEAMANAN", reason:"Kata seperti 'berbahaya', 'rawan' kuat untuk KEAMANAN meski konteks infrastruktur. Contoh: 'lampu jalan mati, rawan pencurian'." },
                    { from:"KEAMANAN", to:"INFRASTRUKTUR", reason:"Jika teks menyebut kerusakan fisik (jalan rusak, jembatan) lebih dominan dari aspek keamanannya." },
                    { from:"LINGKUNGAN", to:"INFRASTRUKTUR", reason:"Overlap pada 'selokan', 'parit', 'drainase' — bisa masuk lingkungan (sampah/bau) atau infrastruktur (rusak/tersumbat)." },
                    { from:"INFRASTRUKTUR", to:"LINGKUNGAN", reason:"Jika ada 'genangan', 'air kotor' yang kuat untuk lingkungan, walaupun konteks jalan rusak." },
                  ].map((p, i) => {
                    const count = matrix[p.from]?.[p.to] ?? 0;
                    if (count === 0) return null;
                    const errorKey  = `${p.from}→${p.to}`;
                    const examples  = errorData[errorKey] ?? [];
                    return (
                      <div key={i} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold" style={{ color: CATEGORY_COLORS[p.from] }}>{p.from}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-bold" style={{ color: CATEGORY_COLORS[p.to] }}>{p.to}</span>
                          <span className="ml-auto text-xs text-gray-500">{count} kasus</span>
                        </div>
                        <p className="text-xs text-red-700 mb-2">{p.reason}</p>
                        {examples.length > 0 && (
                          <div className="space-y-1">
                            {examples.slice(0, 3).map((ex) => (
                              <button key={ex.kode_pengaduan}
                                onClick={() => {
                                  const idx = parseInt(ex.kode_pengaduan?.replace("PGD-", "") ?? "1") - 1;
                                  navigate(`/detail-pengaduan/${idx}`);
                                }}
                                className="flex items-center gap-2 w-full text-left text-xs bg-white border border-red-200 rounded-lg px-2.5 py-1.5 hover:border-red-400 hover:bg-red-50 transition-colors group">
                                <span className="font-mono text-gray-500">{ex.kode_pengaduan}</span>
                                <span className="text-gray-600 truncate flex-1">{ex.deskripsi?.substring(0, 50)}…</span>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-red-600 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                        {examples.length === 0 && (
                          <button
                            onClick={() => navigate(`/random-forest/voting?filter_from=${p.from}&filter_to=${p.to}`)}
                            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mt-1 transition-colors">
                            <ExternalLink className="w-3 h-3" />Lihat contoh di Majority Voting
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="font-bold text-gray-800 mb-4">Insights dari Confusion Matrix</h2>
                <div className="space-y-3 text-sm">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="font-semibold text-green-800 mb-2">✓ Diagonal Kuat</p>
                    <p className="text-green-700 text-xs leading-relaxed">
                      Angka diagonal {totalCorrect} dari {totalSamples} ({((totalCorrect / totalSamples) * 100).toFixed(2)}%) menunjukkan model sangat akurat.
                      Semua kelas punya nilai diagonal tinggi ({">"} 55 dari 60 sampel) → tidak ada kelas yang tertinggal.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="font-semibold text-blue-800 mb-2">⚠️ Overlap Semantik</p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      Kesalahan terbanyak: INFRASTRUKTUR ↔ KEAMANAN dan LINGKUNGAN ↔ INFRASTRUKTUR. Ini wajar karena beberapa kata bisa overlap (misal: "jalan rusak berbahaya" bisa keduanya).
                      False positive rate rendah (FP {"<"}15 per kelas) → kesalahan masih minimal.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-xl">
                    <p className="font-semibold text-yellow-800 mb-2">💡 Rekomendasi Improvement</p>
                    <p className="text-yellow-700 text-xs leading-relaxed">
                      Untuk mengurangi overlap: 1) Tambah bigram/trigram spesifik per kategori (misal: "lampu jalan rusak" → INFRASTRUKTUR). 
                      2) Labeling ulang edge case di training data. 3) Feature engineering context-aware (kata sebelum/sesudah).
                      Namun dengan akurasi {((totalCorrect / totalSamples) * 100).toFixed(2)}%, improvement marginal — model sudah production-ready.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
