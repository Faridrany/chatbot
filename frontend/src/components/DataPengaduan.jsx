import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Filter, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const CATEGORY_COLOR = {
  INFRASTRUKTUR: "bg-[#2E7D32] text-white",
  LINGKUNGAN: "bg-[#4CAF50] text-white",
  KEAMANAN: "bg-[#A5D6A7] text-gray-900",
  PELAYANAN: "bg-[#81C784] text-white",
};

const LIMIT = 10;

export default function DataPengaduan({ onLogout }) {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // input sementara sebelum debounce
  const [filterKategori, setFilterKategori] = useState("semua");

  // Fetch dari backend — hanya ambil data yang dibutuhkan halaman ini
  const fetchData = useCallback((page, search, kategori) => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit: LIMIT,
      ...(search && { search }),
      ...(kategori !== "semua" && { kategori }),
    });
    fetch(`/api/pengaduan?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);
  // Fetch saat halaman / filter berubah
  useEffect(() => {
    fetchData(currentPage, searchTerm, filterKategori);
  }, [currentPage, searchTerm, filterKategori, fetchData]);

  // Debounce search input — tunggu 400ms setelah user berhenti ketik
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleKategori = (val) => {
    setFilterKategori(val);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * LIMIT;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
        <Header />

        <main className="p-8">
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Data Pengaduan</h2>
              <span className="text-sm text-gray-400">{total} data</span>
            </div>

            {/* Filter */}
            <div className="flex gap-3 mb-6">
              <Input
                placeholder="Cari nama atau deskripsi..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1"
              />
              <Select value={filterKategori} onValueChange={handleKategori}>
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
            ) : items.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Tidak ada data yang cocok.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100 text-green-900">
                      <tr>
                        <th className="p-3 text-left font-semibold w-8">#</th>
                        <th className="p-3 text-left font-semibold">Nama</th>
                        <th className="p-3 text-left font-semibold">No. WA</th>
                        <th className="p-3 text-left font-semibold">Deskripsi</th>
                        <th className="p-3 text-left font-semibold">Kategori</th>
                        <th className="p-3 text-left font-semibold">Confidence</th>
                        <th className="p-3 text-left font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item._id} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-400">{startIndex + idx + 1}</td>
                          <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{item.nama || "-"}</td>
                          <td className="p-3 text-gray-500 whitespace-nowrap">{item.no_wa || "-"}</td>
                          <td className="p-3 text-gray-700 max-w-xs">
                            <p className="line-clamp-2">{item.deskripsi}</p>
                          </td>
                          <td className="p-3">
                            <Badge className={CATEGORY_COLOR[item.kategori_prediksi] ?? "bg-gray-200 text-gray-900"}>
                              {item.kategori_prediksi || "-"}
                            </Badge>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {item.confidence != null ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-green-500 h-1.5 rounded-full"
                                    style={{ width: `${Math.round((item.confidence ?? 0) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-green-700 font-semibold">
                                  {((item.confidence ?? 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              onClick={() => navigate(`/detail-pengaduan/${item._id}`)}
                              className="bg-green-700 hover:bg-green-800 text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-400">
                    Halaman {currentPage} dari {totalPages} &nbsp;·&nbsp; {total} total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || loading}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next <ChevronRight className="w-4 h-4" />
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
