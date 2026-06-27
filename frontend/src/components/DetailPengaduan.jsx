import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ArrowLeft, ArrowRight, Cpu, BarChart3, TreeDeciduous, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
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
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/pengaduan/${id}/processed`)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setStatus(res.status ?? "Menunggu");
        setLoading(false);
        // Ambil kode_pengaduan lalu fetch summary
        const kode = res.kode_pengaduan;
        if (kode) {
          setSummaryLoading(true);
          fetch(`/api/summary-pengaduan/${kode}`)
            .then((r) => r.ok ? r.json() : null)
            .then((s) => { setSummary(s); setSummaryLoading(false); })
            .catch(() => setSummaryLoading(false));
        }
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

          {/* ── BAGIAN 2: RINGKASAN TAHAPAN KLASIFIKASI ── */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-700" />
              Ringkasan Tahapan Klasifikasi
            </h2>

            {summaryLoading && (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                <RefreshCw className="w-4 h-4 animate-spin" />Memuat ringkasan...
              </div>
            )}

            {!summaryLoading && summary && (
              <div className="space-y-3">
                {/* CARD 1: Preprocessing */}
                <div className="bg-white rounded-2xl shadow border-l-4 border-[#E53935] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="font-bold text-gray-800">Preprocessing Teks</span>
                    </div>
                    <button
                      onClick={() => navigate(`/preprocessing?highlight=${data.kode_pengaduan}`)}
                      className="flex items-center gap-1 text-xs text-green-700 font-semibold hover:text-green-900 transition-colors">
                      Lihat Detail <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 shrink-0">Teks Asli</span>
                      <span className="text-gray-700 font-mono text-xs truncate">
                        {summary.preprocessing.teks_asli?.substring(0, 65)}{summary.preprocessing.teks_asli?.length > 65 ? "…" : ""}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 shrink-0">Teks Akhir</span>
                      <span className="text-green-700 font-mono text-xs truncate">
                        {summary.preprocessing.teks_akhir?.substring(0, 65)}{summary.preprocessing.teks_akhir?.length > 65 ? "…" : ""}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 shrink-0">Total Token</span>
                      <span className="font-bold text-gray-800">{summary.preprocessing.total_token} token</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: TF-IDF */}
                <div className="bg-white rounded-2xl shadow border-l-4 border-[#1976D2] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-bold text-gray-800">Bobot TF-IDF</span>
                    </div>
                    <button
                      onClick={() => navigate(`/ekstraksi/final-processed?highlight=${data.kode_pengaduan}`)}
                      className="flex items-center gap-1 text-xs text-green-700 font-semibold hover:text-green-900 transition-colors">
                      Lihat Detail <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-28 shrink-0">Term Aktif</span>
                      <span className="font-bold text-gray-800">{summary.tfidf.term_aktif} term</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block mb-1">Term Tertinggi</span>
                      <div className="space-y-1.5">
                        {summary.tfidf.top_terms.map((t, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-mono text-xs text-blue-700 w-24 shrink-0">• {t.term}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, t.score * 100 * 2.5)}%` }} />
                            </div>
                            <span className="font-mono text-xs font-bold text-blue-700 w-14 text-right">{t.score.toFixed(4)}</span>
                          </div>
                        ))}
                        {summary.tfidf.top_terms.length === 0 && (
                          <span className="text-xs text-gray-400 italic">Data TF-IDF belum tersedia</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 3: Majority Vote */}
                <div className="bg-white rounded-2xl shadow border-l-4 border-[#2E7D32] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                        <TreeDeciduous className="w-4 h-4 text-green-700" />
                      </div>
                      <span className="font-bold text-gray-800">Majority Vote &amp; Hasil Klasifikasi</span>
                    </div>
                    <button
                      onClick={() => navigate(`/random-forest/voting?highlight=${data.kode_pengaduan}`)}
                      className="flex items-center gap-1 text-xs text-green-700 font-semibold hover:text-green-900 transition-colors">
                      Lihat Detail <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  {summary.majority_vote ? (
                    <div className="space-y-3">
                      {/* Distribusi vote */}
                      <div>
                        <span className="text-xs text-gray-400 block mb-1.5">Distribusi Vote</span>
                        <div className="space-y-1.5">
                          {(summary.majority_vote.distribusi ?? []).slice(0, 4).map((d) => {
                            const CAT_COLORS = {
                              INFRASTRUKTUR: "#2E7D32", KEAMANAN: "#1976D2",
                              LINGKUNGAN: "#388E3C", PELAYANAN: "#F57C00",
                            };
                            const color = CAT_COLORS[d.kategori] ?? "#757575";
                            return (
                              <div key={d.kategori} className="flex items-center gap-2">
                                <span className="text-xs font-semibold w-28 shrink-0" style={{ color }}>{d.kategori}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                  <div className="h-3 rounded-full transition-all" style={{ width: `${d.persen}%`, backgroundColor: color }} />
                                </div>
                                <span className="text-xs text-gray-600 font-mono w-20 text-right">{d.jumlah} pohon ({d.persen}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Prediksi akhir */}
                      <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-sm">
                        <div>
                          <span className="text-xs text-gray-400 block">Prediksi Akhir</span>
                          <Badge className={`mt-1 ${CATEGORY_COLOR[summary.majority_vote.hasil] || "bg-gray-200 text-gray-900"}`}>
                            {summary.majority_vote.hasil}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block">Confidence</span>
                          <span className="font-bold text-gray-800">{summary.majority_vote.confidence?.toFixed(2)}%</span>
                        </div>
                        {summary.majority_vote.label_asli && summary.majority_vote.label_asli !== "-" && (
                          <div>
                            <span className="text-xs text-gray-400 block">Status</span>
                            {summary.majority_vote.benar
                              ? <span className="flex items-center gap-1 text-green-700 font-semibold text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Benar</span>
                              : <span className="flex items-center gap-1 text-red-600 font-semibold text-xs"><XCircle className="w-3.5 h-3.5" />Salah</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Data majority vote belum tersedia.</p>
                  )}
                </div>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
