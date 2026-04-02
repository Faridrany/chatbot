import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Search, Filter, Eye } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function DataPengaduan({ onLogout }) {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  // 🔥 FETCH DATA DARI BACKEND
  useEffect(() => {
    fetch("http://localhost:3001/api/pengaduan")
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch((err) => console.error(err));
  }, []);

  // 🔍 FILTER
  const filteredData = data.filter((item) => {
    const matchSearch =
      item.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = selectedCategory === "semua" || item.kategori_prediksi === selectedCategory;

    return matchSearch && matchCategory;
  });

  // 📄 PAGINATION
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // 🎨 STYLE
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
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-2xl mb-4">Data Pengaduan</h2>

            {/* 🔍 FILTER */}
            <div className="flex gap-4 mb-6">
              <Input placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua</SelectItem>
                  <SelectItem value="INFRASTRUKTUR">Infrastruktur</SelectItem>
                  <SelectItem value="LINGKUNGAN">Lingkungan</SelectItem>
                  <SelectItem value="KEAMANAN">Keamanan</SelectItem>
                  <SelectItem value="PELAYANAN">Pelayanan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 📊 TABLE */}
            <table className="w-full border">
              <thead className="bg-green-200">
                <tr>
                  <th className="p-3 text-left">Tanggal</th>
                  <th className="p-3 text-left">Nama</th>
                  <th className="p-3 text-left">Deskripsi</th>
                  <th className="p-3 text-left">Kategori</th>
                  <th className="p-3 text-left">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3">{item.timestamp}</td>
                    <td className="p-3">{item.nama}</td>
                    <td className="p-3">{item.deskripsi}</td>

                    <td className="p-3">
                      <Badge className={getCategoryColor(item.kategori_prediksi)}>{item.kategori_prediksi}</Badge>
                    </td>

                    <td className="p-3">
                      <Button onClick={() => navigate(`/detail/${index}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 📄 PAGINATION */}
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</Button>

              <Button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
