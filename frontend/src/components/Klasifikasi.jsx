import { useEffect, useState, useMemo } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Filter, Cpu, RefreshCw, CheckCircle2, Clock, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const CATEGORY_COLOR = {
  INFRASTRUKTUR: "bg-[#2E7D32] text-white",
  LINGKUNGAN:    "bg-[#4CAF50] text-white",
  KEAMANAN:      "bg-[#A5D6A7] text-gray-900",
  PELAYANAN:     "bg-[#81C784] text-white",
};

const ITEMS_PER_PAGE = 10;

export default function Klasifikasi({ onLogout }) {
  const [dataBaru, setDataBaru]           = useState([]);
  const [hasilPrediksi, setHasilPrediksi] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [classifying, setClassifying]     = useState(false);
  const [classifyStatus, setClassifyStatus] = useState(null); // "success" | "error" | null
  const [classifyMsg, setClassifyMsg]     = useState("");
  const [searchTerm, setSearchTerm]       = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [currentPage, setCurrentPage]     = useState(1);

  // ── Fetch data baru (belum diklasifikasi) & hasil prediksi ──
  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/data-baru").then((r) => r.json()),
      fetch("/api/hasil-prediksi").then((r) => r.json()),
    ])
      .then(([baru, prediksi]) => {
        setDataBaru(Array.isArray(baru) ? baru : []);
        setHasilPrediksi(Array.isArray(prediksi) ? prediksi : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchData(); }, []);

  // ── Gabungkan tampilan: hasil prediksi (sudah terklasifikasi) + data baru (belum) ──
  const allData = useMemo(() => {
    // Hasil prediksi sudah punya kategori_prediksi
    const sudah = hasilPrediksi.map((item) => ({ ...item, status: "classified" }));
    // Data baru belum punya kategori
    const belum = dataBaru
      .filter((item) => !hasilPrediksi.some((p) => p.deskripsi === item.deskripsi))
      .map((item) => ({ ...item, status: "pending", kategori_prediksi: null }));
    return [...belum, ...sudah];
  }, [dataBaru, hasilPrediksi]);

  // ── Filter ──
  const filteredData = useMemo(() => allData.filter((item) => {
    const matchSearch =
      item.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKategori =
      filterKategori === "semua" ||
      (filterKategori === "pending" && item.status === "pending") ||
      item.kategori_prediksi === filterKategori;
    return matchSearch && matchKategori;
  }), [allData, searchTerm, filterKategori]);

  // ── Pagination ──
  const totalPages    = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const startIndex    = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch   = (val) => { setSearchTerm(val);   setCurrentPage(1); };
  const handleKategori = (val) => { setFilterKategori(val); setCurrentPage(1); };

  // ── Klasifikasi pengaduan baru ──
  const handleKlasifikasi = async () => {
    if (dataBaru.length === 0) {
      setClassifyStatus("error");
      setClassifyMsg("Tidak ada pengaduan baru untuk diklasifikasi.");
      return;
    }

    setClassifying(true);
    setClassifyStatus(null);
    setClassifyMsg("");

    try {
      const res = await fetch("/api/klasifikasi", { method: "POST" });
      const json = await res.json();

      if (res.ok && json.success) {
        setClassifyStatus("success");
        setClassifyMsg(`${json.jumlah ?? dataBaru.length} pengaduan berhasil diklasifikasi.`);
        fetchData(); // refresh data
      } else {
        setClassifyStatus("error");
        setClassifyMsg(json.error ?? "Klasifikasi gagal. Coba lagi.");
      }
    } catch (err) {
      setClassifyStatus("error");
      setClassifyMsg("Tidak dapat terhubung ke server.");
    } finally {
      setClassifying(false);
    }
  };

  const pendingCount    = dataBaru.filter((d) => !hasilPrediksi.some((p) => p.deskripsi === d.deskripsi)).length;
  const classifiedCount = hasilPrediksi.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
        <Header />

        <main className="p-8">
          {/* Header + Tombol */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Klasifikasi Pengaduan</h2>
              <p className="text-sm text-gray-500 mt-1">
                Pengaduan masuk dari WhatsApp chatbot — klasifikasi otomatis menggunakan model Random Forest
              </p>
            </div>
            <Button
              onClick={handleKlasifikasi}
              disabled={classifying || pendingCount === 0}
              className="bg-[#2E7D32] hover:bg-green-800 text-white gap-2 px-5"
            >
              {classifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Cpu className="w-4 h-4" />
              )}
              {classifying ? "Mengklasifikasi..." : "Klasifikasi Sekarang"}
            </Button>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-yellow-400">
              <p className="text-sm text-gray-500">Belum Diklasifikasi</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-green-500">
              <p className="text-sm text-gray-500">Sudah Diklasifikasi</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{classifiedCount}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-blue-400">
              <p className="text-sm text-gray-500">Total Pengaduan Baru</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{dataBaru.length}</p>
            </div>
          </div>

          {/* Notifikasi hasil klasifikasi */}
          {classifyStatus === "success" && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-300 text-green-800 rounded-xl px-4 py-3 mb-5 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {classifyMsg}
            </div>
          )}
          {classifyStatus === "error" && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {classifyMsg}
            </div>
          )}

          {/* Tabel pengaduan */}
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-700">Daftar Pengaduan Baru</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="text-gray-400 hover:text-green-700 transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400">
                  {filteredData.length} dari {allData.length} data
                </span>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-3 mb-5">
              <Input
                placeholder="Cari nama atau deskripsi..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1"
              />
              <Select value={filterKategori} onValueChange={handleKategori}>
                <SelectTrigger className="w-52">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua</SelectItem>
                  <SelectItem value="pending">Belum Diklasifikasi</SelectItem>
                  <SelectItem value="INFRASTRUKTUR">Infrastruktur</SelectItem>
                  <SelectItem value="LINGKUNGAN">Lingkungan</SelectItem>
                  <SelectItem value="KEAMANAN">Keamanan</SelectItem>
                  <SelectItem value="PELAYANAN">Pelayanan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <p className="text-gray-400 text-center py-12">Memuat data...</p>
            ) : allData.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada pengaduan baru dari WhatsApp</p>
                <p className="text-sm mt-1">Pengaduan yang dikirim lewat chatbot akan muncul di sini</p>
              </div>
            ) : filteredData.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Tidak ada data yang cocok dengan filter.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100 text-green-900">
                      <tr>
                        <th className="p-3 text-left font-semibold w-8">#</th>
                        <th className="p-3 text-left font-semibold">Nama</th>
                        <th className="p-3 text-left font-semibold">No. WA</th>
                        <th className="p-3 text-left font-semibold">Deskripsi Pengaduan</th>
                        <th className="p-3 text-left font-semibold">Waktu</th>
                        <th className="p-3 text-left font-semibold">Kategori</th>
                        <th className="p-3 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-400">{startIndex + idx + 1}</td>
                          <td className="p-3 font-medium text-gray-800 whitespace-nowrap">
                            {item.nama || "-"}
                          </td>
                          <td className="p-3 text-gray-500 whitespace-nowrap">
                            {(item.no_wa || "-").replace("@c.us", "")}
                          </td>
                          <td className="p-3 text-gray-700 max-w-sm">
                            <p className="line-clamp-2">{item.deskripsi}</p>
                          </td>
                          <td className="p-3 text-gray-400 whitespace-nowrap text-xs">
                            {item.timestamp || "-"}
                          </td>
                          <td className="p-3">
                            {item.kategori_prediksi ? (
                              <Badge className={CATEGORY_COLOR[item.kategori_prediksi] ?? "bg-gray-200 text-gray-800"}>
                                {item.kategori_prediksi}
                              </Badge>
                            ) : (
                              <span className="text-gray-300 text-xs italic">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {item.status === "classified" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Terklasifikasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
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
