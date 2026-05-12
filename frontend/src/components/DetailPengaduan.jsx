import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const PIPELINE_STEPS = [
  { key: "deskripsi",      label: "Teks Asli",            desc: "Input mentah dari pelapor" },
  { key: "casefolded",     label: "Case Folding",          desc: "Semua huruf diubah ke huruf kecil" },
  { key: "cleaned",        label: "Cleaning",              desc: "Karakter khusus & angka dihapus" },
  { key: "normalized",     label: "Normalisasi",           desc: "Kata tidak baku diubah ke bentuk baku" },
  { key: "tokenized",      label: "Tokenisasi",            desc: "Teks dipecah menjadi token kata" },
  { key: "stop_removed",   label: "Stopword Removal",      desc: "Kata umum tidak bermakna dihapus" },
  { key: "stemmed",        label: "Stemming",              desc: "Kata dikembalikan ke bentuk dasar" },
  { key: "final_text",     label: "Hasil Akhir",           desc: "Teks siap diproses model ML" },
];

const CATEGORY_COLOR = {
  INFRASTRUKTUR: "bg-[#2E7D32] text-white",
  LINGKUNGAN:    "bg-[#4CAF50] text-white",
  KEAMANAN:      "bg-[#A5D6A7] text-gray-900",
  PELAYANAN:     "bg-[#81C784] text-white",
};

function renderValue(val) {
  if (Array.isArray(val)) {
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {val.map((token, i) => (
          <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-mono">
            {token}
          </span>
        ))}
      </div>
    );
  }
  return <p className="mt-1 text-gray-800 font-mono text-sm break-words">{val}</p>;
}

export default function DetailPengaduan({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pengaduan/${id}/processed`)
      .then((res) => res.json())
      .then((res) => { setData(res); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [id]);

  if (loading) return <div className="p-10 text-gray-500">Memuat data...</div>;
  if (!data)   return <div className="p-10 text-red-500">Data tidak ditemukan.</div>;

  // Pipeline selalu ada — final_text dari field processed, sisanya dari file pipeline
  const pipelineSource = {
    deskripsi:    data.deskripsi,
    casefolded:   data.pipeline?.casefolded,
    cleaned:      data.pipeline?.cleaned,
    normalized:   data.pipeline?.normalized,
    tokenized:    data.pipeline?.tokenized,
    stop_removed: data.pipeline?.stop_removed,
    stemmed:      data.pipeline?.stemmed,
    final_text:   data.pipeline?.final_text ?? data.processed,
  };

  const hasPipeline = PIPELINE_STEPS.some(
    (s) => s.key !== "deskripsi" && s.key !== "final_text" && pipelineSource[s.key] != null
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
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
                <p className="text-gray-500">Akurasi Model</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(data.akurasi_model ?? 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-green-700">
                    {((data.akurasi_model ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-500 text-sm">Deskripsi Pengaduan</p>
              <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-lg border text-sm leading-relaxed">
                {data.deskripsi}
              </p>
            </div>
          </div>

          {/* Pipeline Preprocessing */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Pipeline Preprocessing</h2>
            <p className="text-sm text-gray-500 mb-6">
              Tahapan transformasi teks sebelum diklasifikasikan oleh model.
            </p>

            <div className="space-y-0">
              {PIPELINE_STEPS.map((step, i) => {
                const val = pipelineSource[step.key];
                const isLast = i === PIPELINE_STEPS.length - 1;
                const available = val != null;

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Connector line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        available
                          ? isLast
                            ? "bg-green-700 text-white"
                            : "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}>
                        {i + 1}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 my-1 ${available ? "bg-green-300" : "bg-gray-200"}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-5 ${isLast ? "" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${available ? "text-gray-800" : "text-gray-400"}`}>
                          {step.label}
                        </span>
                        {!isLast && available && (
                          <ChevronRight className="w-3 h-3 text-green-400" />
                        )}
                        <span className="text-xs text-gray-400">{step.desc}</span>
                      </div>

                      {available ? (
                        <div className={`mt-1 p-3 rounded-lg border text-sm ${
                          isLast
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}>
                          {renderValue(val)}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400 italic">
                          {hasPipeline ? "Data tidak tersedia untuk entri ini" : "—"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasPipeline && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                ⚠️ Data tahapan pipeline (casefolding, cleaning, dll) tidak tersedia untuk pengaduan ini karena preprocessing dilakukan sebelum data ini masuk. Hanya teks asli dan hasil akhir yang ditampilkan.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
