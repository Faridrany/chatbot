import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Filter, Eye, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
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

const STATUS_STYLE = {
  Menunggu: "bg-yellow-50 text-yellow-700 border border-yellow-300",
  Diproses: "bg-blue-50 text-blue-700 border border-blue-300",
  Selesai: "bg-green-50 text-green-700 border border-green-300",
};

const LIMIT = 10;

function ConfidenceBadge({ value }) {
  if (value == null) return <span className="text-gray-300 text-xs">—</span>;
  const pct = (value * 100).toFixed(1);
  const cls =
    value >= 0.75
      ? "bg-green-50 text-green-700 border-green-200"
      : value >= 0.5
        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
        : "bg-red-50 text-red-600 border-red-200";
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{pct}%</span>;
}

export default function DataPengaduan({ onLogout }) {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [confirmDelete, setConfirmDelete] = useState(null); // id yang akan dihapus
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    fetchData(currentPage, searchTerm, filterKategori);
  }, [currentPage, searchTerm, filterKategori, fetchData]);

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
  const handleStatus = (val) => {
    setFilterStatus(val);
    setCurrentPage(1);
  };

  // Filter status dilakukan client-side (server tidak punya filter status)
  const displayItems = filterStatus === "semua" ? items : items.filter((item) => (item.status ?? "Menunggu") === filterStatus);

  // ── Hapus pengaduan ──
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pengaduan/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDelete(null);
        fetchData(currentPage, searchTerm, filterKategori);
      }
    } finally {
      setDeleting(false);
    }
  };

  const startIndex = (currentPage - 1) * LIMIT;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8">
          {/* Modal Konfirmasi Hapus */}
          {confirmDelete !== null && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
                <h3 className="font-bold text-gray-800 text-lg mb-2">Hapus Pengaduan?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Data pengaduan ini akan dihapus permanen dan tidak bisa dikembalikan.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                    Batal
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleDelete(confirmDelete)}
                    disabled={deleting}
                  >
                    {deleting ? "Menghapus..." : "Ya, Hapus"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Data Pengaduan</h2>
                <p className="text-sm text-gray-400 mt-0.5">Hasil klasifikasi model — {total} data</p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Input
                placeholder="Cari nama atau deskripsi..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 min-w-48"
              />
              <Select value={filterKategori} onValueChange={handleKategori}>
                <SelectTrigger className="w-44">
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
              <Select value={filterStatus} onValueChange={handleStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Status</SelectItem>
                  <SelectItem value="Menunggu">Menunggu</SelectItem>
                  <SelectItem value="Diproses">Diproses</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <p className="text-gray-400 text-center py-10">Memuat data...</p>
            ) : displayItems.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Tidak ada data yang cocok.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100 text-green-900">
                      <tr>
                        <th className="p-3 text-left font-semibold w-8">#</th>
                        <th className="p-3 text-left font-semibold">Nama</th>
                        <th className="p-3 text-left font-semibold">Deskripsi</th>
                        <th className="p-3 text-left font-semibold">Kategori</th>
                        <th className="p-3 text-left font-semibold">Confidence</th>
                        <th className="p-3 text-left font-semibold">Status</th>
                        <th className="p-3 text-left font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map((item, idx) => (
                        <tr key={item._id} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-400">{startIndex + idx + 1}</td>
                          <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{item.nama || "-"}</td>
                          <td className="p-3 text-gray-700 max-w-xs">
                            <p className="line-clamp-2">{item.deskripsi}</p>
                          </td>
                          <td className="p-3">
                            <Badge className={CATEGORY_COLOR[item.kategori_prediksi] ?? "bg-gray-200 text-gray-900"}>
                              {item.kategori_prediksi || "-"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <ConfidenceBadge value={item.confidence} />
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[item.status ?? "Menunggu"]}`}
                            >
                              {item.status ?? "Menunggu"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/detail-pengaduan/${item._id}`)}
                                className="bg-green-700 hover:bg-green-800 text-white"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Detail
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-500 hover:bg-red-50"
                                onClick={() => setConfirmDelete(item._id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-400">
                    Halaman {currentPage} dari {totalPages} · {total} total
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
