import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Filter, Eye, ChevronLeft, ChevronRight, Trash2, MessageCircle, Database } from "lucide-react";
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

// ── Tabel generik ─────────────────────────────────────────────────────────────
function PengaduanTableCard({
  title, subtitle, icon: Icon, borderColor,
  items, total, totalPages, currentPage, loading,
  searchInput, setSearchInput, filterKategori, handleKategori,
  filterStatus, handleStatus, showStatus,
  onNavigate, onDelete, startIndex, setCurrentPage,
}) {
  const displayItems = filterStatus === "semua" ? items : items.filter((i) => (i.status ?? "Menunggu") === filterStatus);

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6" style={{ borderTop: `4px solid ${borderColor}` }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${borderColor}18` }}>
          <Icon className="w-5 h-5" style={{ color: borderColor }} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder="Cari nama atau deskripsi..." value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} className="flex-1 min-w-48" />
        <Select value={filterKategori} onValueChange={handleKategori}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            <SelectItem value="INFRASTRUKTUR">Infrastruktur</SelectItem>
            <SelectItem value="LINGKUNGAN">Lingkungan</SelectItem>
            <SelectItem value="KEAMANAN">Keamanan</SelectItem>
            <SelectItem value="PELAYANAN">Pelayanan</SelectItem>
          </SelectContent>
        </Select>
        {showStatus && (
          <Select value={filterStatus} onValueChange={handleStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="Menunggu">Menunggu</SelectItem>
              <SelectItem value="Diproses">Diproses</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

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
                  {showStatus && <th className="p-3 text-left font-semibold">Status</th>}
                  <th className="p-3 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, idx) => (
                  <tr key={item._id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-400">{startIndex + idx + 1}</td>
                    <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{item.nama || "-"}</td>
                    <td className="p-3 text-gray-700 max-w-xs"><p className="line-clamp-2">{item.deskripsi}</p></td>
                    <td className="p-3">
                      <Badge className={CATEGORY_COLOR[item.kategori_prediksi] ?? "bg-gray-200 text-gray-900"}>
                        {item.kategori_prediksi || "-"}
                      </Badge>
                    </td>
                    {showStatus && (
                      <td className="p-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[item.status ?? "Menunggu"]}`}>
                          {item.status ?? "Menunggu"}
                        </span>
                      </td>
                    )}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => onNavigate(item._id)} className="bg-green-700 hover:bg-green-800 text-white">
                          <Eye className="w-4 h-4 mr-1" />Detail
                        </Button>
                        {onDelete && (
                          <Button size="sm" variant="outline" className="border-red-300 text-red-500 hover:bg-red-50" onClick={() => onDelete(item._id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-400">Halaman {currentPage} dari {totalPages} · {total} total</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1 || loading} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages || loading} onClick={() => setCurrentPage((p) => p + 1)}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DataPengaduan({ onLogout }) {
  const navigate = useNavigate();

  // ── State: Card atas — Pengaduan Baru (dari WhatsApp) ──
  const [newItems, setNewItems]       = useState([]);
  const [newTotal, setNewTotal]       = useState(0);
  const [newTotalPages, setNewTotalPages] = useState(1);
  const [newPage, setNewPage]         = useState(1);
  const [newSearch, setNewSearch]     = useState("");
  const [newSearchTerm, setNewSearchTerm] = useState("");
  const [newKat, setNewKat]           = useState("semua");
  const [newStatus, setNewStatus]     = useState("semua");
  const [newLoading, setNewLoading]   = useState(true);

  // ── State: Card bawah — Data Latih (1200 data) ──
  const [trainItems, setTrainItems]     = useState([]);
  const [trainTotal, setTrainTotal]     = useState(0);
  const [trainTotalPages, setTrainTotalPages] = useState(1);
  const [trainPage, setTrainPage]       = useState(1);
  const [trainSearch, setTrainSearch]   = useState("");
  const [trainSearchTerm, setTrainSearchTerm] = useState("");
  const [trainKat, setTrainKat]         = useState("semua");
  const [trainLoading, setTrainLoading] = useState(true);

  // Modal hapus
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  // ── Fetch data pengaduan baru yang sudah diklasifikasi dari WhatsApp ──
  const fetchNew = useCallback((page, search, kategori) => {
    setNewLoading(true);
    const p = new URLSearchParams({ page, limit: LIMIT, ...(search && { search }), ...(kategori !== "semua" && { kategori }) });
    // Fetch all classified complaints then filter for WhatsApp bot data (yang sudah ada no_wa)
    fetch(`/api/pengaduan?${p}`)
      .then((r) => r.json())
      .then((res) => { 
        // Filter hanya data yang sudah diklasifikasi dari WhatsApp bot 
        // (ada no_wa dan sudah ada kategori_prediksi)
        const whatsappComplaints = (res.items || []).filter(item => 
          item.no_wa && 
          item.kategori_prediksi && 
          item.kategori_prediksi !== '-' &&
          (item.no_wa.includes('@c.us') || item.no_wa.length > 10)
        );
        setNewItems(whatsappComplaints); 
        setNewTotal(whatsappComplaints.length); 
        setNewTotalPages(Math.ceil(whatsappComplaints.length / LIMIT) || 1); 
        setNewLoading(false); 
      })
      .catch(() => setNewLoading(false));
  }, []);

  // ── Fetch data latih berlabel ──
  const fetchTrain = useCallback((page, search, kategori) => {
    setTrainLoading(true);
    const p = new URLSearchParams({ page, limit: LIMIT, ...(search && { search }), ...(kategori !== "semua" && { kategori }) });
    fetch(`/api/dataset-latih?${p}`)
      .then((r) => r.json())
      .then((res) => { setTrainItems(res.items ?? []); setTrainTotal(res.total ?? 0); setTrainTotalPages(res.totalPages ?? 1); setTrainLoading(false); })
      .catch(() => setTrainLoading(false));
  }, []);

  useEffect(() => { fetchNew(newPage, newSearchTerm, newKat); }, [newPage, newSearchTerm, newKat, fetchNew]);
  useEffect(() => { fetchTrain(trainPage, trainSearchTerm, trainKat); }, [trainPage, trainSearchTerm, trainKat, fetchTrain]);

  useEffect(() => { const t = setTimeout(() => { setNewSearchTerm(newSearch); setNewPage(1); }, 400); return () => clearTimeout(t); }, [newSearch]);
  useEffect(() => { const t = setTimeout(() => { setTrainSearchTerm(trainSearch); setTrainPage(1); }, 400); return () => clearTimeout(t); }, [trainSearch]);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pengaduan/${id}`, { method: "DELETE" });
      if (res.ok) { setConfirmDelete(null); fetchNew(newPage, newSearchTerm, newKat); }
    } finally { setDeleting(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 space-y-8">

          {/* Modal hapus */}
          {confirmDelete !== null && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
                <h3 className="font-bold text-gray-800 text-lg mb-2">Hapus Pengaduan?</h3>
                <p className="text-sm text-gray-500 mb-6">Data akan dihapus permanen.</p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)} disabled={deleting}>Batal</Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(confirmDelete)} disabled={deleting}>
                    {deleting ? "Menghapus..." : "Ya, Hapus"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Card atas: Pengaduan Baru yang Sudah Diklasifikasi */}
          <PengaduanTableCard
            title="Data Pengaduan Baru (Terklasifikasi)"
            subtitle={`Pengaduan dari WhatsApp bot yang sudah diklasifikasi — ${newTotal} pengaduan`}
            icon={MessageCircle}
            borderColor="#2E7D32"
            items={newItems}
            total={newTotal}
            totalPages={newTotalPages}
            currentPage={newPage}
            loading={newLoading}
            searchInput={newSearch}
            setSearchInput={setNewSearch}
            filterKategori={newKat}
            handleKategori={(v) => { setNewKat(v); setNewPage(1); }}
            filterStatus={newStatus}
            handleStatus={(v) => setNewStatus(v)}
            showStatus={true}
            onNavigate={(id) => navigate(`/detail-pengaduan/${id}`)}
            onDelete={null}
            startIndex={(newPage - 1) * LIMIT}
            setCurrentPage={setNewPage}
          />

          {/* Card bawah: Data Klasifikasi (Dataset Berlabel) */}
          <PengaduanTableCard
            title="Data Klasifikasi (Dataset Berlabel)"
            subtitle={`1.200 data latih yang digunakan untuk training model — ${trainTotal} total`}
            icon={Database}
            borderColor="#1976D2"
            items={trainItems}
            total={trainTotal}
            totalPages={trainTotalPages}
            currentPage={trainPage}
            loading={trainLoading}
            searchInput={trainSearch}
            setSearchInput={setTrainSearch}
            filterKategori={trainKat}
            handleKategori={(v) => { setTrainKat(v); setTrainPage(1); }}
            filterStatus="semua"
            handleStatus={() => {}}
            showStatus={false}
            onNavigate={(id) => navigate(`/detail-dataset/${id}`)}
            onDelete={null}
            startIndex={(trainPage - 1) * LIMIT}
            setCurrentPage={setTrainPage}
          />

        </main>
      </div>
    </div>
  );
}
