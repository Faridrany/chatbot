import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ArrowLeft, User, Calendar, Tag, BarChart2, FileText, CheckCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

// Mock detail data
const mockDetailData = {
  1: {
    id: 1,
    tanggal: "2024-11-23 14:30",
    pengirim: "Budi Santoso",
    telepon: "0812-3456-7890",
    alamat: "Jl. Raya Samboja No. 45, Samboja Kuala",
    deskripsi: "Jalan berlubang di Jl. Raya Samboja...",
    kategori: "Infrastruktur",
    status: "Baru",
    confidence: 92.5,
    mlDetails: {
      model: "Random Forest Classifier",
      features: ["jalan", "lubang", "berbahaya", "kecelakaan", "diperbaiki"],
      predictions: [
        { kategori: "Infrastruktur", confidence: 92.5 },
        { kategori: "Lingkungan", confidence: 5.2 },
        { kategori: "Keamanan", confidence: 2.1 },
        { kategori: "Pelayanan", confidence: 0.2 },
      ],
    },
    catatan: "",
    lampiran: ["foto-jalan-rusak-1.jpg", "foto-jalan-rusak-2.jpg"],
  },
};

export default function DetailPengaduan({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = mockDetailData[id || "1"] || mockDetailData["1"];

  const [status, setStatus] = useState(data.status);
  const [catatan, setCatatan] = useState(data.catatan);

  const getCategoryColor = (kategori) => {
    switch (kategori) {
      case "Infrastruktur":
        return "bg-[#2E7D32] text-white";
      case "Lingkungan":
        return "bg-[#4CAF50] text-white";
      case "Keamanan":
        return "bg-[#A5D6A7] text-gray-900";
      case "Pelayanan":
        return "bg-[#81C784] text-white";
      default:
        return "bg-gray-200 text-gray-900";
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleSave = () => {
    alert("Data berhasil disimpan!");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
        <Header />

        <main className="p-8">
          <Button onClick={() => navigate("/data-pengaduan")} variant="outline" className="mb-6 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Data Pengaduan
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow">
                <h1>Detail Pengaduan #{data.id}</h1>
                <Badge className={getCategoryColor(data.kategori)}>{data.kategori}</Badge>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow">
                <h3>Deskripsi</h3>
                <p>{data.deskripsi}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow">
                <h3>Update</h3>

                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baru">Baru</SelectItem>
                    <SelectItem value="Diproses">Diproses</SelectItem>
                    <SelectItem value="Selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} />

                <Button onClick={handleSave}>Simpan</Button>
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <div className="bg-white p-6 rounded-2xl shadow">
                <h3>ML Result</h3>
                <p>{data.kategori}</p>
                <p>{data.confidence}%</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
