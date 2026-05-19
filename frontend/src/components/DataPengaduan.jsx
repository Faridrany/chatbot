import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Filter, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function DataPengaduan({ onLogout }) {
  const navigate = useNavigate();

  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState("");
  const [selectedCategory, setSelectedCategory] = useState("semua");
  const [currentPage, setCurrentPage]     = useState(1);

  const itemsPerPage = 8;

  // ── Fetch dari final_processed.json via backend ──
  useEffect(() => {
    fetch("/api/pengaduan")
      .then((res) => res.json())
      .then((res) => { setData(res); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, []);

  // ── Filter ──
  const filteredData = useMemo(() => data.filter((item) => {
    const matchSearch =
      item.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      selectedCategory === "semua" || item.kategori_prediksi === selectedCategory;
    return matchSearch && matchCategory;
  }), [data, searchTerm, selectedCategory]);

  // ── Pagination ──
  const totalPages    = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex    = (currentPage - 1) * itemsPerPage;
  const paginatedData = useMemo(
    () => filteredData.slice(startIndex, startIndex + itemsPerPage),
    [filteredData, startIndex]
  );

  // Reset ke halaman 1 saat filter berubah
  const handleSearch = (val) => { setSearchTerm(val); setCurrentPage(1); };
  const handleCategory = (val) => { setSelectedCategory(val); setCurrentPage(1); };

  const getCategoryColor = (kategori) => {
    switch (kategori) {
      case "INFRASTRUKTUR": return "bg-[#2E7D32] text-white";
      case "LINGKUNGAN":    return "bg-[#4CAF50] text-white";
      case "KEAMANAN":      return "bg-[#A5D6A7] text-gray-900";
      case "PELAYANAN":     return "bg-[#81C784] text-white";
      default:              return "bg-gray-200 text-gray-900";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
        <Header />

        <main className="p-8">
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Data Pengaduan</h2>
              <span className="text-sm text-gray-400">
                {filteredData.length} dari {data.length} data
              </span>
            </div>

            {/* Filter */}
            <div className="flex gap-3 mb-6">
              <Input
                placeholder="Cari nama atau deskripsi..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1"
              />
              <Select value={selectedCategory} onValueChange={handleCategory}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kategori</SelectItem>
                  <SelectItem value="INFRASTRUKTUR">Infrastruktur</SelectItem>
                  <SelectItem value="LINGKUNGAN">Lingkungan</SelectItem>
                  <SelectItem value="KEAMANAN">Keamanan</SelectItem>
                  <SelectItem value="PELAYANAN">Pelayanan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <p className="text-gray-400 text-center py-10">Memuat data...</p>
            ) : filteredData.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Tidak ada data yang cocok.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100 text-green-900">
                      <tr>
                        <th className="p-3 text-left font-semibold w-8">#</th>
                        <th className="p-3 text-left font-semibold">Tanggal</th>
                        <th className="p-3 text-left font-semibold">Nama</th>
                        <th className="p-3 text-left font-semibold">Deskripsi</th>
                        <th className="p-3 text-left font-semibold">Teks Processed</th>
                        <th className="p-3 text-left font-semibold">Kategori</th>
                        <th className="p-3 text-left font-semibold">Akurasi</th>
                        <th className="p-3 text-left font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item, pageIdx) => {
                        // Index asli dalam array data (bukan filtered) untuk navigasi
                        const globalIndex = data.indexOf(item);
                        return (
                          <tr key={globalIndex} className="border-t hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-gray-400">{startIndex + pageIdx + 1}</td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">{item.timestamp}</td>
                            <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{item.nama}</td>
                            <td className="p-3 text-gray-700 max-w-xs">
                              <p className="line-clamp-2">{item.deskripsi}</p>
                            </td>
                            <td className="p-3 text-gray-500 max-w-xs">
                              <p className="line-clamp-2 font-mono text-xs">{item.processed}</p>
                            </td>
                            <td className="p-3">
                              <Badge className={getCategoryColor(item.kategori_prediksi)}>
                                {item.kategori_prediksi}
                              </Badge>
                            </td>
                            <td className="p-3 text-green-700 font-semibold">
                              {((item.akurasi_model ?? 0) * 100).toFixed(0)}%
                            </td>
                            <td className="p-3">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/detail-pengaduan/${globalIndex}`)}
                                className="bg-green-700 hover:bg-green-800 text-white"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Detail
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-400">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
