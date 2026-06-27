import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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

const CAT_COLOR_HEX = {
  INFRASTRUKTUR: "#2E7D32",
  KEAMANAN: "#1976D2",
  LINGKUNGAN: "#388E3C",
  PELAYANAN: "#F57C00",
};

export default function DetailPengaduanBaru({ onLogout }) {
  const { idx } = useParams();
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState("Menunggu");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    fetch(`/api/pengaduan-baru/${idx}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setStatus(d?.status ?? "Menunggu"); setLoading(false); })
      .catch(() => setLoading(false));
  }, [idx]);

  const handleSaveStatus = async (newStatus) => {
    setStatus(newStatus); setSaving(true); setSaved(false);
    try {
      await fetch(`/api/pengaduan-baru/${idx}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-gray-500">Memuat data...</div>;
  if (!data)   return <div className="p-10 text-red-500">Data tidak ditemukan.</div>;

  const sortedProba = data.proba_all
    ? Object.entries(data.proba_all).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 max-w-3xl">
          <Button variant="outline" onClick={() => navigate("/data-pengaduan")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />Kembali
          </Button>

          {/* Badge data baru */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-300 rounded-full text-xs font-semibold text-blue-700">
              📱 Pengaduan dari WhatsApp Chatbot
            </span>
          </div>

          {/* Info Pengaduan */}
          <div className="bg-white p-6 rounded-2xl shadow mb-6">
            <h1 className="text-xl font-bold text-gray-800 mb-4">Detail Pengaduan</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nama Pelapor</p>
                <p className="font-semibold text-gray-800">{data.nama}</p>
              </div>
              <div>
                <p className="text-gray-500">No. WhatsApp</p>
                <p className="font-semibold text-gray-800">{data.no_wa || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Tanggal</p>
                <p className="font-semibold text-gray-800">{data.timestamp}</p>
              </div>
              <div>
                <p className="text-gray-500">Kategori Prediksi</p>
                <Badge className={`mt-1 ${CATEGORY_COLOR[data.kategori_prediksi] || "bg-gray-200 text-gray-900"}`}>
                  {data.kategori_prediksi}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Confidence</p>
                <p className="font-semibold text-gray-800">
                  {data.confidence ? `${(data.confidence * 100).toFixed(2)}%` : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Status Pengaduan</p>
                <div className="flex items-center gap-3">
                  <Select value={status} onValueChange={handleSaveStatus} disabled={saving}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Menunggu">Menunggu</SelectItem>
                      <SelectItem value="Diproses">Diproses</SelectItem>
                      <SelectItem value="Selesai">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_STYLE[status]}`}>{status}</span>
                  {saving && <span className="text-xs text-gray-400">Menyimpan...</span>}
                  {saved  && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Tersimpan</span>}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-500 text-sm">Deskripsi Pengaduan</p>
              <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-lg border text-sm leading-relaxed">{data.deskripsi}</p>
            </div>
          </div>

          {/* Hasil Klasifikasi */}
          <div className="bg-white p-6 rounded-2xl shadow mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Hasil Klasifikasi Model</h2>
            <div className="p-4 rounded-xl border-2 mb-4" style={{ borderColor: CAT_COLOR_HEX[data.kategori_prediksi] ?? "#757575", backgroundColor: `${CAT_COLOR_HEX[data.kategori_prediksi] ?? "#757575"}10` }}>
              <p className="text-sm text-gray-500 mb-1">Kategori Prediksi</p>
              <p className="text-2xl font-bold" style={{ color: CAT_COLOR_HEX[data.kategori_prediksi] ?? "#374151" }}>
                {data.kategori_prediksi}
              </p>
              {data.confidence && (
                <p className="text-sm text-gray-600 mt-1">
                  Confidence: <strong>{(data.confidence * 100).toFixed(2)}%</strong>
                </p>
              )}
            </div>

            {/* Distribusi probabilitas jika ada */}
            {sortedProba.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-600 mb-2">Distribusi Probabilitas</p>
                {sortedProba.map(([cat, prob]) => {
                  const isSelected = cat === data.kategori_prediksi;
                  const pct = (prob * 100).toFixed(1);
                  const color = CAT_COLOR_HEX[cat] ?? "#757575";
                  return (
                    <div key={cat} className={`p-3 rounded-lg border ${isSelected ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-sm font-medium text-gray-700">{cat}</span>
                          {isSelected && <span className="text-xs text-green-600 font-semibold">✓ Terpilih</span>}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <strong>Catatan:</strong> Pengaduan ini diklasifikasi otomatis oleh model Random Forest.
              Tidak ada label asli (ground truth) karena ini adalah pengaduan baru dari WhatsApp.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
