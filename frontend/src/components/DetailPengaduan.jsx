import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const STATUS_STYLE = {
  Menunggu: "bg-yellow-50 text-yellow-700 border border-yellow-300",
  Diproses: "bg-blue-50 text-blue-700 border border-blue-300",
  Selesai: "bg-green-50 text-green-700 border border-green-300",
};

const CATEGORY_COLOR = {
  INFRASTRUKTUR: "bg-[#2E7D32] text-white",
  LINGKUNGAN: "bg-[#4CAF50] text-white",
  KEAMANAN: "bg-[#A5D6A7] text-gray-900",
  PELAYANAN: "bg-[#81C784] text-white",
};

export default function DetailPengaduan({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Menunggu");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/pengaduan/${id}/processed`)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setStatus(res.status ?? "Menunggu");
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSaveStatus = async (newStatus) => {
    setStatus(newStatus);
    setSavingStatus(true);
    setStatusSaved(false);
    try {
      await fetch(`/api/pengaduan/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 2000);
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) return <div className="p-10 text-gray-500">Memuat data...</div>;
  if (!data) return <div className="p-10 text-red-500">Data tidak ditemukan.</div>;

  // Pipeline hanya tersedia untuk data yang memiliki informasi pipeline lengkap
  const hasPipeline = data.pipeline && Object.values(data.pipeline).some((val) => val != null && val !== "");

  const pipelineSource = hasPipeline
    ? {
        deskripsi: data.deskripsi,
        casefolded: data.pipeline?.casefolded,
        cleaned: data.pipeline?.cleaned,
        normalized: data.pipeline?.normalized,
        tokenized: data.pipeline?.tokenized,
        stop_removed: data.pipeline?.stop_removed,
        stemmed: data.pipeline?.stemmed,
        final_text: data.pipeline?.final_text ?? data.processed,
      }
    : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 ml-64">
        <Header />

        <main className="p-8 max-w-4xl">
          <Button variant="outline" onClick={() => navigate("/data-pengaduan")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          {/* Info Pengaduan */}
          <div className="bg-white p-6 rounded-2xl shadow mb-6">
            <h1 className="text-xl font-bold text-gray-800 mb-4">Detail Pengaduan</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nama Pelapor</p>
                <p className="font-semibold text-gray-800">{data.nama}</p>
              </div>
              {data.no_wa && (
                <div>
                  <p className="text-gray-500">No. WhatsApp</p>
                  <p className="font-semibold text-gray-800">{data.no_wa}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Tanggal</p>
                <p className="font-semibold text-gray-800">{data.timestamp}</p>
              </div>
              <div>
                <p className="text-gray-500">Kategori</p>
                <Badge className={`mt-1 ${CATEGORY_COLOR[data.kategori_prediksi] || "bg-gray-200 text-gray-900"}`}>
                  {data.kategori_prediksi}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Status Pengaduan</p>
                <div className="flex items-center gap-3">
                  <Select value={status} onValueChange={handleSaveStatus} disabled={savingStatus}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Menunggu">Menunggu</SelectItem>
                      <SelectItem value="Diproses">Diproses</SelectItem>
                      <SelectItem value="Selesai">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_STYLE[status]}`}>{status}</span>
                  {savingStatus && <span className="text-xs text-gray-400">Menyimpan...</span>}
                  {statusSaved && <span className="text-xs text-green-600 font-semibold">✓ Tersimpan</span>}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-500 text-sm">Deskripsi Pengaduan</p>
              <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-lg border text-sm leading-relaxed">{data.deskripsi}</p>
            </div>
          </div>

          {/* Probability Breakdown for All Categories */}
          {data.proba_all && (
            <div className="bg-white p-6 rounded-2xl shadow mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Rincian Probabilitas Semua Kategori</h2>
              <p className="text-sm text-gray-500 mb-4">
                Skor probabilitas prediksi untuk setiap kategori. Kategori dengan skor tertinggi dipilih sebagai hasil
                klasifikasi.
              </p>

              <div className="space-y-3">
                {Object.entries(data.proba_all)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, prob]) => {
                    const isSelected = cat === data.kategori_prediksi;
                    const pct = (prob * 100).toFixed(1);
                    return (
                      <div
                        key={cat}
                        className={`p-3 rounded-lg border ${isSelected ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`${CATEGORY_COLOR[cat] || "bg-gray-200 text-gray-900"}`}>{cat}</Badge>
                            {isSelected && <span className="text-xs font-semibold text-green-600">✓ Terpilih</span>}
                          </div>
                          <span className="text-sm font-bold text-gray-700">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${isSelected ? "bg-green-500" : "bg-gray-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <strong>Catatan:</strong> Model memilih kategori <strong>{data.kategori_prediksi}</strong> karena memiliki
                probabilitas tertinggi. Skor ini menunjukkan tingkat keyakinan model dalam prediksi.
              </div>
            </div>
          )}

          {/* Teks Hasil Preprocessing & Pipeline Detail */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Detail Preprocessing Teks</h2>
            <p className="text-sm text-gray-500 mb-4">
              Tahapan transformasi teks dari input asli hingga siap diklasifikasi oleh model.
            </p>

            {/* Hasil Akhir Preprocessing */}
            {data.processed && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">✓ Hasil Akhir (Teks untuk Model)</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-mono text-gray-800">{data.processed}</p>
                </div>
              </div>
            )}

            {/* Pipeline Steps */}
            {hasPipeline && pipelineSource && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Tahapan Preprocessing:</h3>

                {/* 1. Teks Asli */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 mb-1">1. Teks Asli</p>
                  <p className="text-sm text-gray-800">{pipelineSource.deskripsi}</p>
                </div>

                {/* 2. Cleaning */}
                {pipelineSource.cleaned && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-1">2. Cleaning (hapus karakter khusus & URL)</p>
                    <p className="text-sm text-gray-800">{pipelineSource.cleaned}</p>
                  </div>
                )}

                {/* 3. Case Folding */}
                {pipelineSource.casefolded && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-1">3. Case Folding (huruf kecil semua)</p>
                    <p className="text-sm text-gray-800">{pipelineSource.casefolded}</p>
                  </div>
                )}

                {/* 4. Tokenizing */}
                {pipelineSource.tokenized && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-1">4. Tokenizing (pecah kata)</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(pipelineSource.tokenized) ? (
                        pipelineSource.tokenized.map((token, i) => (
                          <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono">
                            {token}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-800">{pipelineSource.tokenized}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Normalization */}
                {pipelineSource.normalized && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-1">5. Normalization (kata baku)</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(pipelineSource.normalized) ? (
                        pipelineSource.normalized.map((token, i) => (
                          <span key={i} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-mono">
                            {token}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-800">{pipelineSource.normalized}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Stopword Removal */}
                {pipelineSource.stop_removed && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-1">6. Stopword Removal (hapus kata umum)</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(pipelineSource.stop_removed) ? (
                        pipelineSource.stop_removed.map((token, i) => (
                          <span key={i} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-mono">
                            {token}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-800">{pipelineSource.stop_removed}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. Stemming */}
                {pipelineSource.stemmed && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-1">7. Stemming (bentuk dasar kata)</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(pipelineSource.stemmed) ? (
                        pipelineSource.stemmed.map((token, i) => (
                          <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-mono">
                            {token}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-800">{pipelineSource.stemmed}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasPipeline && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                ℹ️ Detail tahapan preprocessing tidak tersedia untuk data ini. Hanya teks hasil akhir yang ditampilkan di atas.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
