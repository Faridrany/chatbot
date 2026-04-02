import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function DetailPengaduan({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  // 🔥 FETCH DETAIL
  useEffect(() => {
    fetch(`http://localhost:3001/api/pengaduan/${id}`)
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch((err) => console.error(err));
  }, [id]);

  if (!data) return <div className="p-10">Loading...</div>;

  const getCategoryColor = (kategori) => {
    switch (kategori) {
      case "INFRASTRUKTUR":
        return "bg-[#2E7D32] text-white";
      case "LINGKUNGAN":
        return "bg-[#4CAF50] text-white";
      case "KEAMANAN":
        return "bg-[#A5D6A7] text-gray-900";
      case "PELAYANAN":
        return "bg-[#81C784] text-white";
      default:
        return "bg-gray-200 text-gray-900";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
        <Header />

        <main className="p-8">
          <Button onClick={() => navigate("/data-pengaduan")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="bg-white p-6 mt-6 rounded-xl shadow">
            <h1 className="text-xl mb-4">Detail Pengaduan</h1>

            <p>
              <b>Nama:</b> {data.nama}
            </p>
            <p>
              <b>Deskripsi:</b> {data.deskripsi}
            </p>

            <p className="mt-3">
              <b>Kategori:</b> <Badge className={getCategoryColor(data.kategori_prediksi)}>{data.kategori_prediksi}</Badge>
            </p>

            <p className="mt-3">
              <b>Akurasi Model:</b> {data.akurasi_model * 100}%
            </p>

            <p className="mt-3">
              <b>Tanggal:</b> {data.timestamp}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
