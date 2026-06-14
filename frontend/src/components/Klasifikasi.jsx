import { useEffect, useState, useMemo } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Cpu, RefreshCw, CheckCircle2, Clock, ChevronLeft, ChevronRight, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const ITEMS_PER_PAGE = 10;

export default function Klasifikasi({ onLogout }) {
  const [dataBaru, setDataBaru] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [classifyStatus, setClassifyStatus] = useState(null); // "success" | "error" | null
  const [classifyMsg, setClassifyMsg] = useState("");
  const [jumlahDiklasifikasi, setJumlahDiklasifikasi] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch hanya data_baru.json ──
  const fetchData = () => {
    setLoading(true);
    fetch("/api/data-baru")
      .then((r) => r.json())
      .then((baru) => {
        setDataBaru(Array.isArray(baru) ? baru : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Filter pencarian ──
  const filteredData = useMemo(
    () =>
      dataBaru.filter(
        (item) =>
          item.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.nama?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [dataBaru, searchTerm],
  );

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // ── Klasifikasi: kirim ke backend → hasil append ke final_processed.json ──
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
        const jml = json.jumlah ?? dataBaru.length;
        setJumlahDiklasifikasi(jml);
        setClassifyStatus("success");
        setClassifyMsg(`${jml} pengaduan berhasil diklasifikasi dan ditambahkan ke Data Pengaduan.`);
        fetchData(); // refresh data_baru
      } else {
        setClassifyStatus("error");
        setClassifyMsg(json.error ?? "Klasifikasi gagal. Coba lagi.");
      }
    } catch {
      setClassifyStatus("error");
      setClassifyMsg("Tidak dapat terhubung ke server.");
    } finally {
      setClassifying(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 ml-64">
        <Header />

        <main className="p-8">
          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Klasifikasi Pengaduan</h2>
              <p className="text-sm text-gray-500 mt-1">
                Pengaduan masuk dari WhatsApp chatbot — klasifikasikan menggunakan model Random Forest
              </p>
            </div>
            <Button
              onClick={handleKlasifikasi}
              disabled={classifying || dataBaru.length === 0}
              className="bg-[#2E7D32] hover:bg-green-800 text-white gap-2 px-5"
            >
              {classifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
              {classifying ? "Mengklasifikasi..." : "Klasifikasi Sekarang"}
            </Button>
          </div>

          {/* ── Status cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-yellow-400">
              <p className="text-sm text-gray-500">Menunggu Klasifikasi</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{dataBaru.length}</p>
              <p className="text-xs text-gray-400 mt-1">Data baru dari WhatsApp (data_baru.json)</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-5 border-l-4 border-green-500">
              <p className="text-sm text-gray-500">Berhasil Diklasifikasi (sesi ini)</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{jumlahDiklasifikasi}</p>
              <p className="text-xs text-gray-400 mt-1">Hasil masuk ke halaman Data Pengaduan</p>
            </div>
          </div>

          {/* ── Notifikasi hasil ── */}
          {classifyStatus === "success" && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-300 text-green-800 rounded-xl px-4 py-3 mb-5 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{classifyMsg}</span>
              <ArrowRight className="w-4 h-4 ml-auto shrink-0 opacity-60" />
              <span className="text-green-600 font-medium whitespace-nowrap">Lihat di Data Pengaduan</span>
            </div>
          )}
          {classifyStatus === "error" && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {classifyMsg}
            </div>
          )}

          {/* ── Tabel data baru ── */}
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-gray-700">Daftar Pengaduan Baru</h3>
                <p className="text-xs text-gray-400 mt-0.5">Sumber: data_baru.json — belum diklasifikasi</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchData} className="text-gray-400 hover:text-green-700 transition-colors" title="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400">
                  {filteredData.length} dari {dataBaru.length} data
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="mb-5">
              <Input
                placeholder="Cari nama atau deskripsi..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {loading ? (
              <p className="text-gray-400 text-center py-12">Memuat data...</p>
            ) : dataBaru.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada pengaduan baru dari WhatsApp</p>
                <p className="text-sm mt-1">Pengaduan yang dikirim lewat chatbot akan muncul di sini</p>
              </div>
            ) : filteredData.length === 0 ? (
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
                        <th className="p-3 text-left font-semibold">Deskripsi Pengaduan</th>
                        <th className="p-3 text-left font-semibold">Waktu Masuk</th>
                        <th className="p-3 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-400">{startIndex + idx + 1}</td>
                          <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{item.nama || "-"}</td>
                          <td className="p-3 text-gray-500 whitespace-nowrap">{(item.no_wa || "-").replace("@c.us", "")}</td>
                          <td className="p-3 text-gray-700 max-w-sm">
                            <p className="line-clamp-2">{item.deskripsi}</p>
                          </td>
                          <td className="p-3 text-gray-400 whitespace-nowrap text-xs">{item.timestamp || "-"}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full">
                              <Clock className="w-3 h-3" />
                              Menunggu Klasifikasi
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
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
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
